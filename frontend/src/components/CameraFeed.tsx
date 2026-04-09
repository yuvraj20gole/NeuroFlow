import { memo, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';

type Lane = 'North' | 'South' | 'East' | 'West';

export type CameraFeedProps = {
  densities: Record<Lowercase<Lane>, number>;
  className?: string;
};

type Detection = {
  id: string;
  label: 'Car' | 'Bus';
  confidence: number;
  x: number; // 0..100 (%)
  y: number; // 0..100 (%)
  w: number; // 0..100 (%)
  h: number; // 0..100 (%)
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function buildDetections(lane: Lane, density: number): Detection[] {
  const count = clamp(Math.floor(density / 25), 0, 6);
  const boxes: Detection[] = [];

  for (let i = 0; i < count; i++) {
    const isBus = Math.random() > 0.74;
    const w = isBus ? 26 + Math.random() * 10 : 18 + Math.random() * 10;
    const h = isBus ? 22 + Math.random() * 10 : 16 + Math.random() * 10;
    const x = clamp(6 + Math.random() * (100 - w - 12), 0, 100);
    const y = clamp(18 + Math.random() * (100 - h - 30), 0, 100);
    const confidence = isBus ? 80 + Math.random() * 10 : 85 + Math.random() * 10;
    boxes.push({
      id: `${lane}-${i}`,
      label: isBus ? 'Bus' : 'Car',
      confidence: Math.round(confidence),
      x,
      y,
      w,
      h,
    });
  }
  return boxes;
}

const lanes: Lane[] = ['North', 'South', 'East', 'West'];

export const CameraFeed = memo(({ densities, className }: CameraFeedProps) => {
  const [ts, setTs] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setTs(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setTick((v) => (v + 1) % 60);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const detectionsByLane = useMemo(() => {
    return {
      North: buildDetections('North', densities.north),
      South: buildDetections('South', densities.south),
      East: buildDetections('East', densities.east),
      West: buildDetections('West', densities.west),
    } satisfies Record<Lane, Detection[]>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [densities.east, densities.north, densities.south, densities.west, tick]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">AI-Powered Traffic Monitoring</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Simulated AI Feed · Roadside cameras · Smart-city overlay</p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-700">
          AI Detection Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {lanes.map((lane) => {
          const d =
            lane === 'North'
              ? densities.north
              : lane === 'South'
                ? densities.south
                : lane === 'East'
                  ? densities.east
                  : densities.west;
          const det = detectionsByLane[lane];

          return (
            <div
              key={lane}
              className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-950 aspect-video shadow-sm dark:shadow-[0_0_0_1px_rgba(34,211,238,0.14),0_18px_60px_rgba(0,0,0,0.45)]"
            >
              {/* Subtle road/intersection background (SVG) */}
              <svg
                className="absolute inset-0 h-full w-full opacity-70"
                viewBox="0 0 640 360"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="nf-road" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0b1220" />
                    <stop offset="100%" stopColor="#020617" />
                  </linearGradient>
                </defs>
                <rect width="640" height="360" fill="url(#nf-road)" />
                {/* cross roads */}
                <rect x="260" y="0" width="120" height="360" fill="#0f172a" opacity="0.95" />
                <rect x="0" y="140" width="640" height="80" fill="#0f172a" opacity="0.95" />
                {/* lane markings */}
                {Array.from({ length: 10 }).map((_, i) => (
                  <rect
                    key={`v-${i}`}
                    x="316"
                    y={i * 40 + 6}
                    width="8"
                    height="18"
                    fill="#e2e8f0"
                    opacity="0.18"
                  />
                ))}
                {Array.from({ length: 14 }).map((_, i) => (
                  <rect
                    key={`h-${i}`}
                    x={i * 46 + 8}
                    y="176"
                    width="18"
                    height="8"
                    fill="#e2e8f0"
                    opacity="0.18"
                  />
                ))}
                {/* center box */}
                <rect x="260" y="140" width="120" height="80" fill="#111827" opacity="0.95" />
              </svg>

              {/* dark overlay */}
              <div className="absolute inset-0 bg-black/50" />

              {/* subtle glow */}
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_25%,rgba(34,211,238,0.35),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.25),transparent_55%)]" />

              {/* noise/grain overlay */}
              <div
                className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, rgba(255,255,255,0.10) 0, rgba(255,255,255,0.10) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 4px)',
                }}
              />

              {/* scanline */}
              <motion.div
                className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60"
                animate={{ top: ['-5%', '105%'] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
              />

              {/* overlays */}
              <div className="absolute top-2 left-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-2 text-[10px] px-2 py-0.5 rounded bg-black/60 text-white font-bold backdrop-blur-sm">
                  <motion.span
                    className="relative inline-flex h-2 w-2"
                    animate={{ opacity: [1, 0.35, 1] }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <span className="absolute inset-0 rounded-full bg-red-500/50 blur-[6px]" />
                    <span className="relative h-2 w-2 rounded-full bg-red-500" />
                  </motion.span>
                  REC ● LIVE
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-black/60 text-white/90 font-semibold backdrop-blur-sm">
                  Simulated AI Feed
                </span>
              </div>

              <div className="absolute top-2 right-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-black/60 text-white/90 font-mono backdrop-blur-sm">
                  {ts}
                </span>
              </div>

              <div className="absolute left-2 right-2 bottom-10 flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded bg-black/60 text-white/90 font-semibold backdrop-blur-sm">
                  {lane} Lane
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-black/60 text-white/90 font-semibold backdrop-blur-sm">
                  AI Detection Active
                </span>
              </div>

              {/* density bar */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="flex items-center justify-between text-[10px] text-white/80 mb-1">
                  <span className="font-semibold">Density: {Math.round(d)}%</span>
                  <span className="font-mono">{Math.round(d)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-1.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${clamp(d, 0, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* detections */}
              {det.map((b) => (
                <motion.div
                  key={b.id}
                  className="absolute border-2 border-green-300/90 rounded-sm shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_0_18px_rgba(34,197,94,0.25)]"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  style={{
                    left: `${b.x}%`,
                    top: `${b.y}%`,
                    width: `${b.w}%`,
                    height: `${b.h}%`,
                  }}
                >
                  <div className="absolute -top-6 left-0 flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/90 text-gray-950 font-bold">
                      {b.label} {b.confidence}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
});

CameraFeed.displayName = 'CameraFeed';

