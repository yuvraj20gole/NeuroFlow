"""Pydantic request bodies for NeuroFlow API."""

from typing import Literal

from pydantic import BaseModel, Field


class LaneDensities(BaseModel):
    """Per-lane traffic density (0–100%)."""

    north: float = Field(..., ge=0, le=100)
    south: float = Field(..., ge=0, le=100)
    east: float = Field(..., ge=0, le=100)
    west: float = Field(..., ge=0, le=100)


class SimulateRequest(BaseModel):
    """POST /simulate — run neuro-fuzzy + neural decision for one cycle."""

    densities: LaneDensities
    waiting_time: float = Field(..., ge=0, le=120, description="Representative queue wait (seconds)")
    emergency: bool = False


class EmergencyRequest(BaseModel):
    """POST /emergency — force immediate green for a lane."""

    lane: Literal["North", "South", "East", "West"]
    vehicle_type: Literal["ambulance", "fire", "police", "vip"] = "ambulance"
    active: bool = True
