import { memo } from 'react';
import { motion } from 'motion/react';

type SmartCityNetworkProps = {
  className?: string;
};

/**
 * Lightweight decorative network graphic (nodes/lines) for "Smart City" vibe.
 * Purely presentational; no layout impact beyond its container.
 */
export const SmartCityNetwork = memo(({ className }: SmartCityNetworkProps) => {
  return (
    <div className={className} aria-hidden>
      <svg viewBox="0 0 800 180" className="h-full w-full">
        <defs>
          <linearGradient id="nf-net" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(59 130 246)" stopOpacity="0.55" />
            <stop offset="50%" stopColor="rgb(34 211 238)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="rgb(168 85 247)" stopOpacity="0.55" />
          </linearGradient>
          <filter id="nf-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 14 -6"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g stroke="url(#nf-net)" strokeWidth="2" opacity="0.75" filter="url(#nf-glow)">
          <path d="M40 110 C160 40, 260 150, 360 90 S560 30, 760 110" fill="none" />
          <path d="M120 150 C220 70, 340 160, 460 105 S640 40, 740 70" fill="none" opacity="0.55" />
        </g>

        {[
          { cx: 80, cy: 105 },
          { cx: 180, cy: 65 },
          { cx: 300, cy: 125 },
          { cx: 400, cy: 85 },
          { cx: 520, cy: 55 },
          { cx: 640, cy: 110 },
          { cx: 720, cy: 85 },
        ].map((n, i) => (
          <g key={i}>
            <circle cx={n.cx} cy={n.cy} r="4.5" fill="rgb(99 102 241)" opacity="0.9" />
            <circle cx={n.cx} cy={n.cy} r="10" fill="rgb(34 211 238)" opacity="0.14" />
          </g>
        ))}
      </svg>

      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.12, 0.18, 0.12] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background:
            'radial-gradient(900px 160px at 20% 50%, rgba(59,130,246,0.16), transparent 60%), radial-gradient(700px 140px at 70% 40%, rgba(34,211,238,0.14), transparent 60%), radial-gradient(700px 140px at 90% 70%, rgba(168,85,247,0.12), transparent 60%)',
        }}
      />
    </div>
  );
});

SmartCityNetwork.displayName = 'SmartCityNetwork';
