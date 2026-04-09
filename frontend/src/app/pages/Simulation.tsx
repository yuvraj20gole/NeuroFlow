import { useEffect, useState } from 'react';
import { Car, Bus, Ambulance, Loader2 } from 'lucide-react';
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';
import { Button } from '../components/ui/button';
import { TrafficLight } from '../components/TrafficLight';
import { motion } from 'motion/react';
import { simulateTraffic, type SimulateResponse } from '@/services/api';
import { useTraffic } from '@/context/TrafficContext';

export function Simulation() {
  const { setDensities, emergency, setEmergency } = useTraffic();
  const [northDensity, setNorthDensity] = useState(50);
  const [southDensity, setSouthDensity] = useState(40);
  const [eastDensity, setEastDensity] = useState(60);
  const [westDensity, setWestDensity] = useState(35);
  const [waitingTime, setWaitingTime] = useState(45);
  const [result, setResult] = useState<SimulateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priorityLane = result?.priority_lane ?? '';

  useEffect(() => {
    setDensities({
      north: northDensity,
      south: southDensity,
      east: eastDensity,
      west: westDensity,
    });
  }, [eastDensity, northDensity, setDensities, southDensity, westDensity]);

  const calculateSignal = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await simulateTraffic({
        densities: {
          north: northDensity,
          south: southDensity,
          east: eastDensity,
          west: westDensity,
        },
        waiting_time: waitingTime,
        emergency: emergency.active,
      });
      setResult(data);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Traffic Simulation</h2>
        <p className="text-gray-600 dark:text-gray-400">Interactive junction control and testing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulation View */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">4-Way Intersection</h3>
          
          <div className="relative w-full aspect-square">
            {/* Central Intersection */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 bg-gradient-to-br from-gray-700 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-2xl">
                <div className="w-full h-full grid grid-cols-2 gap-2 p-4">
                  <div className="bg-yellow-400/20 rounded"></div>
                  <div className="bg-yellow-400/20 rounded"></div>
                  <div className="bg-yellow-400/20 rounded"></div>
                  <div className="bg-yellow-400/20 rounded"></div>
                </div>
              </div>
            </div>
            
            {/* North Lane */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1/3 bg-gray-600 dark:bg-gray-700">
              <div className="absolute top-4 left-1/2 -translate-x-1/2">
                <TrafficLight active={priorityLane === 'North' ? 'green' : 'red'} size="lg" />
              </div>
              <div className="absolute top-20 left-1/2 -translate-x-1/2 space-y-2">
                {Array.from({ length: Math.floor(northDensity / 25) }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Car className="w-6 h-6 text-blue-400" />
                  </motion.div>
                ))}
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white font-bold">
                N {northDensity}%
              </div>
            </div>
            
            {/* South Lane */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-1/3 bg-gray-600 dark:bg-gray-700">
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <TrafficLight active={priorityLane === 'South' ? 'green' : 'red'} size="lg" />
              </div>
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 space-y-2">
                {Array.from({ length: Math.floor(southDensity / 25) }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Car className="w-6 h-6 text-green-400 rotate-180" />
                  </motion.div>
                ))}
              </div>
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white font-bold">
                S {southDensity}%
              </div>
            </div>
            
            {/* East Lane */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-40 w-1/3 bg-gray-600 dark:bg-gray-700">
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <TrafficLight active={priorityLane === 'East' ? 'green' : 'red'} size="lg" />
              </div>
              <div className="absolute right-20 top-1/2 -translate-y-1/2 flex gap-2">
                {Array.from({ length: Math.floor(eastDensity / 25) }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Bus className="w-6 h-6 text-yellow-400 -rotate-90" />
                  </motion.div>
                ))}
              </div>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-white font-bold">
                E {eastDensity}%
              </div>
            </div>
            
            {/* West Lane */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-40 w-1/3 bg-gray-600 dark:bg-gray-700">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <TrafficLight active={priorityLane === 'West' ? 'green' : 'red'} size="lg" />
              </div>
              <div className="absolute left-20 top-1/2 -translate-y-1/2 flex gap-2">
                {Array.from({ length: Math.floor(westDensity / 25) }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Car className="w-6 h-6 text-red-400 rotate-90" />
                  </motion.div>
                ))}
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white font-bold">
                W {westDensity}%
              </div>
            </div>

            {/* Emergency Vehicle */}
            {emergency.active && (
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <Ambulance className="w-10 h-10 text-red-500" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Control Panel */}
        <div className="space-y-6">
          {/* Density Controls */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Traffic Density Control</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">North Lane</label>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{northDensity}%</span>
                </div>
                <Slider
                  value={[northDensity]}
                  onValueChange={(v) => setNorthDensity(v[0])}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">South Lane</label>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{southDensity}%</span>
                </div>
                <Slider
                  value={[southDensity]}
                  onValueChange={(v) => setSouthDensity(v[0])}
                  max={100}
                  step={1}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">East Lane</label>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{eastDensity}%</span>
                </div>
                <Slider
                  value={[eastDensity]}
                  onValueChange={(v) => setEastDensity(v[0])}
                  max={100}
                  step={1}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">West Lane</label>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{westDensity}%</span>
                </div>
                <Slider
                  value={[westDensity]}
                  onValueChange={(v) => setWestDensity(v[0])}
                  max={100}
                  step={1}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Queue wait (simulated)</label>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{waitingTime}s</span>
                </div>
                <Slider
                  value={[waitingTime]}
                  onValueChange={(v) => setWaitingTime(v[0])}
                  max={120}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Emergency Control */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Emergency Vehicle</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Activate priority mode</p>
              </div>
              <Switch
                checked={emergency.active}
                onCheckedChange={(checked) => {
                  setEmergency({
                    ...emergency,
                    active: checked,
                    vehicleType: checked ? (emergency.vehicleType ?? 'ambulance') : null,
                  });
                }}
              />
            </div>
            {emergency.active && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">🚨 Emergency Mode Active</p>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-200">
              {error}. Ensure the API is running (<code className="text-xs">uvicorn app.main:app --reload</code>) and{' '}
              <code className="text-xs">VITE_API_URL</code> matches.
            </div>
          )}

          {/* Calculate Button */}
          <Button
            onClick={calculateSignal}
            disabled={loading}
            className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-semibold text-lg shadow-lg shadow-green-500/30 disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Computing…
              </span>
            ) : (
              'Calculate Optimal Signal'
            )}
          </Button>

          {/* Results */}
          {result && (
            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800 shadow-lg space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">Hybrid neuro-fuzzy output</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Priority lane</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{result.priority_lane}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Green time</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{result.green_time}s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Confidence</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{result.confidence}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Fuzzy / neural</span>
                  <span className="font-mono text-gray-900 dark:text-white">
                    {result.fuzzy_output}s / {result.neural_output}s
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed border-t border-green-200/60 dark:border-green-800 pt-3">
                {result.explanation}
              </p>
              {result.triggered_rules.length > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 max-h-32 overflow-y-auto">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">Triggered rules</p>
                  {result.triggered_rules.map((r, i) => (
                    <p key={i} className="font-mono opacity-90">
                      {r}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
