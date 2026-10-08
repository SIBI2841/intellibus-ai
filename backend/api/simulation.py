from fastapi import APIRouter
from pydantic import BaseModel, Field
from api.buses import STATE

router = APIRouter(tags=["simulation"])


class SimulationUpdate(BaseModel):
    hour: int = Field(8, ge=0, le=23)
    day_of_week: int = Field(0, ge=0, le=6)
    stop_id: int = Field(4, ge=1, le=12)
    current_stop: str = "Gandhipuram"
    next_stop: str = "Hope College"
    weather_index: int = Field(0, ge=0, le=1)


@router.post("/simulation")
def update_simulation(data: SimulationUpdate):
    STATE.update(data.model_dump())
    return STATE
