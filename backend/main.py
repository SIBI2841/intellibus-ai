from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.buses import router as buses_router
from api.predictions import router as predictions_router
from api.simulation import router as simulation_router
from api.gps import router as gps_router
from api.operations import router as operations_router

app = FastAPI(
    title="IntelliBus AI API",
    version="0.1.0",
    description="Predictive public-transport occupancy and safety MVP."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(buses_router, prefix="/api")
app.include_router(predictions_router, prefix="/api")
app.include_router(simulation_router, prefix="/api")
app.include_router(gps_router, prefix="/api")
app.include_router(operations_router, prefix="/api")

@app.get("/")
def root():
    return {
        "name": "IntelliBus AI",
        "status": "running",
        "docs": "/docs"
    }

