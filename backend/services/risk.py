from pathlib import Path

import joblib


CLASSIFIER_PATH = (
    Path(__file__).resolve().parents[1]
    / "ai"
    / "overload_classifier.pkl"
)

_classifier_bundle = joblib.load(CLASSIFIER_PATH)

CLASSIFIER = _classifier_bundle["model"]
CLASSIFIER_FEATURES = _classifier_bundle["features"]
CAPACITY = _classifier_bundle["capacity"]


def overload_probability(
    hour: int,
    day_of_week: int,
    stop_id: int,
    current_passengers: int,
    previous_passengers: int,
    weather_index: int,
) -> float:
    from ai.predictor import build_feature_row

    row = build_feature_row(
        hour=hour,
        day_of_week=day_of_week,
        stop_id=stop_id,
        current_passengers=current_passengers,
        previous_passengers=previous_passengers,
        weather_index=weather_index,
    )

    probability = CLASSIFIER.predict_proba(
        row[CLASSIFIER_FEATURES]
    )[0][1]

    return round(float(probability * 100), 1)


def risk_from_prediction(
    predicted_passengers: float,
    capacity: int,
    overload_probability_value: float | None = None,
) -> dict:

    predicted_occupancy = (
        predicted_passengers / capacity * 100
        if capacity
        else 0
    )

    if predicted_occupancy > 100:
        level = "OVERLOAD"
        recommendation = (
            "Hold departure and dispatch additional capacity."
        )
    elif predicted_occupancy >= 85:
        level = "HIGH"
        recommendation = (
            "Prepare an intervention before the next stop."
        )
    elif predicted_occupancy >= 70:
        level = "MODERATE"
        recommendation = (
            "Monitor demand and prepare for increased boarding."
        )
    else:
        level = "SAFE"
        recommendation = "No intervention required."

    return {
        "predicted_occupancy": round(predicted_occupancy, 1),
        "risk_level": level,
        "overload_probability": (
            overload_probability_value
            if overload_probability_value is not None
            else None
        ),
        "recommendation": recommendation,
    }


def ai_departure_status(
    hour: int,
    day_of_week: int,
    stop_id: int,
    passengers: int,
    previous_passengers: int,
    weather_index: int,
    capacity: int,
    predicted_passengers: float,
) -> str:

    if passengers > capacity:
        return "LOCKED"

    if predicted_passengers > capacity:
        return "LOCKED"

    return "READY"
