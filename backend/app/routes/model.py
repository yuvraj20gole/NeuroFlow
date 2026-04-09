"""GET /model/metrics — expose trained ANN metrics for the frontend Analysis page."""

from fastapi import APIRouter, HTTPException

from app.schemas.response import ModelMetricsResponse
from app.services import neural_model

router = APIRouter()


@router.get("/model/metrics", response_model=ModelMetricsResponse)
def model_metrics() -> ModelMetricsResponse:
    m = neural_model.get_metrics()
    if not m:
        # Be resilient in dev/test: attempt to load metrics from saved model on-demand.
        neural_model.load_model()
        m = neural_model.get_metrics()
    if not m:
        raise HTTPException(
            status_code=404,
            detail="Neural model metrics not found. Train the model to generate metrics.",
        )

    r2 = float(m["r2"])
    mae = float(m.get("mae", 0.0))
    conf = max(0.0, min(100.0, r2 * 100.0))
    return ModelMetricsResponse(
        r2=r2,
        mae=mae,
        n_train=int(m.get("n_train", 0)),
        n_test=int(m.get("n_test", 0)),
        dataset_path=str(m.get("dataset_path", "")),
        model_confidence=round(conf, 1),
    )

