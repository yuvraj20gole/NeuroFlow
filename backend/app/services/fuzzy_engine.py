"""
Mamdani-style fuzzy inference for green time (seconds).

Inputs:
  - density: 0–100 (priority lane occupancy)
  - waiting_time: 0–120 seconds

Linguistic terms: Low, Medium, High — triangular membership on both axes.
Minimum 9 rules (density × wait → green duration singleton).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

# Output singletons (seconds) for defuzzification — SHORT / MEDIUM / LONG phases
OUT_SHORT = 22.0
OUT_MEDIUM = 48.0
OUT_LONG = 74.0


def _tri_mu(x: float, a: float, b: float, c: float) -> float:
    """Triangular membership: peak at b, support [a, c]."""
    if x <= a or x >= c:
        return 0.0
    if x < b:
        return (x - a) / (b - a) if b != a else 1.0
    return (c - x) / (c - b) if c != b else 1.0


def membership_density(d: float) -> Dict[str, float]:
    """Traffic density 0–100 → μ(Low), μ(Medium), μ(High)."""
    d = max(0.0, min(100.0, d))
    # Low: full membership at 0, linear falloff to 0 by 48
    low = max(0.0, 1.0 - d / 48.0) if d <= 48 else 0.0
    medium = _tri_mu(d, 28.0, 52.0, 78.0)
    # High: ramp from ~55 to 100
    high = 0.0 if d < 52 else min(1.0, (d - 52) / 38.0)
    return {"Low": low, "Medium": medium, "High": high}


def membership_waiting(w: float) -> Dict[str, float]:
    """Waiting time 0–120s → μ(Low), μ(Medium), μ(High)."""
    w = max(0.0, min(120.0, w))
    low = max(0.0, 1.0 - w / 55.0) if w <= 55 else 0.0
    medium = _tri_mu(w, 30.0, 58.0, 95.0)
    high = 0.0 if w < 62 else min(1.0, (w - 62) / 48.0)
    return {"Low": low, "Medium": medium, "High": high}


# Nine rules: (density_term, wait_term) → output level name
# IF density HIGH AND waiting HIGH → green LONG
# IF density LOW AND waiting LOW → green SHORT
# etc.
FUZZY_RULES: List[Tuple[str, str, str]] = [
    ("Low", "Low", "SHORT"),  # 1
    ("Low", "Medium", "SHORT"),  # 2
    ("Low", "High", "MEDIUM"),  # 3
    ("Medium", "Low", "SHORT"),  # 4
    ("Medium", "Medium", "MEDIUM"),  # 5
    ("Medium", "High", "LONG"),  # 6
    ("High", "Low", "MEDIUM"),  # 7
    ("High", "Medium", "LONG"),  # 8
    ("High", "High", "LONG"),  # 9
]

OUT_LEVEL: Dict[str, float] = {
    "SHORT": OUT_SHORT,
    "MEDIUM": OUT_MEDIUM,
    "LONG": OUT_LONG,
}


@dataclass
class FuzzyResult:
    green_time: float
    triggered_rules: List[str]


def infer_green_time(density: float, waiting_time: float) -> FuzzyResult:
    """
    Fire all rules with min T-norm, centroid-style defuzzification on singletons.
    Clamps output to [10, 90] seconds.
    """
    d = max(0.0, min(100.0, density))
    w = max(0.0, min(120.0, waiting_time))

    mu_d = membership_density(d)
    mu_w = membership_waiting(w)

    num = 0.0
    den = 0.0
    triggered: List[str] = []

    for d_term, w_term, out_name in FUZZY_RULES:
        strength = min(mu_d[d_term], mu_w[w_term])
        if strength <= 1e-9:
            continue
        out_val = OUT_LEVEL[out_name]
        num += strength * out_val
        den += strength
        triggered.append(
            f"IF density is {d_term.upper()} AND waiting is {w_term.upper()} "
            f"THEN green is {out_name} (activation={strength:.3f})"
        )

    if den < 1e-9:
        crisp = OUT_MEDIUM
    else:
        crisp = num / den

    crisp = max(10.0, min(90.0, crisp))
    return FuzzyResult(green_time=crisp, triggered_rules=triggered)
