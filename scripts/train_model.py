"""
EstAi — Random Forest Regressor Training Script

Reads all 3 sheets (Chart1, real, fake) from Data/Estai_dataset_main.xlsx,
trains a RandomForestRegressor, and exports the model as Data/rf_model.json
for use by the TypeScript inference engine at runtime.

Usage:
    python scripts/train_model.py
"""

import json
import os
import sys
import math

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_score

# ── Paths ──────────────────────────────────────────────────────────────────────

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DATASET_PATH = os.path.join(PROJECT_ROOT, "Data", "Estai_dataset_main.xlsx")
MODEL_OUTPUT_PATH = os.path.join(PROJECT_ROOT, "Data", "rf_model.json")

# ── Feature columns ───────────────────────────────────────────────────────────

NUMERIC_FEATURES = [
    "sqft", "cent", "distance_from_town", "total_floors",
    "bathroom", "bedroom", "furnished", "road_facility",
]

CATEGORICAL_FEATURES = [
    "property_type", "city", "type_of_landmark",
]

TARGET = "total_price"


# ── Load & normalise ──────────────────────────────────────────────────────────

def load_dataset() -> pd.DataFrame:
    """Load all 3 sheets and unify column names."""
    xls = pd.ExcelFile(DATASET_PATH)
    frames = []

    for sheet in xls.sheet_names:
        if sheet not in ("Chart1", "real", "fake"):
            continue
        df = pd.read_excel(xls, sheet_name=sheet, engine="openpyxl")
        # Normalise column names: lowercase, strip
        df.columns = [c.strip().lower() for c in df.columns]
        frames.append(df)

    combined = pd.concat(frames, ignore_index=True)

    # Unify column name variants
    rename_map = {
        "property_type": "property_type",
        "distance_from_town(meters)": "distance_from_town",
        "distance_from_town": "distance_from_town",
        "road_facility": "road_facility",
        "total_price": "total_price",
        "price_per_cent": "price_per_cent",
        "nearest_landmark": "nearest_landmark",
        "type_of_landmark": "type_of_landmark",
        "income_from_property": "income_from_property",
    }

    existing_cols = set(combined.columns)
    for old, new in rename_map.items():
        if old in existing_cols and old != new:
            combined.rename(columns={old: new}, inplace=True)

    return combined


def prepare_features(df: pd.DataFrame):
    """
    Encode categorical features and fill missing numerics.
    Returns (X, y, category_maps, feature_names, medians).
    """
    # Replace "NULL" strings with NaN
    df.replace("NULL", np.nan, inplace=True)

    # Convert numeric columns
    for col in NUMERIC_FEATURES + [TARGET]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Drop rows without a valid target
    df = df.dropna(subset=[TARGET])
    df = df[df[TARGET] > 0]

    # Fill missing numerics with median
    medians = {}
    for col in NUMERIC_FEATURES:
        if col in df.columns:
            med = df[col].median()
            medians[col] = float(med) if not pd.isna(med) else 0.0
            df[col] = df[col].fillna(medians[col])
        else:
            medians[col] = 0.0
            df[col] = 0.0

    # Build category maps (string → integer index)
    category_maps = {}
    for col in CATEGORICAL_FEATURES:
        if col in df.columns:
            df[col] = df[col].fillna("unknown").astype(str).str.strip().str.lower()
            categories = sorted(df[col].unique().tolist())
            cat_map = {cat: idx for idx, cat in enumerate(categories)}
            category_maps[col] = cat_map
            df[col + "_encoded"] = df[col].map(cat_map).fillna(0).astype(int)
        else:
            category_maps[col] = {"unknown": 0}
            df[col + "_encoded"] = 0

    # Build feature matrix
    feature_names = list(NUMERIC_FEATURES) + [c + "_encoded" for c in CATEGORICAL_FEATURES]
    X = df[feature_names].values.astype(np.float64)
    y = df[TARGET].values.astype(np.float64)

    return X, y, category_maps, feature_names, medians, df


# ── Tree export ────────────────────────────────────────────────────────────────

def export_tree(tree, feature_names):
    """Convert a sklearn DecisionTree to a JSON-serialisable dict."""
    t = tree.tree_

    def recurse(node_id):
        if t.children_left[node_id] == -1:  # leaf
            # For regression, value is the predicted mean
            return {"v": round(float(t.value[node_id][0][0]), 2)}
        else:
            return {
                "f": int(t.feature[node_id]),          # feature index
                "t": round(float(t.threshold[node_id]), 6),  # threshold
                "l": recurse(int(t.children_left[node_id])),  # left child (<=)
                "r": recurse(int(t.children_right[node_id])), # right child (>)
            }

    return recurse(0)


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("EstAi — Random Forest Model Training")
    print("=" * 60)

    # Load
    print(f"\n[1/5] Loading dataset from: {DATASET_PATH}")
    df_raw = load_dataset()
    print(f"   Total rows loaded: {len(df_raw)}")

    # Prepare
    print("\n[2/5] Preparing features...")
    X, y, category_maps, feature_names, medians, df_clean = prepare_features(df_raw.copy())
    print(f"   Training samples:  {X.shape[0]}")
    print(f"   Features:          {X.shape[1]}")
    print(f"   Feature names:     {feature_names}")
    print(f"   Target range:      Rs.{y.min():,.0f} - Rs.{y.max():,.0f}")
    print(f"   Target median:     Rs.{np.median(y):,.0f}")

    # Train
    print("\n[3/5] Training Random Forest Regressor...")
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X, y)

    # Cross-validation
    print("\n[4/5] Cross-validation (5-fold)...")
    cv_scores = cross_val_score(model, X, y, cv=5, scoring="r2")
    print(f"   R2 scores:   {[f'{s:.4f}' for s in cv_scores]}")
    print(f"   Mean R2:     {cv_scores.mean():.4f}")
    print(f"   Std R2:      {cv_scores.std():.4f}")

    cv_mae = -cross_val_score(model, X, y, cv=5, scoring="neg_mean_absolute_error")
    print(f"   Mean MAE:    Rs.{cv_mae.mean():,.0f}")

    # Feature importances
    importances = model.feature_importances_
    importance_map = {}
    for name, imp in zip(feature_names, importances):
        # Map encoded feature names back to readable names
        readable = name.replace("_encoded", "")
        importance_map[readable] = round(float(imp), 6)
    print("\nFeature importances:")
    for name, imp in sorted(importance_map.items(), key=lambda x: -x[1]):
        bar = "#" * int(imp * 50)
        print(f"   {name:25s} {imp:.4f} {bar}")

    # Export trees
    print("\n[5/5] Exporting model to JSON...")
    trees_json = []
    for i, estimator in enumerate(model.estimators_):
        trees_json.append(export_tree(estimator, feature_names))

    model_data = {
        "modelType": "RandomForestRegressor",
        "nEstimators": len(trees_json),
        "featureNames": feature_names,
        "categoryMaps": category_maps,
        "medians": medians,
        "featureImportances": importance_map,
        "trees": trees_json,
        "trainingStats": {
            "nSamples": int(X.shape[0]),
            "nFeatures": int(X.shape[1]),
            "targetMin": float(y.min()),
            "targetMax": float(y.max()),
            "targetMedian": float(np.median(y)),
            "targetMean": float(y.mean()),
            "cvR2Mean": float(cv_scores.mean()),
            "cvMAE": float(cv_mae.mean()),
        }
    }

    with open(MODEL_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(model_data, f)

    size_mb = os.path.getsize(MODEL_OUTPUT_PATH) / (1024 * 1024)
    print(f"   Model saved to: {MODEL_OUTPUT_PATH}")
    print(f"   File size:      {size_mb:.2f} MB")
    print(f"\nTraining complete!")


if __name__ == "__main__":
    main()
