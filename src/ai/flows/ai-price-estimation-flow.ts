"use server";

/**
 * EstAi — Property Price Estimator (Random Forest)
 *
 * Uses a locally trained Random Forest model for data-driven
 * Kerala real estate price estimation. No external API calls needed.
 *
 * Model: Data/rf_model.json (trained from Data/Estai_dataset_main.xlsx)
 * Training: python scripts/train_model.py
 */

import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";
import {
  predict,
  getModelStats,
  getFeatureImportances,
  type RFInput,
} from "@/ai/random-forest-inference";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PropertyInput {
  propertyType: string;
  city: string;
  cent?: number;
  sqft?: number;
  totalFloors?: number;
  bedroom?: number;
  bathroom?: number;
  /** 0=Unfurnished  1=Semi-furnished  2=Fully furnished */
  furnished?: 0 | 1 | 2;
  /** Distance from nearest town centre in metres */
  distanceFromTown: number;
  /** 1=Kutcha/Mud  2=Paved/WBM  3=Tarred  4=NH/SH */
  roadFacility?: string;
  nearestLandmarkType?: string;
  /** Monthly rental income in ₹ */
  monthlyIncome?: number;
}

export interface ComparableProperty {
  type: string;
  city: string;
  sqft: number | null;
  cent: number | null;
  bedroom: string | null;
  bathroom: string | null;
  furnished: number | null;
  distFromTown: number | null;
  road: string | null;
  landmarkType: string | null;
  price: number | null;
  pricePerCent: number | null;
  similarityNote: string;
}

export interface PriceFactor {
  factor: string;
  impact: "positive" | "negative" | "neutral";
  description: string;
  adjustment: string;
}

export interface PriceEstimation {
  minPrice: number;
  maxPrice: number;
  midPrice: number;
  reasoning: string;
  confidence: "high" | "medium" | "low";
  comparables: ComparableProperty[];
  factors: PriceFactor[];
  datasetSize: number;
}

// ─── Dataset path ─────────────────────────────────────────────────────────────

const DATASET_PATH = path.join(process.cwd(), "Data", "Estai_dataset_main.xlsx");

// ─── Dataset loader for comparables ───────────────────────────────────────────

interface DatasetRow {
  property_type: string;
  city: string;
  sqft: number | null;
  cent: number | null;
  distance_from_town: number | null;
  total_floors: number | null;
  bathroom: number | null;
  bedroom: number | null;
  furnished: number | null;
  road_facility: number | null;
  type_of_landmark: string | null;
  nearest_landmark: string | null;
  total_price: number | null;
  price_per_cent: number | null;
}

let cachedDataset: DatasetRow[] | null = null;

function loadDataset(): DatasetRow[] {
  if (cachedDataset) return cachedDataset;

  if (!fs.existsSync(DATASET_PATH)) {
    throw new Error(
      `Dataset file not found at ${DATASET_PATH}.\n` +
      `Make sure "Data/Estai_dataset_main.xlsx" exists in your project root.`
    );
  }

  const buffer = fs.readFileSync(DATASET_PATH);
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const targetSheets = ["Chart1", "real", "fake"];
  let allRows: Record<string, unknown>[] = [];

  for (const sheetName of workbook.SheetNames) {
    if (targetSheets.includes(sheetName)) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: null,
        raw: false,
      });
      allRows = allRows.concat(rows);
    }
  }

  if (allRows.length === 0) {
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    allRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
      raw: false,
    });
  }

  cachedDataset = allRows.map((row) => {
    const r: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      r[k.trim().toLowerCase()] = v;
    }

    const parseNum = (val: unknown): number | null => {
      if (val === null || val === undefined || val === "NULL" || val === "") return null;
      const n = Number(val);
      return isNaN(n) ? null : n;
    };

    return {
      property_type: String(r["property_type"] ?? "unknown"),
      city: String(r["city"] ?? "unknown"),
      sqft: parseNum(r["sqft"]),
      cent: parseNum(r["cent"]),
      distance_from_town: parseNum(r["distance_from_town(meters)"] ?? r["distance_from_town"]),
      total_floors: parseNum(r["total_floors"]),
      bathroom: parseNum(r["bathroom"]),
      bedroom: parseNum(r["bedroom"]),
      furnished: parseNum(r["furnished"]),
      road_facility: parseNum(r["road_facility"]),
      type_of_landmark: r["type_of_landmark"] ? String(r["type_of_landmark"]) : null,
      nearest_landmark: r["nearest_landmark"] ? String(r["nearest_landmark"]) : null,
      total_price: parseNum(r["total_price"]),
      price_per_cent: parseNum(r["price_per_cent"]),
    };
  });

  return cachedDataset;
}

// ─── Comparable property finder ───────────────────────────────────────────────

function findComparables(input: PropertyInput, dataset: DatasetRow[]): ComparableProperty[] {
  const inputType = input.propertyType.toLowerCase();
  const inputCity = input.city.toLowerCase();

  // Score each row by similarity
  const scored = dataset
    .filter((row) => row.total_price != null && row.total_price > 0)
    .map((row) => {
      let score = 0;

      // Property type match (highest weight)
      if (row.property_type.toLowerCase().includes(inputType) ||
          inputType.includes(row.property_type.toLowerCase())) {
        score += 50;
      }

      // City match
      if (row.city.toLowerCase() === inputCity) {
        score += 30;
      }

      // Cent similarity (within 50%)
      if (input.cent != null && row.cent != null && row.cent > 0) {
        const ratio = Math.min(input.cent, row.cent) / Math.max(input.cent, row.cent);
        score += ratio * 20;
      }

      // Sqft similarity
      if (input.sqft != null && row.sqft != null && row.sqft > 0) {
        const ratio = Math.min(input.sqft, row.sqft) / Math.max(input.sqft, row.sqft);
        score += ratio * 15;
      }

      // Bedroom match
      if (input.bedroom != null && row.bedroom != null) {
        if (input.bedroom === row.bedroom) score += 10;
        else if (Math.abs(input.bedroom - row.bedroom) === 1) score += 5;
      }

      // Distance similarity
      if (row.distance_from_town != null) {
        const dist = Math.abs(input.distanceFromTown - row.distance_from_town);
        if (dist < 500) score += 10;
        else if (dist < 1000) score += 5;
      }

      // Build similarity note
      const notes: string[] = [];
      if (row.property_type.toLowerCase().includes(inputType)) notes.push("same type");
      if (row.city.toLowerCase() === inputCity) notes.push("same city");
      if (input.cent && row.cent && Math.abs(input.cent - row.cent) / input.cent < 0.3) notes.push("similar land size");
      if (input.sqft && row.sqft && Math.abs(input.sqft - row.sqft) / input.sqft < 0.3) notes.push("similar built area");
      if (input.bedroom && row.bedroom && input.bedroom === row.bedroom) notes.push("same bedrooms");

      const similarityNote = notes.length > 0
        ? `Comparable: ${notes.join(", ")}`
        : "Partial match based on overall characteristics";

      return { row, score, similarityNote };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored.map((s) => ({
    type: s.row.property_type,
    city: s.row.city,
    sqft: s.row.sqft,
    cent: s.row.cent,
    bedroom: s.row.bedroom != null ? String(s.row.bedroom) : null,
    bathroom: s.row.bathroom != null ? String(s.row.bathroom) : null,
    furnished: s.row.furnished,
    distFromTown: s.row.distance_from_town,
    road: s.row.road_facility != null ? String(s.row.road_facility) : null,
    landmarkType: s.row.type_of_landmark,
    price: s.row.total_price,
    pricePerCent: s.row.price_per_cent,
    similarityNote: s.similarityNote,
  }));
}

// ─── Factor analysis ──────────────────────────────────────────────────────────

async function analyzeFactors(input: PropertyInput): Promise<PriceFactor[]> {
  const factors: PriceFactor[] = [];
  const importances = await getFeatureImportances();

  // Land area factor
  if (input.cent != null) {
    const imp = importances["cent"] ?? 0;
    const pct = Math.round(imp * 100);
    factors.push({
      factor: `Land Area — ${input.cent} cents`,
      impact: "neutral",
      description: `Land size is the strongest pricing factor (${pct}% importance). Your property has ${input.cent} cents.`,
      adjustment: "Base price driver",
    });
  }

  // Built-up area
  if (input.sqft != null) {
    const imp = importances["sqft"] ?? 0;
    const pct = Math.round(imp * 100);
    factors.push({
      factor: `Built-up Area — ${input.sqft} sqft`,
      impact: "neutral",
      description: `Built-up area contributes ${pct}% to the prediction. ${input.sqft} sqft of constructed space.`,
      adjustment: "Base price driver",
    });
  }

  // Location distance
  if (input.distanceFromTown < 1000) {
    factors.push({
      factor: `Location — ${input.distanceFromTown}m from town`,
      impact: "positive",
      description: "Property is close to town centre, which typically commands a premium.",
      adjustment: "+5% to +10%",
    });
  } else if (input.distanceFromTown > 3000) {
    factors.push({
      factor: `Location — ${input.distanceFromTown}m from town`,
      impact: "negative",
      description: "Property is far from town centre, which may reduce demand.",
      adjustment: "-5% to -10%",
    });
  } else {
    factors.push({
      factor: `Location — ${input.distanceFromTown}m from town`,
      impact: "neutral",
      description: "Moderate distance from town centre.",
      adjustment: "No significant adjustment",
    });
  }

  // Furnished status
  const furnished = input.furnished ?? 0;
  if (furnished === 2) {
    factors.push({
      factor: "Fully Furnished",
      impact: "positive",
      description: "Fully furnished properties command a premium of 8-12% over unfurnished ones.",
      adjustment: "+8% to +12%",
    });
  } else if (furnished === 1) {
    factors.push({
      factor: "Semi-Furnished",
      impact: "positive",
      description: "Semi-furnished properties have a slight premium over unfurnished ones.",
      adjustment: "+3% to +5%",
    });
  } else {
    factors.push({
      factor: "Unfurnished",
      impact: "neutral",
      description: "No furnishing premium applied.",
      adjustment: "No adjustment",
    });
  }

  // Road facility
  const road = parseInt(input.roadFacility ?? "3");
  if (road === 4) {
    factors.push({
      factor: "Road — National/State Highway",
      impact: "positive",
      description: "Highway frontage significantly increases accessibility and value.",
      adjustment: "+7% to +10%",
    });
  } else if (road <= 1) {
    factors.push({
      factor: "Road — Kutcha/Mud road",
      impact: "negative",
      description: "Poor road access reduces overall property value.",
      adjustment: "-5% to -8%",
    });
  }

  // City factor
  factors.push({
    factor: `City — ${input.city}`,
    impact: "neutral",
    description: `Location-specific pricing based on ${input.city} market conditions from the dataset.`,
    adjustment: "Market-adjusted",
  });

  // Rental income
  if (input.monthlyIncome && input.monthlyIncome > 0) {
    factors.push({
      factor: `Rental Income — Rs.${input.monthlyIncome.toLocaleString()}/month`,
      impact: "positive",
      description: `Active rental income of Rs.${input.monthlyIncome.toLocaleString()} adds investment value. Capitalised at ~7% yield.`,
      adjustment: `+Rs.${Math.round((input.monthlyIncome * 12) / 0.07).toLocaleString()} (yield basis)`,
    });
  }

  return factors;
}

// ─── Confidence determination ─────────────────────────────────────────────────

function determineConfidence(
  input: PropertyInput,
  comparables: ComparableProperty[],
  dataset: DatasetRow[]
): "high" | "medium" | "low" {
  const inputCity = input.city.toLowerCase();
  const cityMatchCount = dataset.filter(
    (r) => r.city.toLowerCase() === inputCity && r.total_price != null
  ).length;

  // High confidence: city in dataset and multiple comparables
  if (cityMatchCount >= 10 && comparables.length >= 3) return "high";
  // Medium: some matches
  if (cityMatchCount >= 3 || comparables.length >= 2) return "medium";
  // Low: few or no matches
  return "low";
}

// ─── Reasoning generator ─────────────────────────────────────────────────────

function generateReasoning(
  input: PropertyInput,
  prediction: { predicted: number; minPrice: number; maxPrice: number },
  confidence: "high" | "medium" | "low",
  comparables: ComparableProperty[],
  dataset: DatasetRow[]
): string {
  const inputCity = input.city.toLowerCase();
  const cityMatches = dataset.filter(
    (r) => r.city.toLowerCase() === inputCity && r.total_price != null
  ).length;

  const fmtPrice = (n: number) => {
    if (n >= 10000000) return `Rs.${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `Rs.${(n / 100000).toFixed(1)} L`;
    return `Rs.${n.toLocaleString()}`;
  };

  let reasoning = `Based on ${dataset.length} property records, the Random Forest model estimates this ${input.propertyType} in ${input.city}`;

  if (input.cent) reasoning += ` on ${input.cent} cents of land`;
  if (input.sqft) reasoning += ` with ${input.sqft} sqft built-up area`;

  reasoning += ` at approximately ${fmtPrice(prediction.predicted)}.`;

  if (cityMatches > 0) {
    reasoning += ` The model found ${cityMatches} comparable records in ${input.city}.`;
  } else {
    reasoning += ` No exact records found for ${input.city}; estimate is based on similar markets in the dataset.`;
  }

  if (confidence === "low") {
    reasoning += " Confidence is low due to limited comparable data — consider this a rough estimate.";
  }

  return reasoning;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function estimatePropertyPrice(
  input: PropertyInput
): Promise<PriceEstimation> {
  // Load dataset for comparables
  const dataset = loadDataset();

  // Build RF input
  const rfInput: RFInput = {
    propertyType: input.propertyType,
    city: input.city,
    sqft: input.sqft,
    cent: input.cent,
    distanceFromTown: input.distanceFromTown,
    totalFloors: input.totalFloors,
    bathroom: input.bathroom,
    bedroom: input.bedroom,
    furnished: input.furnished ?? 0,
    roadFacility: parseInt(input.roadFacility ?? "3"),
    landmarkType: input.nearestLandmarkType,
  };

  // Predict
  const prediction = await predict(rfInput);

  // Find comparables
  const comparables = findComparables(input, dataset);

  // Analyze factors
  const factors = await analyzeFactors(input);

  // Determine confidence
  const confidence = determineConfidence(input, comparables, dataset);

  // Generate reasoning
  const reasoning = generateReasoning(input, prediction, confidence, comparables, dataset);

  return {
    minPrice: prediction.minPrice,
    maxPrice: prediction.maxPrice,
    midPrice: prediction.predicted,
    reasoning,
    confidence,
    comparables,
    factors,
    datasetSize: dataset.length,
  };
}
