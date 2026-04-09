import { useMemo, useRef, useState, useEffect } from 'react';
import { Ambulance, Shield, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { triggerEmergency, type EmergencyRequest, type EmergencyResponse } from '@/services/api';
import { useTraffic } from '@/context/TrafficContext';
import { Switch } from '../components/ui/switch';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'motion/react';

type EmergencyEvent = {
  id: string;
  time: string;
  type: string;
  lane: 'North' | 'South' | 'East' | 'West';
  status: 'Active' | 'Cleared';
  duration?: string;
  colorClass: string;
};

export function Emergency() {
  const { setEmergency, clearEmergency } = useTraffic();
  const [ambulanceMode, setAmbulanceMode] = useState(false);
  const [vipMode, setVipMode] = useState(false);
  const [fireMode, setFireMode] = useState(false);
  const [policeMode, setPoliceMode] = useState(false);
  const [priorityLane, setPriorityLane] = useState<string | null>(null);
  const [apiOverride, setApiOverride] = useState<EmergencyResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [history, setHistory] = useState<EmergencyEvent[]>([]);

  const lanes = ['North', 'South', 'East', 'West'];

  const isEmergencyActive = ambulanceMode || vipMode || fireMode || policeMode;

  const vehicleType = useMemo<EmergencyRequest['vehicle_type']>(() => {
    if (ambulanceMode) return 'ambulance';
    if (fireMode) return 'fire';
    if (policeMode) return 'police';
    return 'vip';
  }, [ambulanceMode, fireMode, policeMode]);

  const vehicleLabel = useMemo(() => {
    if (ambulanceMode) return 'Ambulance';
    if (fireMode) return 'Fire';
    if (policeMode) return 'Police';
    if (vipMode) return 'VIP';
    return 'None';
  }, [ambulanceMode, fireMode, policeMode, vipMode]);

  const colorClass = useMemo(() => {
    if (ambulanceMode) return 'bg-red-500';
    if (fireMode) return 'bg-orange-500';
    if (policeMode) return 'bg-blue-500';
    if (vipMode) return 'bg-purple-500';
    return 'bg-slate-400';
  }, [ambulanceMode, fireMode, policeMode, vipMode]);

  const lastActiveRef = useRef<boolean>(false);

  useEffect(() => {
    if (!priorityLane) {
      setApiOverride(null);
      setApiError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await triggerEmergency({
          lane: priorityLane as EmergencyRequest['lane'],
          vehicle_type: vehicleType,
          active: isEmergencyActive,
        });
        if (!cancelled) {
          setApiOverride(res);
          setApiError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setApiError(e instanceof Error ? e.message : 'Emergency API error');
          setApiOverride(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEmergencyActive, priorityLane, ambulanceMode, fireMode, policeMode, vipMode]);

  useEffect(() => {
    setEmergency({
      active: isEmergencyActive,
      lane: (priorityLane as EmergencyRequest['lane'] | null) ?? null,
      vehicleType: isEmergencyActive ? vehicleType : null,
    });
  }, [isEmergencyActive, priorityLane, setEmergency, vehicleType]);

  useEffect(() => {
    // append timeline events when emergency toggles on/off with a lane selected
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const lane = (priorityLane ?? 'North') as EmergencyEvent['lane'];

    if (!priorityLane) {
      lastActiveRef.current = isEmergencyActive;
      return;
    }

    if (isEmergencyActive && !lastActiveRef.current) {
      const id = `${now.getTime()}-on`;
      setHistory((prev) => [
        {
          id,
          time,
          type: vehicleLabel,
          lane,
          status: 'Active',
          colorClass,
        },
        ...prev,
      ]);
    }

    if (!isEmergencyActive && lastActiveRef.current) {
      const id = `${now.getTime()}-off`;
      setHistory((prev) => [
        {
          id,
          time,
          type: vehicleLabel === 'None' ? 'Emergency' : vehicleLabel,
          lane,
          status: 'Cleared',
          duration: '—',
          colorClass,
        },
        ...prev,
      ]);
    }

    lastActiveRef.current = isEmergencyActive;
  }, [isEmergencyActive, priorityLane, vehicleLabel, colorClass]);

  const handleLanePriority = (lane: string) => {
    setPriorityLane(lane);
  };

  const clearAll = () => {
    setAmbulanceMode(false);
    setVipMode(false);
    setFireMode(false);
    setPoliceMode(false);
    setPriorityLane(null);
    setApiOverride(null);
    setApiError(null);
    clearEmergency();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Emergency & Priority Control</h2>
        <p className="text-gray-600 dark:text-gray-400">Override traffic signals for emergency vehicles and VIP routes</p>
      </motion.div>

      {/* Active Alert Banner with Animation */}
      <AnimatePresence>
        {isEmergencyActive && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="relative overflow-hidden bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white rounded-xl p-6 shadow-2xl"
          >
            {/* Animated background pattern */}
            <motion.div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
              }}
              animate={{ x: [0, 20] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <AlertTriangle className="w-10 h-10" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold">EMERGENCY MODE ACTIVE</h3>
                  <p className="text-sm text-red-100">Priority override is currently enabled</p>
                </div>
              </div>
              <Button
                onClick={clearAll}
                className="bg-white text-red-600 hover:bg-red-50 font-bold shadow-lg"
              >
                Clear All
              </Button>
            </div>

            {/* Pulsing border effect */}
            <motion.div
              className="absolute inset-0 border-4 border-white/30 rounded-xl"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {(apiOverride || apiError) && (
        <div
          className={`rounded-xl p-4 border ${
            apiError
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
              : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
          }`}
        >
          <p className="text-sm font-semibold mb-1">Controller response (POST /emergency)</p>
          {apiError ? (
            <p className="text-sm">{apiError}</p>
          ) : (
            <p className="text-sm">{apiOverride?.message}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Controls */}
        <div className="space-y-6">
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800"
            whileHover={{ scale: 1.01, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Emergency Vehicle Detection</h3>

            <div className="space-y-6">
              {/* Ambulance */}
              <motion.div
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  ambulanceMode
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-600'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
                whileHover={{ scale: 1.02 }}
                animate={ambulanceMode ? { boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)' } : {}}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className="p-3 bg-red-500 rounded-lg"
                    animate={ambulanceMode ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1, repeat: ambulanceMode ? Infinity : 0 }}
                  >
                    <Ambulance className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Ambulance</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Medical emergency priority</p>
                  </div>
                </div>
                <Switch
                  checked={ambulanceMode}
                  onCheckedChange={setAmbulanceMode}
                />
              </motion.div>

              {/* Fire Truck */}
              <motion.div
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  fireMode
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500 dark:border-orange-600'
                    : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                }`}
                whileHover={{ scale: 1.02 }}
                animate={fireMode ? { boxShadow: '0 0 20px rgba(249, 115, 22, 0.3)' } : {}}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className="p-3 bg-orange-500 rounded-lg"
                    animate={fireMode ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1, repeat: fireMode ? Infinity : 0 }}
                  >
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Fire Truck</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Fire emergency response</p>
                  </div>
                </div>
                <Switch
                  checked={fireMode}
                  onCheckedChange={setFireMode}
                />
              </motion.div>

              {/* Police */}
              <motion.div
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  policeMode
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-600'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}
                whileHover={{ scale: 1.02 }}
                animate={policeMode ? { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' } : {}}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className="p-3 bg-blue-500 rounded-lg"
                    animate={policeMode ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1, repeat: policeMode ? Infinity : 0 }}
                  >
                    <Shield className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Police Vehicle</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Law enforcement priority</p>
                  </div>
                </div>
                <Switch
                  checked={policeMode}
                  onCheckedChange={setPoliceMode}
                />
              </motion.div>

              {/* VIP */}
              <motion.div
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  vipMode
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 dark:border-purple-600'
                    : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                }`}
                whileHover={{ scale: 1.02 }}
                animate={vipMode ? { boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)' } : {}}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className="p-3 bg-purple-500 rounded-lg"
                    animate={vipMode ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1, repeat: vipMode ? Infinity : 0 }}
                  >
                    <Shield className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">VIP Lane</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Government / VIP convoy</p>
                  </div>
                </div>
                <Switch
                  checked={vipMode}
                  onCheckedChange={setVipMode}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Lane Selection */}
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Select Priority Lane</h3>

            <div className="grid grid-cols-2 gap-4">
              {lanes.map((lane) => (
                <motion.button
                  key={lane}
                  onClick={() => handleLanePriority(lane)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    priorityLane === lane
                      ? 'bg-green-500 border-green-500 text-white shadow-lg'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:border-green-500'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={priorityLane === lane ? { boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)' } : {}}
                >
                  <div className="text-lg font-bold">{lane}</div>
                  <AnimatePresence>
                    {priorityLane === lane && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <CheckCircle className="w-5 h-5 mt-2 mx-auto" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Visual Indicator */}
        <motion.div
          className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800"
          whileHover={{ scale: 1.005 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Live Junction Status</h3>

          <div className="relative w-full aspect-square mb-6">
            {/* Central Intersection */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-40 h-40 bg-gray-700 dark:bg-gray-800 rounded-lg"
                animate={isEmergencyActive ? { boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)' } : {}}
              />
            </div>

            {/* Glowing green path highlight when emergency active */}
            <AnimatePresence>
              {isEmergencyActive && priorityLane && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="absolute inset-0"
                    animate={{ opacity: [0.35, 0.6, 0.35] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      background:
                        priorityLane === 'North'
                          ? 'radial-gradient(260px 220px at 50% 10%, rgba(34,197,94,0.55), transparent 60%)'
                          : priorityLane === 'South'
                            ? 'radial-gradient(260px 220px at 50% 90%, rgba(34,197,94,0.55), transparent 60%)'
                            : priorityLane === 'East'
                              ? 'radial-gradient(220px 260px at 90% 50%, rgba(34,197,94,0.55), transparent 60%)'
                              : 'radial-gradient(220px 260px at 10% 50%, rgba(34,197,94,0.55), transparent 60%)',
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* North Lane */}
            <motion.div
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1/3 transition-all ${
                priorityLane === 'North' ? 'bg-green-500' : 'bg-gray-600 dark:bg-gray-700'
              }`}
              animate={priorityLane === 'North' ? {
                boxShadow: '0 0 40px rgba(34, 197, 94, 0.6)',
              } : {}}
            >
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white font-bold text-lg">
                NORTH
              </div>
              <AnimatePresence>
                {priorityLane === 'North' && (
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <CheckCircle className="w-10 h-10 text-white" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* South Lane */}
            <motion.div
              className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1/3 transition-all ${
                priorityLane === 'South' ? 'bg-green-500' : 'bg-gray-600 dark:bg-gray-700'
              }`}
              animate={priorityLane === 'South' ? {
                boxShadow: '0 0 40px rgba(34, 197, 94, 0.6)',
              } : {}}
            >
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white font-bold text-lg">
                SOUTH
              </div>
              <AnimatePresence>
                {priorityLane === 'South' && (
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <CheckCircle className="w-10 h-10 text-white" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* East Lane */}
            <motion.div
              className={`absolute right-0 top-1/2 -translate-y-1/2 h-32 w-1/3 transition-all ${
                priorityLane === 'East' ? 'bg-green-500' : 'bg-gray-600 dark:bg-gray-700'
              }`}
              animate={priorityLane === 'East' ? {
                boxShadow: '0 0 40px rgba(34, 197, 94, 0.6)',
              } : {}}
            >
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-white font-bold text-lg">
                EAST
              </div>
              <AnimatePresence>
                {priorityLane === 'East' && (
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <CheckCircle className="w-10 h-10 text-white" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* West Lane */}
            <motion.div
              className={`absolute left-0 top-1/2 -translate-y-1/2 h-32 w-1/3 transition-all ${
                priorityLane === 'West' ? 'bg-green-500' : 'bg-gray-600 dark:bg-gray-700'
              }`}
              animate={priorityLane === 'West' ? {
                boxShadow: '0 0 40px rgba(34, 197, 94, 0.6)',
              } : {}}
            >
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white font-bold text-lg">
                WEST
              </div>
              <AnimatePresence>
                {priorityLane === 'West' && (
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <CheckCircle className="w-10 h-10 text-white" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Status Info */}
          <div className="space-y-3">
            <motion.div
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Priority Lane:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {priorityLane || 'None'}
                </span>
              </div>
            </motion.div>
            <motion.div
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Emergency Type:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {ambulanceMode && 'Ambulance'}
                  {fireMode && 'Fire'}
                  {policeMode && 'Police'}
                  {vipMode && 'VIP'}
                  {!isEmergencyActive && 'None'}
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Emergency Timeline */}
      <motion.div
        className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Emergency Event Timeline
        </h3>
        <div className="space-y-2">
          {(history.length > 0
            ? history
            : [
                { id: 'demo-1', time: '14:35:22', type: 'Ambulance', lane: 'North', status: 'Cleared', duration: '2m 15s', colorClass: 'bg-red-500' },
                { id: 'demo-2', time: '13:20:10', type: 'Police', lane: 'East', status: 'Cleared', duration: '1m 45s', colorClass: 'bg-blue-500' },
                { id: 'demo-3', time: '11:45:33', type: 'VIP', lane: 'South', status: 'Cleared', duration: '3m 30s', colorClass: 'bg-purple-500' },
                { id: 'demo-4', time: '09:12:45', type: 'Fire', lane: 'West', status: 'Cleared', duration: '2m 50s', colorClass: 'bg-orange-500' },
              ]
          ).map((event, i) => (
            <motion.div
              key={event.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              whileHover={{ scale: 1.01, x: 5 }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-1 h-12 ${event.colorClass} rounded-full`} />
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-400 min-w-[80px]">{event.time}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[100px]">{event.type}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{event.lane} Lane</span>
                  {event.duration && (
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs">{event.duration}</span>
                    </div>
                  )}
                </div>
              </div>
              <span
                className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  event.status === 'Active'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                }`}
              >
                {event.status}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
