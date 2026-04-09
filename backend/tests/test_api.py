"""HTTP integration tests via FastAPI TestClient."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

SIM_BODY = {
    "densities": {"north": 70, "south": 40, "east": 55, "west": 30},
    "waiting_time": 65,
    "emergency": False,
}


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_simulate_ok():
    r = client.post("/simulate", json=SIM_BODY)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["priority_lane"] == "North"
    assert 10 <= data["green_time"] <= 90
    assert "fuzzy_output" in data and "neural_output" in data
    assert 0 <= data["confidence"] <= 100
    assert len(data["explanation"]) > 10
    assert isinstance(data.get("triggered_rules"), list)


def test_simulate_validation():
    r = client.post(
        "/simulate",
        json={**SIM_BODY, "densities": {**SIM_BODY["densities"], "north": 101}},
    )
    assert r.status_code == 422


def test_predict():
    r = client.get("/predict")
    assert r.status_code == 200
    body = r.json()
    assert "values" in body and len(body["values"]) >= 5
    assert "timeline" in body


def test_emergency_active():
    r = client.post(
        "/emergency",
        json={"lane": "East", "vehicle_type": "ambulance", "active": True},
    )
    assert r.status_code == 200
    d = r.json()
    assert d["override"] is True
    assert d["priority_lane"] == "East"
    assert d["green_time"] == 90


def test_emergency_inactive():
    r = client.post(
        "/emergency",
        json={"lane": "West", "vehicle_type": "police", "active": False},
    )
    assert r.status_code == 200
    assert r.json()["override"] is False


def test_analytics():
    r = client.get("/analytics")
    assert r.status_code == 200
    j = r.json()
    assert "efficiency_score" in j and "avg_wait_seconds" in j
