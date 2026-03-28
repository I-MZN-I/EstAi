/**
 * EstAi — Random Forest Inference Engine (pure TypeScript)
 *
 * Loads the trained Random Forest model from Data/rf_model.json
 * and performs predictions without any Python or external ML libraries.
 */

import fs from "fs";
import path from "path";

// ─── Types for the serialised model ──────────────────────────────────────────

interface TreeLeaf {
  v: number; // predicted value
}

interface TreeNode {
  f: number;     // feature index
  t: number;     // threshold
  l: TreeNode | TreeLeaf;  // left child (<=)
  r: TreeNode | TreeLeaf;  // right child (>)
}

type Tree = TreeNode | TreeLeaf;

interface RFModel {
  modelType: string;
  nEstimators: number;
  featureNames: string[];
  categoryMaps: Record<string, Record<string, number>>;
  medians: Record<string, number>;
  featureImportances: Record<string, number>;
  trees: Tree[];
  trainingStats: {
    nSamples: number;
    nFeatures: number;
    targetMin: number;
    targetMax: number;
    targetMedian: number;
    targetMean: number;
    cvR2Mean: number;
    cvMAE: number;
  };
}

export interface RFPrediction {
  predicted: number;
  minPrice: number;
  maxPrice: number;
  featureImportances: Record<string, number>;
  treePredictions: number[];
}

// ─── Load model (cached after first call) ────────────────────────────────────

let cachedModel: RFModel | null = null;

function getModel(): RFModel {
  if (cachedModel) return cachedModel;

  const modelPath = path.join(process.cwd(), "Data", "rf_model.json");
  if (!fs.existsSync(modelPath)) {
    throw new Error(
      `RF model file not found at ${modelPath}.\n` +
      `Run "python scripts/train_model.py" to generate it.`
    );
  }

  const raw = fs.readFileSync(modelPath, "utf-8");
  cachedModel = JSON.parse(raw) as RFModel;
  return cachedModel;
}

// ─── Tree traversal ──────────────────────────────────────────────────────────

function isLeaf(node: Tree): node is TreeLeaf {
  return "v" in node;
}

function traverseTree(node: Tree, features: number[]): number {
  if (isLeaf(node)) return node.v;

  const featureValue = features[node.f];
  if (featureValue <= node.t) {
    return traverseTree(node.l, features);
  } else {
    return traverseTree(node.r, features);
  }
}

// ─── Feature encoding ────────────────────────────────────────────────────────

export interface RFInput {
  propertyType: string;
  city: string;
  sqft?: number;
  cent?: number;
  distanceFromTown: number;
  totalFloors?: number;
  bathroom?: number;
  bedroom?: number;
  furnished?: number;
  roadFacility?: number;
  landmarkType?: string;
}

/**
 * Encode a categorical value using the model's category map.
 * Falls back to 0 if the category is not found.
 */
function encodeCategory(
  categoryMaps: Record<string, Record<string, number>>,
  feature: string,
  value: string
): number {
  const map = categoryMaps[feature];
  if (!map) return 0;

  const normalized = value.trim().toLowerCase();

  // Exact match
  if (normalized in map) return map[normalized];

  // Fuzzy match: find the closest category
  for (const [key, idx] of Object.entries(map)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return idx;
    }
  }

  // Default to "unknown" if present, else 0
  return map["unknown"] ?? 0;
}

/**
 * Convert user-facing input to the feature vector expected by the model.
 * Feature order must match: featureNames from the training.
 */
function encodeInput(input: RFInput, model: RFModel): number[] {
  const m = model.medians;

  // Map property type names to dataset format
  const propTypeMap: Record<string, string> = {
    "Residential House": "residential house",
    "Apartment/Flat": "apartment/flat",
    "Land": "land",
    "Commercial Building": "commercial building",
    "Parking Land": "land/plot",
    "Shop / Other": "toys shop",
  };

  const propertyType = propTypeMap[input.propertyType] ?? input.propertyType.toLowerCase();

  // Encode each feature in the exact order used during training
  const features: number[] = [
    input.sqft ?? m.sqft,                          // sqft
    input.cent ?? m.cent,                          // cent
    input.distanceFromTown,                        // distance_from_town
    input.totalFloors ?? m.total_floors,           // total_floors
    input.bathroom ?? m.bathroom,                  // bathroom
    input.bedroom ?? m.bedroom,                    // bedroom
    input.furnished ?? m.furnished,                // furnished
    input.roadFacility ?? m.road_facility,         // road_facility
    encodeCategory(model.categoryMaps, "property_type", propertyType),       // property_type_encoded
    encodeCategory(model.categoryMaps, "city", input.city),                  // city_encoded
    encodeCategory(model.categoryMaps, "type_of_landmark", input.landmarkType ?? "unknown"), // type_of_landmark_encoded
  ];

  return features;
}

// ─── Main prediction function ────────────────────────────────────────────────

export async function predict(input: RFInput): Promise<RFPrediction> {
  const model = getModel();
  const features = encodeInput(input, model);

  // Run through all trees
  const treePredictions = model.trees.map((tree) => traverseTree(tree, features));

  // Average prediction (Random Forest = mean of all tree predictions)
  const predicted = treePredictions.reduce((sum, p) => sum + p, 0) / treePredictions.length;

  // Compute prediction interval from tree distribution
  const sorted = [...treePredictions].sort((a, b) => a - b);
  const p10 = sorted[Math.floor(sorted.length * 0.10)];
  const p90 = sorted[Math.floor(sorted.length * 0.90)];

  // Use the 10th-90th percentile range, but cap the spread to ₹6L
  let minPrice = p10;
  let maxPrice = p90;
  const spread = maxPrice - minPrice;

  if (spread > 600000) {
    const mid = predicted;
    minPrice = mid - 300000;
    maxPrice = mid + 300000;
  }

  // Ensure minimum ₹0
  minPrice = Math.max(0, minPrice);

  // Round to nearest ₹50,000
  minPrice = Math.round(minPrice / 50000) * 50000;
  maxPrice = Math.round(maxPrice / 50000) * 50000;

  return {
    predicted: Math.round(predicted / 25000) * 25000,
    minPrice,
    maxPrice,
    featureImportances: model.featureImportances,
    treePredictions,
  };
}

export async function getModelStats() {
  const model = getModel();
  return model.trainingStats;
}

export async function getFeatureImportances() {
  const model = getModel();
  return model.featureImportances;
}
