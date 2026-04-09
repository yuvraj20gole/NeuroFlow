"""Unit tests for fuzzy inference (no HTTP)."""

from app.services import fuzzy_engine


def test_membership_density_bounds():
    m0 = fuzzy_engine.membership_density(0)
    assert m0["Low"] >= 0 and sum(m0.values()) > 0
    m100 = fuzzy_engine.membership_density(100)
    assert m100["High"] >= 0


def test_infer_green_time_range():
    r = fuzzy_engine.infer_green_time(50, 60)
    assert 10 <= r.green_time <= 90
    assert len(r.triggered_rules) >= 1


def test_high_high_is_longer_than_low_low():
    high = fuzzy_engine.infer_green_time(95, 115)
    low = fuzzy_engine.infer_green_time(5, 5)
    assert high.green_time > low.green_time


def test_nine_rules_defined():
    assert len(fuzzy_engine.FUZZY_RULES) >= 9
