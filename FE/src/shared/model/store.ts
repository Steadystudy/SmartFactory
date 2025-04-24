import { create } from 'zustand';
import { AMRInfo } from '@/entities/3d-model/model/types';

interface ModelStore {
  models: AMRInfo[];
  // 전체 모델 업데이트 함수 추가
  updateModels: (models: AMRInfo[]) => void;
}

export const useModelStore = create<ModelStore>((set) => ({
  models: [],
  // 전체 모델 업데이트 함수 구현
  updateModels: (models) =>
    set(() => ({
      models,
    })),
}));
