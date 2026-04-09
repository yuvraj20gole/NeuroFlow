import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type TrafficDensities = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type EmergencyState = {
  active: boolean;
  lane: 'North' | 'South' | 'East' | 'West' | null;
  vehicleType: 'ambulance' | 'fire' | 'police' | 'vip' | null;
};

type TrafficContextValue = {
  densities: TrafficDensities;
  setDensities: (next: TrafficDensities) => void;
  setLaneDensity: (lane: keyof TrafficDensities, value: number) => void;
  emergency: EmergencyState;
  setEmergency: (next: EmergencyState) => void;
  clearEmergency: () => void;
};

const TrafficContext = createContext<TrafficContextValue | null>(null);

const clamp = (v: number) => Math.max(0, Math.min(100, v));

export function TrafficProvider({ children }: { children: React.ReactNode }) {
  const [densities, setDensitiesState] = useState<TrafficDensities>({
    north: 50,
    south: 40,
    east: 60,
    west: 35,
  });
  const [emergency, setEmergencyState] = useState<EmergencyState>({
    active: false,
    lane: null,
    vehicleType: null,
  });

  const setDensities = useCallback((next: TrafficDensities) => {
    const n = {
      north: clamp(next.north),
      south: clamp(next.south),
      east: clamp(next.east),
      west: clamp(next.west),
    };
    setDensitiesState((prev) => {
      if (
        prev.north === n.north &&
        prev.south === n.south &&
        prev.east === n.east &&
        prev.west === n.west
      ) {
        return prev;
      }
      return n;
    });
  }, []);

  const setLaneDensity = useCallback((lane: keyof TrafficDensities, value: number) => {
    const v = clamp(value);
    setDensitiesState((prev) => {
      if (prev[lane] === v) return prev;
      return { ...prev, [lane]: v };
    });
  }, []);

  const setEmergency = useCallback((next: EmergencyState) => {
    setEmergencyState((prev) => {
      if (
        prev.active === next.active &&
        prev.lane === next.lane &&
        prev.vehicleType === next.vehicleType
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const clearEmergency = useCallback(() => {
    setEmergencyState((prev) => {
      if (!prev.active && prev.lane == null && prev.vehicleType == null) return prev;
      return { active: false, lane: null, vehicleType: null };
    });
  }, []);

  const value = useMemo<TrafficContextValue>(() => {
    return {
      densities,
      setDensities,
      setLaneDensity,
      emergency,
      setEmergency,
      clearEmergency,
    };
  }, [densities, emergency, setDensities, setLaneDensity, setEmergency, clearEmergency]);

  return <TrafficContext.Provider value={value}>{children}</TrafficContext.Provider>;
}

export function useTraffic() {
  const ctx = useContext(TrafficContext);
  if (!ctx) {
    throw new Error('useTraffic must be used within TrafficProvider');
  }
  return ctx;
}

