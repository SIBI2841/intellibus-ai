from pathlib import Path
import math

import joblib
import pandas as pd


MODEL_PATH = Path(__file__).resolve().parent / "model.pkl"

_bundle = joblib.load(MODEL_PATH)

MODEL = _bundle["model"]
FEATURES = _bundle["features"]


def build_feature_row(
    hour: int,
    day_of_week: int,
    stop_id: int,
    current_passengers: int,
    previous_passengers: int,
    weather_index: int,
) -> pd.DataFrame:

    passenger_delta = current_passengers - previous_passengers

    occupancy_ratio = current_passengers / 60.0

    peak_period = int(
        hour in [7, 8, 9, 17, 18, 19]
    )

    hour_sin = math.sin(
        2 * math.pi * hour / 24
    )

    hour_cos = math.cos(
        2 * math.pi * hour / 24
    )

    row = pd.DataFrame([{
        "hour": hour,
        "day_of_week": day_of_week,
        "stop_id": stop_id,
        "current_passengers": current_passengers,
        "previous_passengers": previous_passengers,
        "passenger_delta": passenger_delta,
        "occupancy_ratio": occupancy_ratio,
        "peak_period": peak_period,
        "hour_sin": hour_sin,
        "hour_cos": hour_cos,
        "weather_index": weather_index,
    }])

    return row[FEATURES]


def predict_next_passengers(
    hour: int,
    day_of_week: int,
    stop_id: int,
    current_passengers: int,
    previous_passengers: int,
    weather_index: int,
) -> float:

    row = build_feature_row(
        hour=hour,
        day_of_week=day_of_week,
        stop_id=stop_id,
        current_passengers=current_passengers,
        previous_passengers=previous_passengers,
        weather_index=weather_index,
    )

    prediction = MODEL.predict(row)[0]

    return round(float(prediction), 1)
