import { memo, useMemo } from 'react';
import Plot from 'react-plotly.js';

type SurfacePlot3DProps = {
  className?: string;
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * True 3D surface: Density (%) × Waiting (s) → Green time (s)
 * Uses the same target-creation formula shape as Phase 6 training.
 */
export const SurfacePlot3D = memo(({ className }: SurfacePlot3DProps) => {
  const { x, y, z } = useMemo(() => {
    const densityAxis = Array.from({ length: 21 }, (_, i) => i * 5); // 0..100 step 5
    const waitingAxis = Array.from({ length: 25 }, (_, i) => i * 5); // 0..120 step 5 (0..120 inclusive via 24*5=120)

    const surface: number[][] = waitingAxis.map((wt) =>
      densityAxis.map((d) => {
        const green = 20 + d * 0.5 + wt * 0.2;
        return Number(clamp(green, 10, 90).toFixed(2));
      })
    );

    return { x: densityAxis, y: waitingAxis, z: surface };
  }, []);

  return (
    <div className={className}>
      <Plot
        data={[
          {
            type: 'surface',
            x,
            y,
            z,
            colorscale: 'Viridis',
            showscale: true,
            contours: {
              z: {
                show: true,
                usecolormap: true,
                highlightcolor: '#ffffff',
                project: { z: true },
              },
            },
          } as any,
        ]}
        layout={{
          autosize: true,
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          margin: { l: 0, r: 0, b: 0, t: 0 },
          scene: {
            xaxis: { title: { text: 'Density (%)' }, gridcolor: 'rgba(148,163,184,0.18)', zerolinecolor: 'rgba(148,163,184,0.18)' },
            yaxis: { title: { text: 'Waiting (s)' }, gridcolor: 'rgba(148,163,184,0.18)', zerolinecolor: 'rgba(148,163,184,0.18)' },
            zaxis: { title: { text: 'Green time (s)' }, gridcolor: 'rgba(148,163,184,0.18)', zerolinecolor: 'rgba(148,163,184,0.18)' },
            camera: { eye: { x: 1.7, y: 1.35, z: 0.9 } },
          },
        }}
        config={{
          displaylogo: false,
          responsive: true,
          modeBarButtonsToRemove: ['toImage'],
        }}
        style={{ width: '100%', height: 420 }}
      />
    </div>
  );
});

SurfacePlot3D.displayName = 'SurfacePlot3D';

