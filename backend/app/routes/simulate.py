"""POST /simulate — neuro-fuzzy + neural hybrid signal timing."""

from fastapi import APIRouter, HTTPException

from app.schemas.request import SimulateRequest
from app.schemas.response import SimulateResponse
from app.services import decision_engine

router = APIRouter()


@router.post("/simulate", response_model=SimulateResponse)
def run_simulation(body: SimulateRequest) -> SimulateResponse:
    try:
        dens = body.densities.model_dump()
        (
            priority_lane,
            green_time,
            fuzzy_out,
            neural_out,
            confidence,
            explanation,
            triggered,
        ) = decision_engine.decide(
            densities=dens,
            waiting_time=body.waiting_time,
            emergency=body.emergency,
        )
    except Exception as exc:  # defensive: keep 500 message safe
        raise HTTPException(status_code=500, detail=f"Simulation failed: {exc!s}") from exc

    return SimulateResponse(
        priority_lane=priority_lane,
        green_time=round(green_time, 2),
        confidence=confidence,
        explanation=explanation,
        fuzzy_output=round(fuzzy_out, 2),
        neural_output=round(neural_out, 2),
        triggered_rules=triggered,
    )
