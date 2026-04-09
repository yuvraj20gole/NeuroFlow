"""Pydantic response models."""

from typing import List

from pydantic import BaseModel, Field


class SimulateResponse(BaseModel):
    priority_lane: str
    green_time: float = Field(..., description="Final green phase (seconds), 10–90")
    confidence: float = Field(..., ge=0, le=100)
    explanation: str
    fuzzy_output: float
    neural_output: float
    triggered_rules: List[str] = Field(default_factory=list)


class PredictPoint(BaseModel):
    step: int
    label: str
    predicted_congestion: float


class PredictResponse(BaseModel):
    """GET /predict — mock short-horizon congestion forecast."""

    timeline: List[PredictPoint]
    values: List[float]


class EmergencyResponse(BaseModel):
    override: bool
    priority_lane: str
    green_time: float
    message: str
    immediate_clearance: bool = True


class AnalyticsResponse(BaseModel):
    efficiency_score: float
    avg_wait_seconds: float
    throughput_vehicles_per_hour: float
    incidents_handled_24h: int
    model_confidence_avg: float


class ModelMetricsResponse(BaseModel):
    """GET /model/metrics — trained neural model quality metrics."""

    r2: float = Field(..., description="R² score on held-out test set")
    mae: float = Field(..., description="Mean absolute error on held-out test set")
    n_train: int
    n_test: int
    dataset_path: str
    model_confidence: float = Field(..., ge=0, le=100, description="Confidence proxy (R²×100)")
