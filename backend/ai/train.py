from pathlib import Path

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split


BASE = Path(__file__).resolve().parents[1]
DATA = BASE / "data" / "bus_history.csv"
MODEL = BASE / "ai" / "model.pkl"


df = pd.read_csv(DATA)

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

TARGET = "next_passengers"

X = df[FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
)


models = {
    "Random Forest": RandomForestRegressor(
        n_estimators=300,
        max_depth=18,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    ),
    "Gradient Boosting": GradientBoostingRegressor(
        n_estimators=250,
        learning_rate=0.05,
        max_depth=5,
        min_samples_leaf=3,
        random_state=42,
    ),
}


results = {}

print()
print("=== MODEL COMPARISON ===")

for name, model in models.items():
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)
    rmse = mean_squared_error(y_test, predictions) ** 0.5
    r2 = r2_score(y_test, predictions)

    results[name] = {
        "model": model,
        "mae": mae,
        "rmse": rmse,
        "r2": r2,
    }

    print()
    print(name)
    print(f"  MAE : {mae:.2f} passengers")
    print(f"  RMSE: {rmse:.2f} passengers")
    print(f"  R2  : {r2:.4f}")


best_name = min(
    results,
    key=lambda name: results[name]["mae"]
)

best = results[best_name]

print()
print("=== SELECTED MODEL ===")
print(best_name)
print(f"Validation MAE: {best['mae']:.2f} passengers")
print(f"Validation RMSE: {best['rmse']:.2f} passengers")
print(f"Validation R2: {best['r2']:.4f}")


# Feature importance when supported.
model = best["model"]

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
    "target": TARGET,
    "model_name": best_name,
    "mae": float(best["mae"]),
    "rmse": float(best["rmse"]),
    "r2": float(best["r2"]),
}

MODEL.parent.mkdir(parents=True, exist_ok=True)

joblib.dump(bundle, MODEL)

print()
print(f"Model saved to {MODEL}")
