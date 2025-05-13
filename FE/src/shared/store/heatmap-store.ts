import { create } from 'zustand';

export interface HeatmapPoint {
  x: number;
  y: number;
  count: number;
}

interface HeatmapStore {
  heatmapData: HeatmapPoint[];
  setHeatmapData: (data: HeatmapPoint[]) => void;
}

export const useHeatmapStore = create<HeatmapStore>((set) => ({
  heatmapData: [],
  setHeatmapData: (data) => set({ heatmapData: data }),
})); 