import { useState, useEffect, useRef } from 'react';
import { Activity, Timer, TrendingUp, Cpu, Wifi, Cloud, Network, Brain, AlertTriangle, Clock, Target } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { TrafficLight } from '../components/TrafficLight';
import { TrafficFlowChart } from '../components/TrafficFlowChart';
import { PredictiveChart } from '../components/PredictiveChart';
import { motion, useInView } from 'motion/react';
import { Switch } from '../components/ui/switch';
import { getPrediction, simulateTraffic, type SimulateResponse } from '@/services/api';
import { SmartCityNetwork } from '../components/SmartCityNetwork';
import { CameraFeed } from '@/components/CameraFeed';
import { useTraffic } from '@/context/TrafficContext';

const trafficData = [
  { time: '00:00', north: 25, south: 48, east: 62, west: 35 },
  { time: '04:00', north: 15, south: 22, east: 38, west: 28 },
  { time: '08:00', north: 85, south: 68, east: 92, west: 75 },
  { time: '12:00', north: 55, south: 72, east: 48, west: 65 },
  { time: '16:00', north: 92, south: 58, east: 78, west: 88 },
  { time: '20:00', north: 42, south: 65, east: 55, west: 48 },
];

const predictiveData = [
  { time: 'Now', congestion: 65 },
  { time: '+1m', congestion: 68 },
  { time: '+2m', congestion: 72 },
  { time: '+3m', congestion: 78 },
  { time: '+4m', congestion: 82 },
  { time: '+5m', congestion: 85 },
];

const lanes = [
  { direction: 'North', density: 75, color: 'bg-red-500', waiting: 45 },
  { direction: 'South', density: 62, color: 'bg-yellow-500', waiting: 32 },
  { direction: 'East', density: 45, color: 'bg-green-500', waiting: 18 },
  { direction: 'West', density: 58, color: 'bg-orange-500', waiting: 28 },
];

// Animated car component
function Car({ direction, delay = 0 }: { direction: 'north' | 'south' | 'east' | 'west'; delay?: number }) {
  const animationConfig = {
    north: { x: '0%', fromY: '100%', toY: '-100%' },
    south: { x: '0%', fromY: '-100%', toY: '100%' },
    east: { y: '0%', fromX: '-100%', toX: '100%' },
    west: { y: '0%', fromX: '100%', toX: '-100%' },
  };

  const config = animationConfig[direction];

  return (
    <motion.div
      className="absolute w-5 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded shadow-lg"
      initial={{
        x: 'fromX' in config ? config.fromX : config.x,
        y: 'fromY' in config ? config.fromY : config.y,
      }}
      animate={{
        x: 'toX' in config ? config.toX : config.x,
        y: 'toY' in config ? config.toY : config.y,
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

// Scroll-reveal wrapper with smooth fade-in
function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export function Dashboard() {
  const { densities, emergency } = useTraffic();
  const [activeSignal, setActiveSignal] = useState<'North' | 'South' | 'East' | 'West'>('North');
  const [timer, setTimer] = useState(45);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [modelAccuracy, setModelAccuracy] = useState(94.2);
  const [isLearning, setIsLearning] = useState(false);
  const [isSpeedMode, setIsSpeedMode] = useState(false);
  const [simResult, setSimResult] = useState<SimulateResponse | null>(null);
  const [simError, setSimError] = useState<string | null>(null);
  const [predictChartData, setPredictChartData] =
    useState<Array<{ time: string; congestion: number }>>(predictiveData);
  const [predictError, setPredictError] = useState<string | null>(null);
  const preemptRef = useRef<{
    wasAuto: boolean;
    prevSignal: 'North' | 'South' | 'East' | 'West';
    prevTimer: number;
  } | null>(null);
  const prevEmergencyActiveRef = useRef<boolean>(false);
  const prevEmergencyLaneRef = useRef<'North' | 'South' | 'East' | 'West' | null>(null);

  useEffect(() => {
    const lane = emergency.lane ?? null;

    const emergencyStarted = emergency.active && !prevEmergencyActiveRef.current;
    const emergencyEnded = !emergency.active && prevEmergencyActiveRef.current;
    const laneChangedWhileActive = emergency.active && lane && lane !== prevEmergencyLaneRef.current;

    if ((emergencyStarted || laneChangedWhileActive) && lane) {
      if (!preemptRef.current) {
        preemptRef.current = { wasAuto: isAutoMode, prevSignal: activeSignal, prevTimer: timer };
      }
      setIsAutoMode(false);
      setActiveSignal(lane);
      const t = simResult?.green_time ? Math.round(simResult.green_time) : 90;
      setTimer(t);
    }

    if (emergencyEnded && preemptRef.current) {
      const prev = preemptRef.current;
      preemptRef.current = null;
      setIsAutoMode(prev.wasAuto);
      setActiveSignal(prev.prevSignal);
      setTimer(prev.prevTimer);
    }

    prevEmergencyActiveRef.current = emergency.active;
    prevEmergencyLaneRef.current = lane;
  }, [activeSignal, emergency.active, emergency.lane, isAutoMode, simResult?.green_time, timer]);

  useEffect(() => {
    // Emergency countdown: keep decrementing even though Auto mode is paused.
    if (!emergency.active || !emergency.lane) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [emergency.active, emergency.lane]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
          const p = await getPrediction();
        if (!cancelled) {
          setPredictChartData(
            p.timeline.map((t) => ({ time: t.label, congestion: t.predicted_congestion }))
          );
          setPredictError(null);
        }
      } catch {
        if (!cancelled) {
          setPredictError('Prediction API unavailable — showing cached curve.');
          setPredictChartData(predictiveData);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const body = {
      densities: {
        north: densities.north,
        south: densities.south,
        east: densities.east,
        west: densities.west,
      },
      waiting_time: Math.max(...lanes.map((l) => l.waiting)),
      emergency: emergency.active,
    };
    (async () => {
      try {
        const s = await simulateTraffic(body);
        if (!cancelled) {
          setSimResult(s);
          setSimError(null);
        }
      } catch {
        if (!cancelled) {
          setSimError('Explainability API unavailable.');
          setSimResult(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [densities.east, densities.north, densities.south, densities.west]);

  // Simulate model learning
  useEffect(() => {
    const learningInterval = setInterval(() => {
      setIsLearning(true);
      setModelAccuracy(prev => {
        const change = (Math.random() - 0.5) * 0.3;
        return Math.min(99.9, Math.max(90, prev + change));
      });
      setTimeout(() => setIsLearning(false), 2000);
    }, 10000);

    return () => clearInterval(learningInterval);
  }, []);

  useEffect(() => {
    if (!isAutoMode) return;

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          const directions: Array<'North' | 'South' | 'East' | 'West'> = ['North', 'South', 'East', 'West'];
          const currentIndex = directions.indexOf(activeSignal);
          const nextIndex = (currentIndex + 1) % directions.length;
          setActiveSignal(directions[nextIndex]);
          return 45;
        }
        return prev - 1;
      });
    }, isSpeedMode ? 500 : 1000); // 2x speed when isSpeedMode is true

    return () => clearInterval(interval);
  }, [activeSignal, isAutoMode, isSpeedMode]);

  // Get current time phase
  const getCurrentPhase = () => {
    const hour = new Date().getHours();
    if (hour >= 7 && hour <= 9) return { label: 'Morning Peak', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' };
    if (hour >= 17 && hour <= 19) return { label: 'Evening Peak', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' };
    if (hour >= 23 || hour <= 5) return { label: 'Low Traffic', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' };
    return { label: 'Normal Traffic', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' };
  };

  const phase = getCurrentPhase();

  const activeLane = lanes.find((l) => l.direction === activeSignal);
  const confidenceScore = simResult?.confidence ?? null;
  const peakForecast =
    predictChartData.length > 0
      ? predictChartData[predictChartData.length - 1]!.congestion
      : 85;

  const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const manualSignals: Array<'North' | 'South' | 'East' | 'West'> = ['North', 'South', 'East', 'West'];

  const perf = {
    congestionReduction: Math.round(24 + (modelAccuracy - 90) * 1.1),
    timeSaved: Math.round(6 + (modelAccuracy - 90) * 0.7),
    efficiency: 87,
  };

  return (
    <div className="space-y-6">
      {emergency.active && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-5 py-4">
          <p className="text-sm font-semibold text-red-800 dark:text-red-200">
            Emergency Override Active{emergency.lane ? ` · Priority: ${emergency.lane}` : ''}{' '}
            {emergency.vehicleType ? `· ${emergency.vehicleType.toUpperCase()}` : ''}
          </p>
          <p className="text-xs text-red-700/80 dark:text-red-200/80 mt-1">
            Hybrid controller is running in preemption mode.
          </p>
        </div>
      )}

      {/* Header with Smart City Integration */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden flex items-center justify-between"
      >
        <div className="pointer-events-none absolute -top-10 -right-24 h-48 w-[520px] opacity-60 dark:opacity-80">
          <SmartCityNetwork className="absolute inset-0" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            NeuroFlow: Intelligent Traffic Control System
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time monitoring powered by Neuro-Fuzzy AI
          </p>
        </div>

        {/* Smart City Status Badges */}
        <div className="flex items-center gap-3">
          <motion.div
            className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Cloud className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-green-700 dark:text-green-400">Cloud Connected</span>
          </motion.div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <Wifi className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">IoT Enabled</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
            <Network className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">Smart City Ready</span>
          </div>
        </div>
      </motion.div>

      {/* Auto/Manual Mode Toggle & Real-Time Learning */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScrollReveal delay={0.1}>
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800"
            whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isAutoMode ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Cpu className={`w-5 h-5 ${isAutoMode ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Control Mode</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isAutoMode ? 'AI Controlled' : 'Manual Override'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                    isAutoMode
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {isAutoMode ? 'AUTO (AI)' : 'MANUAL'}
                </span>
                <Switch checked={isAutoMode} onCheckedChange={setIsAutoMode} />
              </div>
            </div>

            {!isAutoMode && (
              <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 p-3">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Manual override — select active signal
                </p>
                <div className="flex flex-wrap gap-2">
                  {manualSignals.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setActiveSignal(s);
                        setTimer(45);
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                        activeSignal === s
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
                          : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">
                  Timer resets to 45s on manual selection.
                </p>
              </div>
            )}
          </motion.div>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800"
            whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className={`p-2 rounded-lg ${isLearning ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}
                  animate={isLearning ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: isLearning ? Infinity : 0 }}
                >
                  <Brain className={`w-5 h-5 ${isLearning ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`} />
                </motion.div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {isLearning ? 'Model Learning...' : 'Model Stable'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Accuracy: {modelAccuracy.toFixed(1)}%
                  </p>
                </div>
              </div>
              <motion.div
                className={`px-3 py-1 rounded-full text-xs font-semibold ${isLearning ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}
                animate={isLearning ? { opacity: [1, 0.7, 1] } : {}}
                transition={{ duration: 1, repeat: isLearning ? Infinity : 0 }}
              >
                {isLearning ? 'LEARNING' : 'READY'}
              </motion.div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400 mb-2">
                <span>Stability</span>
                <span className="font-mono">{isLearning ? '↻ updating' : '✓ stable'} · {nowLabel}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <motion.div
                  className={`h-2 rounded-full ${
                    isLearning
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                      : 'bg-gradient-to-r from-green-500 to-emerald-400'
                  }`}
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.min(99, Math.max(60, modelAccuracy))}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                />
              </div>
            </div>
          </motion.div>
        </ScrollReveal>
      </div>

      {/* Peak Hour Detection & Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScrollReveal delay={0.2}>
          <motion.div
            className={`${phase.bg} rounded-xl p-4 border border-gray-200/80 dark:border-gray-800`}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center gap-3">
              <Clock className={`w-6 h-6 ${phase.color}`} />
              <div>
                <p className={`font-bold ${phase.color}`}>{phase.label}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {nowLabel} · time-based phase detection
                </p>
              </div>
            </div>
          </motion.div>
        </ScrollReveal>

        <ScrollReveal delay={0.25}>
          <motion.div
            className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white relative overflow-hidden"
            whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(16, 185, 129, 0.4)' }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <motion.div
              className="absolute inset-0 opacity-25"
              animate={{ opacity: [0.2, 0.32, 0.2] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background:
                  'radial-gradient(500px 120px at 20% 20%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(420px 120px at 80% 70%, rgba(255,255,255,0.22), transparent 60%)',
              }}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6" />
                <div>
                  <p className="font-bold">Efficiency Score</p>
                  <p className="text-sm text-green-100">Congestion reduction • time saved • throughput</p>
                </div>
              </div>
              <span className="text-3xl font-bold">87%</span>
            </div>
          </motion.div>
        </ScrollReveal>
      </div>

      {/* Performance Insights Widget */}
      <ScrollReveal delay={0.28}>
        <motion.div
          className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800"
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Insights</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Smart-city KPIs driven by the hybrid controller
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold">
              Live (simulated)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900 p-4"
              whileHover={{ y: -2 }}
            >
              <p className="text-xs text-gray-600 dark:text-gray-400">Congestion reduction</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{perf.congestionReduction}%</p>
              <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <motion.div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, perf.congestionReduction)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </motion.div>

            <motion.div
              className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-900 p-4"
              whileHover={{ y: -2 }}
            >
              <p className="text-xs text-gray-600 dark:text-gray-400">Time saved (avg)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{perf.timeSaved} min</p>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Reduced idle time via adaptive green phases
              </p>
            </motion.div>

            <motion.div
              className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-900 p-4"
              whileHover={{ y: -2 }}
            >
              <p className="text-xs text-gray-600 dark:text-gray-400">Efficiency score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{perf.efficiency}%</p>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Balanced throughput, safety, and emergency priority
              </p>
            </motion.div>
          </div>
        </motion.div>
      </ScrollReveal>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ScrollReveal key="active-signal" delay={0.3}>
          <motion.div whileHover={{ y: -5, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} transition={{ type: 'spring', stiffness: 300 }}>
            <StatCard title="Active Signal" value={activeSignal} icon={Activity} color="green" />
          </motion.div>
        </ScrollReveal>
        <ScrollReveal key="green-timer" delay={0.35}>
          <motion.div whileHover={{ y: -5, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} transition={{ type: 'spring', stiffness: 300 }}>
            <StatCard 
              title="Green Timer" 
              value={`${timer}s`} 
              icon={Timer} 
              color="yellow" 
              trend="Time remaining"
              showSpeedButton={true}
              onSpeedToggle={() => setIsSpeedMode(!isSpeedMode)}
              isSpeedMode={isSpeedMode}
            />
          </motion.div>
        </ScrollReveal>
        <ScrollReveal key="avg-flow" delay={0.4}>
          <motion.div whileHover={{ y: -5, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} transition={{ type: 'spring', stiffness: 300 }}>
            <StatCard title="Avg Flow Rate" value="24.5" icon={TrendingUp} color="blue" trend="+12% from yesterday" />
          </motion.div>
        </ScrollReveal>
        <ScrollReveal key="system-status" delay={0.45}>
          <motion.div whileHover={{ y: -5, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} transition={{ type: 'spring', stiffness: 300 }}>
            <StatCard title="System Status" value="AI Active" icon={Cpu} color="purple" trend="Learning mode enabled" />
          </motion.div>
        </ScrollReveal>
      </div>

      {/* AI Explainability Panel — data from POST /simulate */}
      <ScrollReveal delay={0.4}>
        <motion.div
          className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 shadow-lg text-white"
          whileHover={{ scale: 1.01, boxShadow: '0 12px 40px rgba(139, 92, 246, 0.4)' }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="flex items-start gap-4">
            <motion.div
              className="p-3 bg-white/20 rounded-lg"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Brain className="w-8 h-8" />
            </motion.div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2 flex flex-wrap items-center gap-2">
                AI Decision Explanation
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  Confidence: {confidenceScore != null ? `${confidenceScore}%` : '—'}
                </span>
              </h3>
              {simError && (
                <p className="text-sm text-amber-100 mb-2">{simError}</p>
              )}
              <p className="text-purple-100 mb-4">
                {simResult ? (
                  <>
                    <strong>{simResult.priority_lane}</strong> lane selected due to{' '}
                    <strong>HIGH density</strong> and <strong>LONG waiting time</strong>.{' '}
                    <span className="opacity-95">{simResult.explanation}</span>
                  </>
                ) : (
                  <>
                    Live signal: <strong>{activeSignal}</strong> (UI rotation).{' '}
                    <strong>HIGH density ({activeLane?.density}%)</strong>, waiting{' '}
                    <strong>{activeLane?.waiting}s</strong> — connect the API for hybrid explanation text.
                  </>
                )}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-sm text-purple-200">Fuzzy output</p>
                  <p className="font-semibold">{simResult ? `${simResult.fuzzy_output}s` : '—'}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-sm text-purple-200">Neural output</p>
                  <p className="font-semibold">{simResult ? `${simResult.neural_output}s` : '—'}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-sm text-purple-200">Hybrid green time</p>
                  <p className="font-semibold">{simResult ? `${simResult.green_time}s` : '—'}</p>
                </div>
              </div>
              {simResult && simResult.triggered_rules.length > 0 && (
                <div className="mt-4 space-y-1 text-xs text-purple-100/90 max-h-24 overflow-y-auto font-mono">
                  {simResult.triggered_rules.slice(0, 4).map((r, i) => (
                    <p key={i}>{r}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </ScrollReveal>

      {/* Main Content Grid - Live Traffic + AI Monitoring + Predictive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3D 4-Way Intersection Visualization */}
        <ScrollReveal delay={0.45}>
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800 lg:col-span-2"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Live Traffic Overview
            </h3>

            <div
              className="relative w-full aspect-square max-w-4xl mx-auto"
              style={{
                perspective: '1500px',
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Intersection Center with Glow */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{
                  boxShadow: isAutoMode
                    ? `0 0 40px rgba(16, 185, 129, 0.3)`
                    : '0 0 20px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div className="w-48 h-48 bg-gray-800 dark:bg-gray-700 rounded-lg shadow-2xl"></div>
              </motion.div>

              {/* North Road with Cars */}
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1/3 bg-gray-600 dark:bg-gray-700"
                animate={{
                  boxShadow: activeSignal === 'North'
                    ? '0 0 30px rgba(16, 185, 129, 0.6), inset 0 0 20px rgba(16, 185, 129, 0.2)'
                    : '0 0 0px rgba(0, 0, 0, 0)'
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-2 h-10 bg-white/50 rounded"></div>
                  <div className="w-2 h-10 bg-white/50 rounded"></div>
                  <div className="w-2 h-10 bg-white/50 rounded"></div>
                </div>
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
                  <TrafficLight active={activeSignal === 'North' ? 'green' : 'red'} size="lg" />
                </div>
                {activeSignal === 'North' && (
                  <>
                    <Car direction="north" delay={0} />
                    <Car direction="north" delay={2} />
                  </>
                )}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white font-bold">NORTH</div>
              </motion.div>

              {/* South Road */}
              <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-1/3 bg-gray-600 dark:bg-gray-700"
                animate={{
                  boxShadow: activeSignal === 'South'
                    ? '0 0 30px rgba(16, 185, 129, 0.6), inset 0 0 20px rgba(16, 185, 129, 0.2)'
                    : '0 0 0px rgba(0, 0, 0, 0)'
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-2 h-10 bg-white/50 rounded"></div>
                  <div className="w-2 h-10 bg-white/50 rounded"></div>
                  <div className="w-2 h-10 bg-white/50 rounded"></div>
                </div>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                  <TrafficLight active={activeSignal === 'South' ? 'green' : 'red'} size="lg" />
                </div>
                {activeSignal === 'South' && (
                  <>
                    <Car direction="south" delay={0} />
                    <Car direction="south" delay={2} />
                  </>
                )}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white font-bold">SOUTH</div>
              </motion.div>

              {/* East Road */}
              <motion.div
                className="absolute right-0 top-1/2 -translate-y-1/2 h-48 w-1/3 bg-gray-600 dark:bg-gray-700"
                animate={{
                  boxShadow: activeSignal === 'East'
                    ? '0 0 30px rgba(16, 185, 129, 0.6), inset 0 0 20px rgba(16, 185, 129, 0.2)'
                    : '0 0 0px rgba(0, 0, 0, 0)'
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 flex items-center justify-center gap-4">
                  <div className="h-2 w-10 bg-white/50 rounded"></div>
                  <div className="h-2 w-10 bg-white/50 rounded"></div>
                  <div className="h-2 w-10 bg-white/50 rounded"></div>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10">
                  <TrafficLight active={activeSignal === 'East' ? 'green' : 'red'} size="lg" />
                </div>
                {activeSignal === 'East' && (
                  <>
                    <Car direction="east" delay={0} />
                    <Car direction="east" delay={2} />
                  </>
                )}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold">EAST</div>
              </motion.div>

              {/* West Road */}
              <motion.div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-48 w-1/3 bg-gray-600 dark:bg-gray-700"
                animate={{
                  boxShadow: activeSignal === 'West'
                    ? '0 0 30px rgba(16, 185, 129, 0.6), inset 0 0 20px rgba(16, 185, 129, 0.2)'
                    : '0 0 0px rgba(0, 0, 0, 0)'
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 flex items-center justify-center gap-4">
                  <div className="h-2 w-10 bg-white/50 rounded"></div>
                  <div className="h-2 w-10 bg-white/50 rounded"></div>
                  <div className="h-2 w-10 bg-white/50 rounded"></div>
                </div>
                <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10">
                  <TrafficLight active={activeSignal === 'West' ? 'green' : 'red'} size="lg" />
                </div>
                {activeSignal === 'West' && (
                  <>
                    <Car direction="west" delay={0} />
                    <Car direction="west" delay={2} />
                  </>
                )}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white font-bold">WEST</div>
              </motion.div>
            </div>
          </motion.div>
        </ScrollReveal>

        {/* AI-enhanced camera feeds */}
        <ScrollReveal delay={0.5}>
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800 lg:col-span-2"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <CameraFeed
              densities={{
                north: densities.north,
                south: densities.south,
                east: densities.east,
                west: densities.west,
              }}
            />
          </motion.div>
        </ScrollReveal>

        {/* Predictive Traffic Panel */}
        <ScrollReveal delay={0.55}>
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">AI Prediction</h3>
              <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Next 5 min</span>
              </div>
            </div>

            {predictError && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">{predictError}</p>
            )}
            <PredictiveChart data={predictChartData} />

            <div className="mt-6 space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Forecast Alert</span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Model expects congestion near <strong>{Math.round(peakForecast)}%</strong> by +5m (GET /predict).
                </p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Predicted Peak</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {Math.round(peakForecast)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.min(100, peakForecast)}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </ScrollReveal>
      </div>

      {/* Traffic Flow Chart */}
      <ScrollReveal delay={0.6}>
        <motion.div
          className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800"
          whileHover={{ scale: 1.005 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Real-time Traffic Flow</h3>

          <TrafficFlowChart data={trafficData} />
        </motion.div>
      </ScrollReveal>
    </div>
  );
}