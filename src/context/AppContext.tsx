import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { dummyEngine } from '../cores/live/utils/dummyEngine';
import { liveEngine } from '../cores/live/utils/liveEngine';
import { SimulationRow } from '../cores/live/utils/dummyEngine';

export type ApiMode = 'LIVE' | 'DUMMY';
export type DimensionMode = '1D' | '2D' | '3D';

interface EngineType {
  generateSeismicData: (frequency?: number, damp?: number) => SimulationRow[];
  generateWellLoggingData: (shaleCutoff?: number, resThreshold?: number) => SimulationRow[];
  generateGeotechData: (anchorOffset?: number, slopeAngle?: number) => SimulationRow[];
  generateTiltExtensoTrack: (baseDx: number, baseDy: number) => SimulationRow[];
  generateResistivityTrack: (distance: number, resistance: number) => SimulationRow[];
  generateResistivityMatrix: () => number[][];
  generateGprTrack: (depth: number, velocity: number) => SimulationRow[];
  generateGravityTrack: (elevation: number, lat: number) => SimulationRow[];
  generateGeochemTrack: (concentrate: number) => SimulationRow[];
  generateMeteorologyTrack: (temp: number, pressure: number) => SimulationRow[];
  generateGroundwaterTrack: (rate: number, trans: number) => SimulationRow[];
  generateSoilPlumeDiffusion: (conc: number) => SimulationRow[];
  generateSoilPhTrack: (ph: number, sulfur: number) => SimulationRow[];
  generateRadiometricTrack: (u: number, th: number) => SimulationRow[];
  generateGasTrack: (h2s: number, ch4: number) => SimulationRow[];
  generateSpatialTrack: (eastOffset: number, northOffset: number) => SimulationRow[];
  generateElectricalData: (spacing?: number, current?: number) => SimulationRow[];
  generateGPRData: (frequency?: number, dielectricConstant?: number) => SimulationRow[];
  generateGravityData: (latitude?: number, density?: number) => SimulationRow[];
}

interface AppContextType {
  apiMode: ApiMode;
  setApiMode: React.Dispatch<React.SetStateAction<ApiMode>>;
  toggleApiMode: () => void;
  dimensionMode: DimensionMode;
  setDimensionMode: React.Dispatch<React.SetStateAction<DimensionMode>>;
  toggleDimensionMode: () => void;
  engine: EngineType;
  engineKey: number;
}

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiMode, setApiMode] = useState<ApiMode>('DUMMY');
  const [dimensionMode, setDimensionMode] = useState<DimensionMode>('2D');
  const [engineKey, setEngineKey] = useState<number>(0);

  const toggleApiMode = () => {
    setApiMode(prev => {
      const nextMode = prev === 'LIVE' ? 'DUMMY' : 'LIVE';
      try {
        localStorage.removeItem('geoai_cached_debate');
        localStorage.removeItem('geoai_last_payload_hash');
      } catch (e) {
        console.warn("Storage wipe failed.");
      }
      setEngineKey(k => k + 1); // hard remount signal
      return nextMode;
    });
  };

  const toggleDimensionMode = () => {
    setDimensionMode(prev => prev === '3D' ? '2D' : '3D');
  };

  const engine = useMemo(() => {
    return apiMode === 'LIVE' ? liveEngine : dummyEngine;
  }, [apiMode]);

  return (
    <AppContext.Provider value={{ apiMode, setApiMode, toggleApiMode, dimensionMode, setDimensionMode, toggleDimensionMode, engine, engineKey }}>
      <div key={engineKey} style={{ width: '100%', height: '100%', display: 'flex', flex: 1 }}>
        {children}
      </div>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
