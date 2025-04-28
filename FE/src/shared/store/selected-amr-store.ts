import { create } from 'zustand';

interface SelectedAMRState {
  selectedAmrId: string | null;
  targetX: number | null;
  targetY: number | null;
  startX: number | null;
  startY: number | null;
  setSelectedAmrId: (id: string | null) => void;
  setTargetPosition: (x: number, y: number) => void;
  setStartPosition: (x: number, y: number) => void;
  reset: () => void;
}

export const useSelectedAMRStore = create<SelectedAMRState>((set) => ({
  selectedAmrId: null,
  targetX: 0,
  targetY: 0,
  startX: 0,
  startY: 0,
  setSelectedAmrId: (id) => set({ selectedAmrId: id }),
  setTargetPosition: (x, y) => set({ targetX: x, targetY: y }),
  setStartPosition: (x, y) => set({ startX: x, startY: y }),
  reset: () =>
    set({ selectedAmrId: null, targetX: null, targetY: null, startX: null, startY: null }),
}));
