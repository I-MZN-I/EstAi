"""
EstAi - Model Evaluation & Report Generation Script (v3)

Clean academic theme. Fixed property-type handling, meaningful
performance-analysis axes, and proper data normalisation.

Usage:
    python scripts/evaluate_model.py
"""

import os
import time
import math

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import (
    cross_val_score,
    train_test_split,
    learning_curve,
)
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    mean_absolute_percentage_error,
)

# -- Paths -------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DATASET_PATH = os.path.join(PROJECT_ROOT, "Data", "Estai_dataset_main.xlsx")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "evaluation_output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -- Academic White Theme ----------------------------------------------------

plt.rcParams.update({
    "figure.facecolor": "white",
    "axes.facecolor": "white",
    "axes.edgecolor": "#333333",
    "axes.labelcolor": "#111111",
    "xtick.color": "#333333",
    "ytick.color": "#333333",
    "text.color": "#111111",
    "grid.color": "#cccccc",
    "font.family": "serif",
    "font.size": 12,
    "axes.titlesize": 14,
    "axes.labelsize": 12,
})

BLUE_CMAP = plt.cm.Blues

# -- Feature columns ---------------------------------------------------------

NUMERIC_FEATURES = [
    "sqft", "cent", "distance_from_town", "total_floors",
    "bathroom", "bedroom", "furnished", "road_facility",
]

CATEGORICAL_FEATURES = [
    "property_type", "city", "type_of_landmark",
]

TARGET = "total_price"

# -- Normalised property-type map  -------------------------------------------

PROPERTY_TYPE_NORMALIZE = {
    "residential house": "Residential House",
    "apartment/flat": "Apartment",
    "apartment": "Apartment",
    "land": "Land",
    "land/plot": "Land",
    "property": "Residential House",
    "commercial building": "Commercial",
    "toys shop": "Commercial",
}


# -- Load & prepare ----------------------------------------------------------

def load_dataset() -> pd.DataFrame:
    """Load all relevant sheets, normalise column names, merge property_type."""
    xls = pd.ExcelFile(DATASET_PATH)
    frames = []
    for sheet in xls.sheet_names:
        if sheet not in ("Chart1", "real", "fake"):
            continue
        df = pd.read_excel(xls, sheet_name=sheet, engine="openpyxl")
        df.columns = [c.strip().lower() for c in df.columns]

        # The 'fake' sheet uses "residential house_type" instead of "property_type"
        if "residential house_type" in df.columns and "property_type" not in df.columns:
            df.rename(columns={"residential house_type": "property_type"}, inplace=True)

        # Rename distance column
        if "distance_from_town(meters)" in df.columns:
            df.rename(columns={"distance_from_town(meters)": "distance_from_town"}, inplace=True)

        frames.append(df)

    combined = pd.concat(frames, ignore_index=True)

    # Normalise property_type
    if "property_type" in combined.columns:
        combined["property_type"] = (
            combined["property_type"]
            .fillna("unknown")
            .astype(str)
            .str.strip()
            .str.lower()
            .map(PROPERTY_TYPE_NORMALIZE)
            .fillna("Other")
        )

    return combined


def prepare_features(df: pd.DataFrame):
    df.replace("NULL", np.nan, inplace=True)
    for col in NUMERIC_FEATURES + [TARGET]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.dropna(subset=[TARGET])
    df = df[df[TARGET] > 0]

    medians = {}
    for col in NUMERIC_FEATURES:
        if col in df.columns:
            med = df[col].median()
            medians[col] = float(med) if not pd.isna(med) else 0.0
            df[col] = df[col].fillna(medians[col])
        else:
            medians[col] = 0.0
            df[col] = 0.0

    category_maps = {}
    for col in CATEGORICAL_FEATURES:
        if col in df.columns:
            df[col] = df[col].fillna("unknown").astype(str).str.strip()
            categories = sorted(df[col].unique().tolist())
            cat_map = {cat: idx for idx, cat in enumerate(categories)}
            category_maps[col] = cat_map
            df[col + "_encoded"] = df[col].map(cat_map).fillna(0).astype(int)
        else:
            category_maps[col] = {"unknown": 0}
            df[col + "_encoded"] = 0

    feature_names = list(NUMERIC_FEATURES) + [c + "_encoded" for c in CATEGORICAL_FEATURES]
    X = df[feature_names].values.astype(np.float64)
    y = df[TARGET].values.astype(np.float64)
    return X, y, category_maps, feature_names, medians, df


# -- Price brackets ----------------------------------------------------------

def price_bracket(price):
    if price < 2500000:
        return "< 25L"
    elif price < 5000000:
        return "25L - 50L"
    elif price < 10000000:
        return "50L - 1Cr"
    else:
        return "> 1Cr"

BRACKET_ORDER = ["< 25L", "25L - 50L", "50L - 1Cr", "> 1Cr"]


# ==============================================================================
#  MAIN
# ==============================================================================

def main():
    print("=" * 60)
    print("EstAi - Model Evaluation & Report Generation (v3)")
    print("=" * 60)

    # -- 1. Load ---------------------------------------------------------------
    print("\n[1/7] Loading dataset...")
    df_raw = load_dataset()
    X, y, category_maps, feature_names, medians, df_clean = prepare_features(df_raw.copy())
    print(f"   Total valid samples: {len(y)}")
    print(f"   Property types: {dict(df_clean['property_type'].value_counts())}")
    print(f"   Cities: {dict(df_clean['city'].value_counts())}")

    # -- 2. Split --------------------------------------------------------------
    print("\n[2/7] Splitting into train/test (80/20)...")
    X_train, X_test, y_train, y_test, idx_train, idx_test = train_test_split(
        X, y, np.arange(len(y)), test_size=0.20, random_state=42
    )
    print(f"   Training: {len(y_train)} | Testing: {len(y_test)}")

    # -- 3. Train --------------------------------------------------------------
    print("\n[3/7] Training Random Forest Regressor...")
    model = RandomForestRegressor(
        n_estimators=100, max_depth=15,
        min_samples_split=5, min_samples_leaf=2,
        random_state=42, n_jobs=-1,
    )
    t0 = time.time()
    model.fit(X_train, y_train)
    train_time = time.time() - t0
    print(f"   Training time: {train_time:.2f}s")

    # -- 4. Predictions + timing -----------------------------------------------
    print("\n[4/7] Running predictions...")
    pred_times = []
    y_pred = np.zeros(len(y_test))
    for i in range(len(X_test)):
        t0 = time.perf_counter()
        y_pred[i] = model.predict(X_test[i:i+1])[0]
        t1 = time.perf_counter()
        pred_times.append((t1 - t0) * 1000)
    avg_pred_time = np.mean(pred_times)
    print(f"   Avg prediction time: {avg_pred_time:.2f} ms")

    # -- 5. Metrics ------------------------------------------------------------
    print("\n[5/7] Computing metrics...")
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = math.sqrt(mean_squared_error(y_test, y_pred))
    mape = mean_absolute_percentage_error(y_test, y_pred) * 100
    print(f"   R2={r2:.4f}  MAE=Rs.{mae:,.0f}  RMSE=Rs.{rmse:,.0f}  MAPE={mape:.2f}%")

    # -- 6. Cross-validation ---------------------------------------------------
    print("\n[6/7] 5-Fold Cross Validation...")
    cv_r2 = cross_val_score(model, X, y, cv=5, scoring="r2")
    cv_mae = -cross_val_score(model, X, y, cv=5, scoring="neg_mean_absolute_error")
    print(f"   CV R2: {[f'{s:.4f}' for s in cv_r2]}  Mean={cv_r2.mean():.4f}")

    # -- 7. Charts  ------------------------------------------------------------
    print("\n[7/7] Generating charts...\n")

    # Map test indices back to property types
    test_prop_types = df_clean.iloc[idx_test]["property_type"].values

    # ======================================================================
    # CHART 1: Confusion Matrix
    # ======================================================================
    actual_brackets = [price_bracket(p) for p in y_test]
    pred_brackets = [price_bracket(p) for p in y_pred]

    n = len(BRACKET_ORDER)
    cm = np.zeros((n, n), dtype=int)
    for a, p in zip(actual_brackets, pred_brackets):
        cm[BRACKET_ORDER.index(a)][BRACKET_ORDER.index(p)] += 1

    fig, ax = plt.subplots(figsize=(7, 6))
    im = ax.imshow(cm, interpolation="nearest", cmap=BLUE_CMAP)
    ax.set_xticks(range(n)); ax.set_yticks(range(n))
    ax.set_xticklabels(BRACKET_ORDER, fontsize=11)
    ax.set_yticklabels(BRACKET_ORDER, fontsize=11)
    ax.set_xlabel("Predicted", fontsize=13, fontweight="bold")
    ax.set_ylabel("Actual", fontsize=13, fontweight="bold")
    ax.set_title("Confusion Matrix", fontsize=15, fontweight="bold")
    thresh = cm.max() / 2.0
    for i in range(n):
        for j in range(n):
            ax.text(j, i, str(cm[i][j]), ha="center", va="center",
                    color="white" if cm[i][j] > thresh else "black",
                    fontsize=14, fontweight="bold")
    plt.colorbar(im, ax=ax, shrink=0.8)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "1_confusion_matrix.png"), dpi=150, bbox_inches="tight")
    plt.close()
    print("   [OK] 1_confusion_matrix.png")

    # ======================================================================
    # CHART 2: Predicted vs Actual
    # ======================================================================
    fig, ax = plt.subplots(figsize=(7, 6))
    ax.scatter(y_test / 1e5, y_pred / 1e5, alpha=0.6, s=40,
               c="#2171b5", edgecolors="black", linewidth=0.4)
    mx = max(y_test.max(), y_pred.max()) / 1e5
    ax.plot([0, mx], [0, mx], "--", color="red", lw=1.5, label="Perfect Prediction")
    ax.set_xlabel("Actual Price (Lakhs)", fontsize=13, fontweight="bold")
    ax.set_ylabel("Predicted Price (Lakhs)", fontsize=13, fontweight="bold")
    ax.set_title("Predicted vs Actual Property Prices", fontsize=15, fontweight="bold")
    ax.legend(fontsize=10); ax.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "2_predicted_vs_actual.png"), dpi=150, bbox_inches="tight")
    plt.close()
    print("   [OK] 2_predicted_vs_actual.png")

    # ======================================================================
    # CHART 3: Feature Importance
    # ======================================================================
    importances = model.feature_importances_
    readable = [n.replace("_encoded","").replace("_"," ").title() for n in feature_names]
    si = np.argsort(importances)

    fig, ax = plt.subplots(figsize=(8, 5.5))
    colors = ["#2171b5" if importances[i] > 0.05 else "#6baed6" for i in si]
    ax.barh(range(len(si)), importances[si]*100, color=colors, edgecolor="#333", lw=0.5)
    ax.set_yticks(range(len(si)))
    ax.set_yticklabels([readable[i] for i in si], fontsize=10)
    ax.set_xlabel("Importance (%)", fontsize=13, fontweight="bold")
    ax.set_title("Feature Importance Analysis", fontsize=15, fontweight="bold")
    for pos, idx in enumerate(si):
        v = importances[idx]*100
        ax.text(v+0.5, pos, f"{v:.1f}%", va="center", fontsize=9, color="#333")
    ax.grid(True, axis="x", alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "3_feature_importance.png"), dpi=150, bbox_inches="tight")
    plt.close()
    print("   [OK] 3_feature_importance.png")

    # ======================================================================
    # CHART 4: 5-Fold CV R2 Scores
    # ======================================================================
    fig, ax = plt.subplots(figsize=(7, 5))
    folds = ["Fold 1","Fold 2","Fold 3","Fold 4","Fold 5"]
    bars = ax.bar(folds, cv_r2, color="#2171b5", edgecolor="#333", width=0.5)
    ax.axhline(cv_r2.mean(), color="red", lw=1.5, ls="--",
               label=f"Mean R2 = {cv_r2.mean():.4f}")
    ax.set_ylabel("R2 Score", fontsize=13, fontweight="bold")
    ax.set_title("5-Fold Cross-Validation R2 Scores", fontsize=15, fontweight="bold")
    ax.set_ylim(0, 1.0); ax.legend(fontsize=10)
    for bar, sc in zip(bars, cv_r2):
        ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.02,
                f"{sc:.4f}", ha="center", fontsize=10, fontweight="bold")
    ax.grid(True, axis="y", alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "4_cv_r2_scores.png"), dpi=150, bbox_inches="tight")
    plt.close()
    print("   [OK] 4_cv_r2_scores.png")

    # ======================================================================
    # CHART 5: Accuracy by Property Type  (only 3 main types)
    # ======================================================================
    main_types = ["Residential House", "Apartment", "Land"]
    type_r2, type_mae, type_cnt = [], [], []

    for pt in main_types:
        mask = test_prop_types == pt
        if mask.sum() >= 3:
            a = y_test[mask]; p = y_pred[mask]
            r2v = r2_score(a, p)
            type_r2.append(max(0, r2v * 100))
            type_mae.append(mean_absolute_error(a, p) / 1e5)
            type_cnt.append(int(mask.sum()))
        else:
            type_r2.append(0)
            type_mae.append(0)
            type_cnt.append(0)

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

    x = range(len(main_types))
    ax1.bar(x, type_r2, color="#2171b5", edgecolor="#333", width=0.45)
    ax1.set_xticks(x); ax1.set_xticklabels(main_types, fontsize=10)
    ax1.set_ylabel("R2 Score (%)", fontsize=12, fontweight="bold")
    ax1.set_title("(a) Accuracy by Property Type", fontsize=13, fontweight="bold")
    ax1.grid(True, axis="y", alpha=0.3)
    for i, v in enumerate(type_r2):
        ax1.text(i, v+1, f"{v:.0f}%", ha="center", fontsize=10, fontweight="bold")

    ax2.bar(x, type_mae, color="#6baed6", edgecolor="#333", width=0.45)
    ax2.set_xticks(x); ax2.set_xticklabels(main_types, fontsize=10)
    ax2.set_ylabel("MAE (Lakhs)", fontsize=12, fontweight="bold")
    ax2.set_title("(b) Error by Property Type", fontsize=13, fontweight="bold")
    ax2.grid(True, axis="y", alpha=0.3)
    for i, v in enumerate(type_mae):
        ax2.text(i, v+0.5, f"{v:.1f}L", ha="center", fontsize=10, fontweight="bold")

    plt.suptitle("Figure: Performance Analysis by Property Type",
                 fontsize=14, fontweight="bold", y=1.02)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "5_accuracy_by_type.png"), dpi=150, bbox_inches="tight")
    plt.close()
    print("   [OK] 5_accuracy_by_type.png")
    print(f"         Counts per type: {dict(zip(main_types, type_cnt))}")

    # ======================================================================
    # CHART 6: Performance Analysis (Processing Time by City  +  Accuracy by City)
    # ======================================================================
    test_cities = df_clean.iloc[idx_test]["city"].values
    city_col_idx = feature_names.index("city_encoded")

    # Pick the top cities by count in dataset
    city_counts = pd.Series(df_clean["city"].values).value_counts()
    top_cities = city_counts.head(6).index.tolist()

    city_r2_vals = []
    city_mae_vals = []
    city_labels = []

    for city in top_cities:
        mask = test_cities == city
        if mask.sum() >= 3:
            a = y_test[mask]; p = y_pred[mask]
            r2v = r2_score(a, p) if len(a) > 1 else 0
            city_r2_vals.append(max(0, r2v * 100))
            city_mae_vals.append(mean_absolute_error(a, p) / 1e5)
            city_labels.append(city)

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

    # Left: Accuracy (R2) by city
    ax1.plot(city_labels, city_r2_vals, "o-", color="#2171b5", lw=2, markersize=8)
    ax1.set_ylabel("R2 Score (%)", fontsize=12, fontweight="bold")
    ax1.set_title("(a) Model Accuracy by City", fontsize=13, fontweight="bold")
    ax1.set_ylim(0, max(city_r2_vals) * 1.2 if city_r2_vals else 100)
    ax1.grid(True, alpha=0.3)
    for i, v in enumerate(city_r2_vals):
        ax1.text(i, v + 1.5, f"{v:.0f}%", ha="center", fontsize=9, fontweight="bold")
    plt.setp(ax1.get_xticklabels(), rotation=20, ha="right", fontsize=9)

    # Right: MAE by city
    ax2.plot(city_labels, city_mae_vals, "s-", color="#e6550d", lw=2, markersize=8)
    ax2.set_ylabel("MAE (Lakhs)", fontsize=12, fontweight="bold")
    ax2.set_title("(b) Prediction Error by City", fontsize=13, fontweight="bold")
    ax2.grid(True, alpha=0.3)
    for i, v in enumerate(city_mae_vals):
        ax2.text(i, v + 0.5, f"{v:.1f}L", ha="center", fontsize=9, fontweight="bold")
    plt.setp(ax2.get_xticklabels(), rotation=20, ha="right", fontsize=9)

    plt.suptitle("Figure: Illustration of Performance Analysis",
                 fontsize=14, fontweight="bold", y=1.02)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "6_performance_analysis.png"), dpi=150, bbox_inches="tight")
    plt.close()
    print("   [OK] 6_performance_analysis.png")

    # ======================================================================
    # CHART 7: Classification Report Table
    # ======================================================================
    bracket_stats = []
    total_correct = 0
    for bracket in BRACKET_ORDER:
        tp = sum(1 for a, p in zip(actual_brackets, pred_brackets) if a==bracket and p==bracket)
        fp = sum(1 for a, p in zip(actual_brackets, pred_brackets) if a!=bracket and p==bracket)
        fn = sum(1 for a, p in zip(actual_brackets, pred_brackets) if a==bracket and p!=bracket)
        support = sum(1 for a in actual_brackets if a==bracket)
        prec = tp/(tp+fp) if (tp+fp) else 0
        rec  = tp/(tp+fn) if (tp+fn) else 0
        f1   = 2*prec*rec/(prec+rec) if (prec+rec) else 0
        total_correct += tp
        bracket_stats.append([bracket, f"{prec:.2f}", f"{rec:.2f}", f"{f1:.2f}", str(support)])
    overall_acc = total_correct / len(y_test)
    bracket_stats.append(["", "", "", "", ""])
    bracket_stats.append(["accuracy", "", "", f"{overall_acc:.2f}", str(len(y_test))])

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.axis("off")
    ax.set_title("Classification Report", fontsize=15, fontweight="bold", pad=15)
    cols = ["Price Bracket","Precision","Recall","F1-Score","Support"]
    table = ax.table(cellText=bracket_stats, colLabels=cols, loc="center", cellLoc="center")
    table.auto_set_font_size(False); table.set_fontsize(11); table.scale(1.2, 1.5)
    for key, cell in table.get_celld().items():
        cell.set_edgecolor("#999")
        if key[0]==0:
            cell.set_facecolor("#2171b5"); cell.set_text_props(color="white", fontweight="bold")
        elif key[0]==len(bracket_stats):
            cell.set_facecolor("#deebf7"); cell.set_text_props(fontweight="bold")
        else:
            cell.set_facecolor("white")
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "7_classification_report.png"), dpi=150, bbox_inches="tight")
    plt.close()
    print("   [OK] 7_classification_report.png")

    # ======================================================================
    # CHART 8: Performance Summary Table
    # ======================================================================
    fig, ax = plt.subplots(figsize=(9, 4.5))
    ax.axis("off")
    ax.set_title("Performance Summary of EstAi Random Forest Model",
                 fontsize=14, fontweight="bold", pad=15)
    tdata = [
        ["R2 Score (CV Mean)", f"{cv_r2.mean():.4f}"],
        ["Mean Absolute Error", f"Rs. {mae:,.0f}"],
        ["Root Mean Squared Error", f"Rs. {rmse:,.0f}"],
        ["MAPE", f"{mape:.2f}%"],
        ["Bracket Classification Accuracy", f"{overall_acc*100:.1f}%"],
        ["Avg Prediction Time", f"{avg_pred_time:.2f} ms"],
        ["Training Samples", f"{len(y_train)}"],
        ["Testing Samples", f"{len(y_test)}"],
        ["Number of Trees", "100"],
        ["Max Tree Depth", "15"],
    ]
    table = ax.table(cellText=tdata, colLabels=["Metric","Value"],
                     loc="center", cellLoc="center")
    table.auto_set_font_size(False); table.set_fontsize(11); table.scale(1.3, 1.5)
    for key, cell in table.get_celld().items():
        cell.set_edgecolor("#999")
        if key[0]==0:
            cell.set_facecolor("#2171b5"); cell.set_text_props(color="white", fontweight="bold")
        elif key[0]%2==0:
            cell.set_facecolor("#deebf7")
        else:
            cell.set_facecolor("white")
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "8_performance_summary.png"), dpi=150, bbox_inches="tight")
    plt.close()
    print("   [OK] 8_performance_summary.png")

    # -- Summary ---------------------------------------------------------------
    print("\n" + "="*60)
    print("EVALUATION COMPLETE")
    print("="*60)
    print(f"  R2 (test):        {r2:.4f}")
    print(f"  R2 (CV mean):     {cv_r2.mean():.4f}")
    print(f"  MAE:              Rs.{mae:,.0f}")
    print(f"  RMSE:             Rs.{rmse:,.0f}")
    print(f"  MAPE:             {mape:.2f}%")
    print(f"  Bracket Accuracy: {overall_acc*100:.1f}%")
    print(f"  Avg Pred Time:    {avg_pred_time:.2f} ms")
    print(f"\n  Property type R2: {dict(zip(main_types, [f'{v:.0f}%' for v in type_r2]))}")
    print(f"  City R2:          {dict(zip(city_labels, [f'{v:.0f}%' for v in city_r2_vals]))}")
    print(f"\n  Charts saved to:  {OUTPUT_DIR}")
    print("="*60)


if __name__ == "__main__":
    main()
