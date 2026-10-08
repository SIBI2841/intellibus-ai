from fastapi import APIRouter, Query

from api.buses import STATE
from ai.predictor import predict_next_passengers
from services.risk import overload_probability, risk_from_prediction
from services.gps_zone import evaluate_gps, ZONES

router = APIRouter(tags=["operations"])


@router.get("/operations/status")
def operations_status(
    lat: float = Query(11.0168),
    lon: float = Query(76.9558),
    speed: float = Query(42, ge=0, le=120),
):
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

    risk = risk_from_prediction(
        predicted_passengers=predicted,
        capacity=STATE["capacity"],
        overload_probability_value=probability,
    )

    gps = evaluate_gps(lat, lon, speed)

    safety_flags = []

    if risk["risk_level"] == "OVERLOAD":
        safety_flags.append("PREDICTED_OVERLOAD")

    if gps["status"] == "SPEED_VIOLATION":
        safety_flags.append("SPEED_VIOLATION")

    if "PREDICTED_OVERLOAD" in safety_flags and "SPEED_VIOLATION" in safety_flags:
        overall_status = "CRITICAL"
        action = "Hold departure, dispatch additional capacity, and reduce speed to the zone limit."
    elif "PREDICTED_OVERLOAD" in safety_flags:
        overall_status = "CRITICAL"
        action = "Hold departure and dispatch additional capacity."
    elif "SPEED_VIOLATION" in safety_flags:
        overall_status = "WARNING"
        action = "Alert driver and reduce speed to the zone limit."
    elif risk["risk_level"] == "HIGH":
        overall_status = "WARNING"
        action = "Prepare an intervention before the next stop."
    elif risk["risk_level"] == "MODERATE":
        overall_status = "WARNING"
        action = "Monitor demand and prepare for increased boarding."
    else:
        overall_status = "NORMAL"
        action = "Continue normal operation."

    return {
        "overall_status": overall_status,
        "action": action,
        "safety_flags": safety_flags,
        "occupancy": risk,
        "gps": gps,
    }



