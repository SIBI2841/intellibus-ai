from fastapi import APIRouter, HTTPException

from api.buses import STATE
from ai.predictor import predict_next_passengers
from services.risk import (
    overload_probability,
    risk_from_prediction,
)

router = APIRouter(tags=["ai"])


@router.get("/prediction")
def prediction():
    try:
        predicted = predict_next_passengers(
            hour=STATE["hour"],
            day_of_week=STATE["day_of_week"],
            stop_id=STATE["stop_id"],
            current_passengers=STATE["passengers"],
            previous_passengers=STATE["previous_passengers"],
            weather_index=STATE["weather_index"],
        )

        probability = overload_probability(
            hour=STATE["hour"],
            day_of_week=STATE["day_of_week"],
            stop_id=STATE["stop_id"],
            current_passengers=STATE["passengers"],
            previous_passengers=STATE["previous_passengers"],
            weather_index=STATE["weather_index"],
        )

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        )

    risk = risk_from_prediction(
        predicted_passengers=predicted,
        capacity=STATE["capacity"],
        overload_probability_value=probability,
    )

    return {
        "current_stop": STATE["current_stop"],
        "next_stop": STATE["next_stop"],
        "predicted_passengers": predicted,
        **risk,
    }
