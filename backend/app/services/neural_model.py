"""
Neural model for green-time prediction.

Phase 6: Real dataset integration + model training on the UCI "Metro Interstate Traffic Volume Dataset".

Dataset preprocessing per spec:
  - columns: traffic_volume, date_time
  - traffic_volume -> density (normalize to 0–100)
  - hour(date_time) -> waiting_time (scale to 0–120)
  - create target green_time (10–90):
      green_time = 20 + (density * 0.5) + (waiting_time * 0.2) + noise

Model:
  - sklearn MLPRegressor (trained + saved with joblib)
  - loaded at API startup when available
  - safe fallback to a deterministic heuristic if model isn't present
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple

import numpy as np

# Optional imports (only required for training / loading a trained model)
try:
    import joblib  # type: ignore
    import pandas as pd  # type: ignore
    from sklearn.metrics import mean_absolute_error, r2_score  # type: ignore
    from sklearn.model_selection import train_test_split  # type: ignore
    from sklearn.neural_network import MLPRegressor  # type: ignore
    from sklearn.pipeline import Pipeline  # type: ignore
    from sklearn.preprocessing import StandardScaler  # type: ignore

    _SKLEARN_AVAILABLE = True
except Exception:  # pragma: no cover
    _SKLEARN_AVAILABLE = False


BACKEND_DIR = pathlib.Path(__file__).resolve().parents[2]  # backend/app/services -> backend/
DATA_DIR = BACKEND_DIR / "data"
MODELS_DIR = BACKEND_DIR / "models"
DEFAULT_MODEL_PATH = MODELS_DIR / "neural_green_time.joblib"
DEFAULT_METRICS_PATH = MODELS_DIR / "neural_green_time.metrics.json"


@dataclass
class ModelMetrics:
    r2: float
    mae: float
    n_train: int
    n_test: int
    dataset_path: str


_MODEL: Optional[Any] = None  # sklearn Pipeline
_METRICS: Optional[ModelMetrics] = None


def _clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def locate_dataset_csv() -> Optional[pathlib.Path]:
    """
    Locate a CSV inside backend/data/.
    User should place the UCI CSV there (e.g. Metro_Interstate_Traffic_Volume.csv).
    """
    if not DATA_DIR.exists():
        return None
    for p in sorted(DATA_DIR.glob("*.csv")):
        if p.is_file():
            return p
    return None


def load_and_preprocess(csv_path: pathlib.Path) -> Tuple[np.ndarray, np.ndarray]:
    """
    Returns X, y where:
      X = [density, waiting_time]
      y = green_time
    """
    if not _SKLEARN_AVAILABLE:
        raise RuntimeError("Training requires pandas + scikit-learn + joblib installed.")

    df = pd.read_csv(csv_path)  # type: ignore[name-defined]

    # Select required columns only
    keep = ["traffic_volume", "date_time"]
    missing = [c for c in keep if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset missing required columns: {missing}. Found: {list(df.columns)[:12]} ...")

    df = df[keep].copy()
    df = df.dropna()

    # Parse date_time, extract hour
    df["date_time"] = pd.to_datetime(df["date_time"], errors="coerce")  # type: ignore[name-defined]
    df = df.dropna()
    df["hour"] = df["date_time"].dt.hour  # type: ignore[union-attr]

    # Normalize traffic_volume -> density (0–100)
    vol = df["traffic_volume"].astype(float)
    vmin = float(vol.min())
    vmax = float(vol.max())
    if vmax <= vmin:
        raise ValueError("traffic_volume has no variance; cannot normalize.")

    df["density"] = (vol - vmin) / (vmax - vmin) * 100.0

    # hour -> waiting_time (0–120)
    df["waiting_time"] = (df["hour"].astype(float) / 23.0) * 120.0

    # Target creation (per spec) with slight randomness
    rng = np.random.default_rng(42)
    noise = rng.normal(loc=0.0, scale=3.0, size=len(df))
    df["green_time"] = 20.0 + (df["density"] * 0.5) + (df["waiting_time"] * 0.2) + noise
    df["green_time"] = df["green_time"].clip(lower=10.0, upper=90.0)

    X = df[["density", "waiting_time"]].to_numpy(dtype=np.float32)
    y = df["green_time"].to_numpy(dtype=np.float32)
    return X, y


def train_and_save_model(
    *,
    csv_path: pathlib.Path,
    model_path: pathlib.Path = DEFAULT_MODEL_PATH,
    metrics_path: pathlib.Path = DEFAULT_METRICS_PATH,
) -> ModelMetrics:
    if not _SKLEARN_AVAILABLE:
        raise RuntimeError("Training requires pandas + scikit-learn + joblib installed.")

    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    X, y = load_and_preprocess(csv_path)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model: Pipeline = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            (
                "mlp",
                MLPRegressor(
                    hidden_layer_sizes=(32, 16),
                    activation="relu",
                    solver="adam",
                    alpha=1e-4,
                    learning_rate_init=1e-3,
                    max_iter=400,
                    random_state=42,
                ),
            ),
        ]
    )

    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    r2 = float(r2_score(y_test, preds))
    mae = float(mean_absolute_error(y_test, preds))

    metrics = ModelMetrics(
        r2=round(r2, 4),
        mae=round(mae, 4),
        n_train=int(len(X_train)),
        n_test=int(len(X_test)),
        dataset_path=str(csv_path),
    )

    joblib.dump({"model": model, "metrics": metrics.__dict__}, model_path)  # type: ignore[name-defined]
    metrics_path.write_text(json.dumps(metrics.__dict__, indent=2))

    print(f"[neural_model] trained MLPRegressor — R2={metrics.r2}, MAE={metrics.mae}")
    print(f"[neural_model] saved: {model_path}")
    return metrics


def load_model(
    *,
    model_path: pathlib.Path = DEFAULT_MODEL_PATH,
    metrics_path: pathlib.Path = DEFAULT_METRICS_PATH,
) -> bool:
    """
    Load the trained model if present. Returns True if loaded, else False.
    """
    global _MODEL, _METRICS

    if not _SKLEARN_AVAILABLE:
        _MODEL = None
        _METRICS = None
        return False

    if not model_path.exists():
        _MODEL = None
        _METRICS = None
        return False

    payload = joblib.load(model_path)  # type: ignore[name-defined]
    _MODEL = payload.get("model")

    m = payload.get("metrics")
    if isinstance(m, dict) and "r2" in m:
        _METRICS = ModelMetrics(
            r2=float(m["r2"]),
            mae=float(m.get("mae", 0.0)),
            n_train=int(m.get("n_train", 0)),
            n_test=int(m.get("n_test", 0)),
            dataset_path=str(m.get("dataset_path", "")),
        )
    elif metrics_path.exists():
        try:
            mm = json.loads(metrics_path.read_text())
            _METRICS = ModelMetrics(
                r2=float(mm["r2"]),
                mae=float(mm.get("mae", 0.0)),
                n_train=int(mm.get("n_train", 0)),
                n_test=int(mm.get("n_test", 0)),
                dataset_path=str(mm.get("dataset_path", "")),
            )
        except Exception:
            _METRICS = None
    else:
        _METRICS = None

    return _MODEL is not None


def get_metrics() -> Optional[Dict[str, Any]]:
    if _METRICS is None:
        return None
    return {
        "r2": _METRICS.r2,
        "mae": _METRICS.mae,
        "n_train": _METRICS.n_train,
        "n_test": _METRICS.n_test,
        "dataset_path": _METRICS.dataset_path,
    }


def predict_green_time(
    density: float,
    waiting_time: float,
    *,
    emergency: bool = False,
) -> float:
    """
    Predict green_time (10–90).
    - Uses trained MLP model if loaded.
    - Falls back to the same heuristic you had earlier if model isn't loaded yet.
    """
    d = _clamp(float(density), 0.0, 100.0)
    w = _clamp(float(waiting_time), 0.0, 120.0)

    if _MODEL is not None:
        try:
            pred = float(_MODEL.predict(np.array([[d, w]], dtype=np.float32))[0])
            if emergency:
                pred += 10.0
            return _clamp(pred, 10.0, 90.0)
        except Exception:
            # fall through to heuristic
            pass

    # Heuristic fallback (deterministic, no sklearn required)
    w_norm = w / 120.0 * 100.0
    z = 0.42 * d + 0.38 * w_norm - 18.0
    hidden = np.tanh(z / 45.0) * 28.0
    base = 35.0 + 0.22 * d + 0.18 * w_norm + float(hidden)
    if emergency:
        base += 18.0
    return _clamp(base, 10.0, 90.0)


def _main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--train", action="store_true", help="Train MLPRegressor on CSV in backend/data/")
    parser.add_argument("--csv", type=str, default="", help="Explicit CSV path (overrides auto-locate)")
    parser.add_argument("--model-out", type=str, default=str(DEFAULT_MODEL_PATH), help="joblib output path")
    args = parser.parse_args()

    if args.train:
        csv_path = pathlib.Path(args.csv) if args.csv else (locate_dataset_csv() or pathlib.Path(""))
        if not csv_path or not csv_path.exists():
            raise SystemExit(
                f"Dataset CSV not found. Place it in '{DATA_DIR}/' or pass --csv <path>."
            )
        train_and_save_model(csv_path=csv_path, model_path=pathlib.Path(args.model_out))
        return

    # Default action: attempt to load model
    ok = load_model()
    print(f"[neural_model] load_model: {ok} (path={DEFAULT_MODEL_PATH})")


if __name__ == "__main__":  # pragma: no cover
    _main()
