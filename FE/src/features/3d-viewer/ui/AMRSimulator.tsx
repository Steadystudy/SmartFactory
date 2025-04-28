'use client';

import { useEffect } from 'react';
import { ModelType } from '@/entities/3d-model';
import { useModelStore } from '@/shared/model/store';
import { Model3DRenderer } from '@/entities/map';
import { AMR_CURRENT_STATE } from '@/features/visualization/model/types';
import { radianToDegree } from '@/shared/hooks/useMathUtils';

// 가상 AMR 데이터 생성 함수
const generateVirtualAMRData = (amr: AMR_CURRENT_STATE): AMR_CURRENT_STATE => {
  // 현재 시간을 기반으로 위치 계산
  const currentTime = Date.now() / 1000;

  // 두 번째 AMR: 원형 패턴
  const radius = 3;
  const angle = (currentTime * 0.5) % radianToDegree(Math.PI * 2);

  const locationX = amr.locationX + radius * Math.cos(angle);
  const locationY = amr.locationY + radius * Math.sin(angle);

  // 랜덤 상태 생성
  const states = [0, 1, 2, 3]; // ERROR, IDLE, PROCESSING, CHARGING
  const state = states[Math.floor(Math.random() * states.length)];

  // 속도는 일정하게 유지

  return {
    ...amr,
    locationX,
    locationY,
    state,
  };
};

// index에 따라 ModelType 반환하는 함수
const getModelTypeByIndex = (index: number): ModelType => {
  switch (index % 3) {
    case 0:
      return 'amr';
    case 1:
      return 'ssf250';
    case 2:
      return 'ssf1200';
    default:
      return 'amr';
  }
};

export const AMRSimulator = () => {
  const { models, updateModels } = useModelStore();

  // 1초마다 모든 AMR 위치 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedModels = models.map((model) => {
        return generateVirtualAMRData(model);
      });
      updateModels(updatedModels);
    }, 1000);

    return () => clearInterval(interval);
  }, [models, updateModels]);

  return (
    <>
      {models.map((amrInfo, index) => (
        <Model3DRenderer type={getModelTypeByIndex(index)} key={amrInfo.amrId} amrInfo={amrInfo} />
      ))}
    </>
  );
};
