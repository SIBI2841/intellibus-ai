from fastapi import APIRouter
from pydantic import BaseModel, Field
from services.gps_zone import evaluate_gps, ZONES

router = APIRouter(tags=["gps"])


class GPSInput(BaseModel):
    lat: float = 11.0168
    lon: float = 76.9558
    speed: float = Field(30, ge=0, le=120)


@router.get("/gps/zones")
def zones():
    return ZONES


@router.post("/gps/evaluate")
def evaluate(data: GPSInput):
    return evaluate_gps(data.lat, data.lon, data.speed)
