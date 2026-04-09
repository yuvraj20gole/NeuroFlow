/**
 * NeuroFlow backend client. Base URL from VITE_API_URL (see .env.example).
 */

const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_URL;
  if (url && String(url).trim()) {
    return String(url).replace(/\/$/, '');
  }
  return 'http://localhost:8000';
};

export type LaneDensities = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type SimulateRequest = {
  densities: LaneDensities;
  waiting_time: number;
  emergency: boolean;
};

export type SimulateResponse = {
  priority_lane: string;
  green_time: number;
  confidence: number;
  explanation: string;
  fuzzy_output: number;
  neural_output: number;
  triggered_rules: string[];
};

export type PredictTimelinePoint = {
  step: number;
  label: string;
  predicted_congestion: number;
};

export type PredictResponse = {
  timeline: PredictTimelinePoint[];
  values: number[];
};

export type EmergencyRequest = {
  lane: 'North' | 'South' | 'East' | 'West';
  vehicle_type: 'ambulance' | 'fire' | 'police' | 'vip';
  active: boolean;
};

export type EmergencyResponse = {
  override: boolean;
  priority_lane: string;
  green_time: number;
  message: string;
  immediate_clearance: boolean;
};

export type AnalyticsResponse = {
  efficiency_score: number;
  avg_wait_seconds: number;
  throughput_vehicles_per_hour: number;
  incidents_handled_24h: number;
  model_confidence_avg: number;
};

export type ModelMetricsResponse = {
  r2: number;
  mae: number;
  n_train: number;
  n_test: number;
  dataset_path: string;
  model_confidence: number;
};

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const err = await res.json();
      if (typeof err?.detail === 'string') detail = err.detail;
      else if (Array.isArray(err?.detail)) detail = JSON.stringify(err.detail);
    } catch {
      /* use statusText */
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function postSimulate(body: SimulateRequest): Promise<SimulateResponse> {
  const res = await fetch(`${getBaseUrl()}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseJson<SimulateResponse>(res);
}

export async function getPredict(): Promise<PredictResponse> {
  const res = await fetch(`${getBaseUrl()}/predict`);
  return parseJson<PredictResponse>(res);
}

export async function postEmergency(body: EmergencyRequest): Promise<EmergencyResponse> {
  const res = await fetch(`${getBaseUrl()}/emergency`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseJson<EmergencyResponse>(res);
}

export async function getAnalytics(): Promise<AnalyticsResponse> {
  const res = await fetch(`${getBaseUrl()}/analytics`);
  return parseJson<AnalyticsResponse>(res);
}

export async function getModelMetrics(): Promise<ModelMetricsResponse> {
  const res = await fetch(`${getBaseUrl()}/model/metrics`);
  return parseJson<ModelMetricsResponse>(res);
}

// --- Required API surface (Phase 7 spec) ---

export async function simulateTraffic(body: SimulateRequest): Promise<SimulateResponse> {
  return postSimulate(body);
}

export async function getPrediction(): Promise<PredictResponse> {
  return getPredict();
}

export async function triggerEmergency(body: EmergencyRequest): Promise<EmergencyResponse> {
  return postEmergency(body);
}
