import { create } from 'zustand';
import { AMR_CURRENT_STATE } from '@/features/visualization/model/types';

interface ModelStore {
  models: AMR_CURRENT_STATE[];
  // 전체 모델 업데이트 함수 추가
  updateModels: (models: AMR_CURRENT_STATE[]) => void;
}

export const useModelStore = create<ModelStore>((set) => ({
  models: [],
  // 전체 모델 업데이트 함수 구현
  updateModels: (models) =>
    set(() => ({
      models,
    })),
}));
