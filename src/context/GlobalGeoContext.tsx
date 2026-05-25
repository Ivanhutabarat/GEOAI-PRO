import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define structures for parsed data from different modules
export interface GeoDataStore {
  gravityData: any[];
  electricalData: any[];
  gprData: any[];
  meteorologyData: any[];
  seismicData: any[];
  geochemData: any[];
  wellLoggingData: any[];
  spatialData: any[];
}

interface GlobalGeoContextType {
  globalData: GeoDataStore;
  updateModuleData: (moduleName: keyof GeoDataStore, rawText: string, parsedJson: any[]) => void;
  rawPayloads: Record<keyof GeoDataStore, string>;
  seismicMode: 'exploration' | 'mitigation';
  setSeismicMode: (mode: 'exploration' | 'mitigation') => void;
}

const defaultState: GeoDataStore = {
  gravityData: [],
  electricalData: [],
  gprData: [],
  meteorologyData: [],
  seismicData: [],
  geochemData: [],
  wellLoggingData: [],
  spatialData: [],
};

const defaultRaw: Record<keyof GeoDataStore, string> = {
  gravityData: "",
  electricalData: "",
  gprData: "",
  meteorologyData: "",
  seismicData: "",
  geochemData: "",
  wellLoggingData: "",
  spatialData: "",
};

const GlobalGeoContext = createContext<GlobalGeoContextType>({
  globalData: defaultState,
  updateModuleData: () => {},
  rawPayloads: defaultRaw,
  seismicMode: 'exploration',
  setSeismicMode: () => {},
});

export const GlobalGeoProvider = ({ children }: { children: ReactNode }) => {
  const [globalData, setGlobalData] = useState<GeoDataStore>(defaultState);
  const [rawPayloads, setRawPayloads] = useState<Record<keyof GeoDataStore, string>>(defaultRaw);
  const [seismicMode, setSeismicMode] = useState<'exploration' | 'mitigation'>('exploration');

  const updateModuleData = (moduleName: keyof GeoDataStore, rawText: string, parsedJson: any[]) => {
    setGlobalData(prev => ({ ...prev, [moduleName]: parsedJson }));
    if (moduleName === 'seismicData') {
      setRawPayloads(prev => ({ ...prev, [moduleName]: `[MODE: ${seismicMode.toUpperCase()}]\n${rawText}` }));
    } else {
      setRawPayloads(prev => ({ ...prev, [moduleName]: rawText }));
    }
  };

  return (
    <GlobalGeoContext.Provider value={{ globalData, updateModuleData, rawPayloads, seismicMode, setSeismicMode }}>
      {children}
    </GlobalGeoContext.Provider>
  );
};

export const useGlobalGeoContext = () => useContext(GlobalGeoContext);
