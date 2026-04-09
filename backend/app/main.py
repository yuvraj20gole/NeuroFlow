"""
NeuroFlow API — FastAPI entry with neuro-fuzzy routes.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import simulate, predict, emergency, analytics, model
from app.services import neural_model

@asynccontextmanager
async def lifespan(_: FastAPI):
    """
    Load the trained neural model if present.
    If NEUROFLOW_TRAIN_ON_STARTUP=1 and a CSV exists in backend/data/, train+save first.
    """
    train_on_start = os.getenv("NEUROFLOW_TRAIN_ON_STARTUP", "0") == "1"
    if train_on_start:
        csv_path = neural_model.locate_dataset_csv()
        if csv_path is not None:
            neural_model.train_and_save_model(csv_path=csv_path)
    neural_model.load_model()
    yield


app = FastAPI(
    title="NeuroFlow API",
    description="Intelligent Traffic Control — Neuro-Fuzzy backend",
    version="0.2.0",
    lifespan=lifespan,
)

_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulate.router, tags=["simulate"])
app.include_router(predict.router, tags=["predict"])
app.include_router(emergency.router, tags=["emergency"])
app.include_router(analytics.router, tags=["analytics"])
app.include_router(model.router, tags=["model"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "neuroflow-api"}


@app.get("/")
def root():
    return {"message": "NeuroFlow API", "docs": "/docs"}
