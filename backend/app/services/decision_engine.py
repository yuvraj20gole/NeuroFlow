"""
Hybrid decision: combine fuzzy + neural, pick priority lane, build explanation.
"""

from __future__ import annotations

from typing import Dict, List, Tuple

from app.services import fuzzy_engine, neural_model

FUZZY_WEIGHT = 0.6
NEURAL_WEIGHT = 0.4


def _priority_lane(densities: Dict[str, float]) -> str:
    """Lane with highest density (ties → N, S, E, W order)."""
    order = ["north", "south", "east", "west"]
    best = max(order, key=lambda k: densities[k])
    return best.capitalize()


def _density_label(d: float) -> str:
    mu = fuzzy_engine.membership_density(d)
    return max(mu, key=mu.get).upper()


def _waiting_label(wt: float) -> str:
    mu = fuzzy_engine.membership_waiting(wt)
    return max(mu, key=mu.get).upper()


def _confidence(
    triggered_rules: List[str],
    fuzzy_g: float,
    neural_g: float,
) -> float:
    """
    Heuristic 0–100: agreement between sub-models + rule activation mass.
    """
    diff = abs(fuzzy_g - neural_g)
    agreement = max(0.0, 100.0 - diff * 2.5)

    n_rules = max(1, len(triggered_rules))
    spread = min(25.0, n_rules * 2.5)

    score = 0.55 * agreement + 0.25 * (70.0 + spread) + 20.0
    return max(0.0, min(100.0, round(score, 1)))


def decide(
    densities: Dict[str, float],
    waiting_time: float,
    emergency: bool,
) -> Tuple[str, float, float, float, float, str, List[str]]:
    """
    Returns:
      priority_lane, final_green, fuzzy_out, neural_out, confidence, explanation, triggered_rules
    """
    lane = _priority_lane(densities)
    key = lane.lower()
    lane_density = densities[key]

    fuzzy_res = fuzzy_engine.infer_green_time(lane_density, waiting_time)
    fuzzy_g = fuzzy_res.green_time
    triggered = fuzzy_res.triggered_rules

    neural_g = neural_model.predict_green_time(
        lane_density, waiting_time, emergency=emergency
    )

    final = FUZZY_WEIGHT * fuzzy_g + NEURAL_WEIGHT * neural_g
    if emergency:
        final += 12.0
    final = max(10.0, min(90.0, final))

    d_lab = _density_label(lane_density)
    w_lab = _waiting_label(waiting_time)

    explanation = (
        f"{lane} lane selected due to highest density ({lane_density:.0f}%). "
        f"Inputs map to {d_lab} density and {w_lab} waiting; "
        f"hybrid green time {final:.1f}s (fuzzy {fuzzy_g:.1f}s × {FUZZY_WEIGHT} + "
        f"neural {neural_g:.1f}s × {NEURAL_WEIGHT})."
    )
    if emergency:
        explanation += " Emergency boost applied."

    conf = _confidence(triggered, fuzzy_g, neural_g)

    return lane, final, fuzzy_g, neural_g, conf, explanation, triggered
