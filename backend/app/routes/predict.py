"""GET /predict — short-horizon congestion forecast (mock series)."""

import math
import time

from fastapi import APIRouter

from app.schemas.response import PredictPoint, PredictResponse

router = APIRouter()


@router.get("/predict", response_model=PredictResponse)
def predict_traffic() -> PredictResponse:
    """Deterministic mock curve seeded by wall clock for stable UI refreshes."""
    t0 = int(time.time() // 60)  # changes each minute
    base = 55.0 + 12.0 * math.sin(t0 / 7.0)
    timeline: list[PredictPoint] = []
    values: list[float] = []
    labels = ["Now", "+1m", "+2m", "+3m", "+4m", "+5m"]
    for i, label in enumerate(labels):
        bump = 3.5 * i + 2.0 * math.sin((t0 + i) / 3.0)
        v = base + bump
        v = max(15.0, min(95.0, v))
        timeline.append(
            PredictPoint(step=i, label=label, predicted_congestion=round(v, 1))
        )
        values.append(round(v, 1))
    return PredictResponse(timeline=timeline, values=values)
