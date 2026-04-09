import { Suspense, lazy, useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Brain, Loader2, Zap, TrendingUp } from 'lucide-react';
import { getAnalytics, getModelMetrics, postSimulate, type ModelMetricsResponse, type SimulateResponse } from '@/services/api';

const SurfacePlot3D = lazy(() =>
  import('../components/SurfacePlot3D').then((m) => ({ default: m.SurfacePlot3D }))
);

const membershipData = [
  { x: 0, low: 1, medium: 0, high: 0 },
  { x: 20, low: 0.8, medium: 0.2, high: 0 },
  { x: 40, low: 0.4, medium: 0.6, high: 0 },
  { x: 50, low: 0, medium: 1, high: 0 },
  { x: 60, low: 0, medium: 0.6, high: 0.4 },
  { x: 80, low: 0, medium: 0.2, high: 0.8 },
  { x: 100, low: 0, medium: 0, high: 1 },
];

const comparisonData = [
  { scenario: 'Low-Low', fuzzy: 25, neural: 27, optimal: 26 },
  { scenario: 'Low-Med', fuzzy: 35, neural: 33, optimal: 34 },
  { scenario: 'Med-Low', fuzzy: 40, neural: 42, optimal: 41 },
  { scenario: 'Med-Med', fuzzy: 50, neural: 48, optimal: 49 },
  { scenario: 'Med-High', fuzzy: 58, neural: 60, optimal: 59 },
  { scenario: 'High-Med', fuzzy: 65, neural: 63, optimal: 64 },
  { scenario: 'High-High', fuzzy: 75, neural: 77, optimal: 76 },
];

// Surface is now rendered as a true 3D plot (Plotly) in <SurfacePlot3D />

export function Analysis() {
  const [liveRules, setLiveRules] = useState<SimulateResponse | null>(null);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [modelConfidence, setModelConfidence] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await postSimulate({
          densities: { north: 55, south: 48, east: 62, west: 44 },
          waiting_time: 52,
          emergency: false,
        });
        if (!cancelled) {
          setLiveRules(s);
          setRulesError(null);
        }
      } catch {
        if (!cancelled) {
          setRulesError('Could not load live rule trace from /simulate.');
          setLiveRules(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await getModelMetrics();
        if (!cancelled) {
          setMetrics(m);
          setMetricsError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setMetrics(null);
          setMetricsError(e instanceof Error ? e.message : 'Metrics API error');
        }
      }

      try {
        const a = await getAnalytics();
        if (!cancelled) setModelConfidence(a.model_confidence_avg);
      } catch {
        if (!cancelled) setModelConfidence(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Neuro-Fuzzy Analysis</h2>
        <p className="text-gray-600 dark:text-gray-400">Advanced AI-based traffic optimization insights</p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg dark:shadow-purple-500/20">
          <Brain className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Neural Network</h3>
          <p className="text-sm text-purple-100">
            R²: <span className="font-bold">{metrics ? metrics.r2.toFixed(4) : '—'}</span> · MAE:{' '}
            <span className="font-bold">{metrics ? metrics.mae.toFixed(2) : '—'}</span>
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg dark:shadow-blue-500/20">
          <Zap className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Fuzzy Logic</h3>
          <p className="text-sm text-blue-100">Handles uncertainty in traffic patterns</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg dark:shadow-green-500/20">
          <TrendingUp className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Hybrid Model</h3>
          <p className="text-sm text-green-100">
            Model confidence:{' '}
            <span className="font-bold">{modelConfidence != null ? `${modelConfidence.toFixed(1)}%` : '—'}</span>
          </p>
        </div>
      </div>

      {metricsError && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Metrics unavailable: {metricsError}
        </div>
      )}

      {/* Membership Functions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Fuzzy Membership Functions</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Traffic density classification (Low, Medium, High)</p>
        
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={membershipData}>
            <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis 
              key="xaxis"
              dataKey="x" 
              stroke="#9CA3AF"
              label={{ value: 'Density (%)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              key="yaxis"
              stroke="#9CA3AF"
              label={{ value: 'Membership', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              key="tooltip"
              contentStyle={{ 
                backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
            />
            <Legend key="legend" />
            <Area key="low" type="monotone" dataKey="low" stroke="#10B981" strokeWidth={2} fill="#10B981" fillOpacity={0.3} />
            <Area key="medium" type="monotone" dataKey="medium" stroke="#F59E0B" strokeWidth={2} fill="#F59E0B" fillOpacity={0.3} />
            <Area key="high" type="monotone" dataKey="high" stroke="#EF4444" strokeWidth={2} fill="#EF4444" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Surface Plot Simulation */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">3D Surface Plot Simulation</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Density × Waiting Time → Green Time</p>

        <Suspense
          fallback={
            <div className="h-[420px] rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 flex items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 font-semibold">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading 3D surface…
              </div>
            </div>
          }
        >
          <SurfacePlot3D />
        </Suspense>
      </div>

      {/* Comparison */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Model Comparison</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Fuzzy vs Neural Network vs Optimal Solution</p>
        
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={comparisonData}>
            <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis key="xaxis" dataKey="scenario" stroke="#9CA3AF" />
            <YAxis key="yaxis" stroke="#9CA3AF" />
            <Tooltip
              key="tooltip"
              contentStyle={{ 
                backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
            />
            <Legend key="legend" />
            <Bar key="fuzzy" dataKey="fuzzy" fill="#F59E0B" radius={[8, 8, 0, 0]} />
            <Bar key="neural" dataKey="neural" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            <Bar key="optimal" dataKey="optimal" fill="#10B981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Neural Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Neural Network Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Training Accuracy:</span>
              <span className="font-bold text-gray-900 dark:text-white">96.7%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Validation Loss:</span>
              <span className="font-bold text-gray-900 dark:text-white">0.032</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Learning Rate:</span>
              <span className="font-bold text-gray-900 dark:text-white">0.001</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Epochs Trained:</span>
              <span className="font-bold text-gray-900 dark:text-white">500</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fuzzy rules (live trace)</h3>
          {rulesError && <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">{rulesError}</p>}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {liveRules && liveRules.triggered_rules.length > 0 ? (
              liveRules.triggered_rules.map((r, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300">{r}</p>
                </div>
              ))
            ) : (
              <>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    IF density is HIGH AND wait is HIGH THEN green is LONG
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-gray-700 dark:text-gray-300">IF density is MEDIUM THEN green is MEDIUM</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-gray-700 dark:text-gray-300">IF density is LOW THEN green is SHORT</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}