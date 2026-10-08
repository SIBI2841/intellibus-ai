from pathlib import Path

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split


BASE = Path(__file__).resolve().parents[1]
DATA = BASE / "data" / "bus_history.csv"
MODEL = BASE / "ai" / "overload_classifier.pkl"

CAPACITY = 60

FEATURES = [
    "hour",
    "day_of_week",
    "stop_id",
    "current_passengers",
    "previous_passengers",
    "passenger_delta",
    "occupancy_ratio",
    "peak_period",
    "hour_sin",
    "hour_cos",
    "weather_index",
]


df = pd.read_csv(DATA)

df["overload"] = (
    df["next_passengers"] > CAPACITY
).astype(int)

X = df[FEATURES]
y = df["overload"]


X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)


model = RandomForestClassifier(
    n_estimators=400,
    max_depth=16,
    min_samples_leaf=2,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)


print()
print("=== OVERLOAD CLASSIFIER ===")
print(f"Training samples: {len(X_train)}")
print(f"Test samples:     {len(X_test)}")
print(f"Overload rate:    {y.mean() * 100:.2f}%")

model.fit(X_train, y_train)

predictions = model.predict(X_test)
probabilities = model.predict_proba(X_test)[:, 1]

accuracy = accuracy_score(y_test, predictions)
roc_auc = roc_auc_score(y_test, probabilities)

print()
print("=== VALIDATION ===")
print(f"Accuracy : {accuracy:.4f}")
print(f"ROC-AUC  : {roc_auc:.4f}")

print()
print("=== CLASSIFICATION REPORT ===")
print(
    classification_report(
        y_test,
        predictions,
        target_names=["NORMAL", "OVERLOAD"],
        digits=4,
    )
)

print("=== CONFUSION MATRIX ===")
print(confusion_matrix(y_test, predictions))


if hasattr(model, "feature_importances_"):
    importance = pd.DataFrame({
        "feature": FEATURES,
        "importance": model.feature_importances_,
    }).sort_values(
        "importance",
        ascending=False,
    )

    print()
    print("=== FEATURE IMPORTANCE ===")

    for _, row in importance.iterrows():
        print(
            f"{row['feature']:<22} "
            f"{row['importance']:.4f}"
        )


bundle = {
    "model": model,
    "features": FEATURES,
    "capacity": CAPACITY,
    "target": "overload",
    "roc_auc": float(roc_auc),
}

MODEL.parent.mkdir(parents=True, exist_ok=True)

joblib.dump(bundle, MODEL)

print()
print(f"Classifier saved to {MODEL}")
