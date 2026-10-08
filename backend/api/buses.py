from fastapi import APIRouter
from pydantic import BaseModel, Field

from ai.predictor import predict_next_passengers
from services.occupancy import occupancy_percent, occupancy_status
from services.risk import ai_departure_status

router = APIRouter(tags=["bus"])

STATE = {
    "bus_id": "TN-38-AB-1234",
    "capacity": 60,
    "passengers": 54,
    "previous_passengers": 51,
    "current_stop": "Gandhipuram",
    "next_stop": "Hope College",
    "hour": 8,
    "day_of_week": 0,
    "stop_id": 4,
    "weather_index": 0,
}


class PassengerChange(BaseModel):
    delta: int = Field(..., ge=-60, le=60)


@router.get("/bus")
def get_bus():
    passengers = STATE["passengers"]
    capacity = STATE["capacity"]

    predicted_passengers = predict_next_passengers(
        hour=STATE["hour"],
        day_of_week=STATE["day_of_week"],
        stop_id=STATE["stop_id"],
        current_passengers=passengers,
        previous_passengers=STATE["previous_passengers"],
        weather_index=STATE["weather_index"],
    )

    departure = ai_departure_status(
        hour=STATE["hour"],
        day_of_week=STATE["day_of_week"],
        stop_id=STATE["stop_id"],
        passengers=passengers,
        previous_passengers=STATE["previous_passengers"],
        weather_index=STATE["weather_index"],
        capacity=capacity,
        predicted_passengers=predicted_passengers,
    )

    return {
        **STATE,
        "occupancy_percent": occupancy_percent(
            passengers,
            capacity,
        ),
        "occupancy_status": occupancy_status(
            passengers,
            capacity,
        ),
        "departure_status": departure,
    }


@router.post("/bus/passengers")
def change_passengers(change: PassengerChange):
    STATE["previous_passengers"] = STATE["passengers"]

    STATE["passengers"] = max(
        0,
        min(
            STATE["capacity"] + 30,
            STATE["passengers"] + change.delta,
        ),
    )

    return get_bus()


@router.post("/bus/reset")
def reset_bus():
    STATE.update({
        "passengers": 54,
        "previous_passengers": 51,
        "current_stop": "Gandhipuram",
        "next_stop": "Hope College",
        "hour": 8,
        "day_of_week": 0,
        "stop_id": 4,
        "weather_index": 0,
    })

    return get_bus()
