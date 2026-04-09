"""POST /emergency — immediate green override for priority corridor."""

from fastapi import APIRouter, HTTPException

from app.schemas.request import EmergencyRequest
from app.schemas.response import EmergencyResponse

router = APIRouter()

# Maximum clearance phase when override is active
EMERGENCY_GREEN = 90.0


@router.post("/emergency", response_model=EmergencyResponse)
def emergency_override(body: EmergencyRequest) -> EmergencyResponse:
    if not body.active:
        return EmergencyResponse(
            override=False,
            priority_lane=body.lane,
            green_time=0.0,
            message="Emergency override inactive — normal controller resumed.",
            immediate_clearance=False,
        )

    try:
        vt = body.vehicle_type.replace("_", " ")
        msg = (
            f"{vt.title()} priority granted: {body.lane} corridor immediate GREEN "
            f"({EMERGENCY_GREEN:.0f}s clearance)."
        )
        return EmergencyResponse(
            override=True,
            priority_lane=body.lane,
            green_time=EMERGENCY_GREEN,
            message=msg,
            immediate_clearance=True,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Emergency routing failed: {exc!s}") from exc
