"""GET /analytics — aggregate mock KPIs for dashboards."""

import time

from fastapi import APIRouter

from app.schemas.response import AnalyticsResponse
from app.services import neural_model

router = APIRouter()


@router.get("/analytics", response_model=AnalyticsResponse)
def analytics_snapshot() -> AnalyticsResponse:
    """Stable-ish mock stats (slow drift from epoch) for demos."""
    seed = int(time.time() // 300)
    efficiency = 82.0 + (seed % 11) * 0.35
    avg_wait = 38.0 + (seed % 7) * 1.2

    m = neural_model.get_metrics()
    model_conf = 88.5 + (seed % 8) * 0.4
    if m and isinstance(m.get("r2"), (int, float)):
        # Store model quality for Analysis page consumption via /analytics
        model_conf = max(0.0, min(100.0, float(m["r2"]) * 100.0))

    return AnalyticsResponse(
        efficiency_score=round(min(99.0, efficiency), 1),
        avg_wait_seconds=round(avg_wait, 1),
        throughput_vehicles_per_hour=1240 + (seed % 80),
        incidents_handled_24h=6 + (seed % 5),
        model_confidence_avg=round(model_conf, 1),
    )
