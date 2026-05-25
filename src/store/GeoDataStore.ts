import { create } from 'zustand';

export interface GeoDataPoint {
  id: string;
  position: [number, number, number];
  color: string;
  type: string;
}

interface GeoDataState {
  points: GeoDataPoint[];
  setPoints: (points: GeoDataPoint[]) => void;
  addPoint: (point: GeoDataPoint) => void;
  clearPoints: () => void;
}

export const useGeoDataStore = create<GeoDataState>((set) => ({
  points: [
    // Pre-populating with some sample data to ensure it renders something initially
    { id: 'p1', position: [-2, 1, -2], color: '#ff4444', type: 'seismic' },
    { id: 'p2', position: [2, 0.5, 1], color: '#44ff44', type: 'well' },
    { id: 'p3', position: [0, -1, 3], color: '#4444ff', type: 'geochem' },
    { id: 'p4', position: [-3, 2, 4], color: '#ffff44', type: 'gravity' },
    { id: 'p5', position: [4, -2, -3], color: '#ff44ff', type: 'em' },
  ],
  setPoints: (points) => set({ points }),
  addPoint: (point) => set((state) => ({ points: [...state.points, point] })),
  clearPoints: () => set({ points: [] }),
}));
