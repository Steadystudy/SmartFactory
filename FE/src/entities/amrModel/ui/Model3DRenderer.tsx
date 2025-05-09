'use client';

import { AMRModel, SSF250Model, SSF1200Model } from '@/entities/amrModel';
import { useModelStore } from '@/shared/model/store';

const ANIMATION_SETTINGS = {
  height: 0,
};

export const Model3DRenderer = () => {
  const { models } = useModelStore();

  return (
    <>
      {models?.map((amrInfo, index) => {
        const position: [number, number, number] = [
          amrInfo.locationX + 0.35,
          ANIMATION_SETTINGS.height,
          amrInfo.locationY - 0.6,
        ];
        const rotation: [number, number, number] = [0, amrInfo.dir, 0];
        switch (amrInfo.type) {
          case 'Type-A':
            return (
              <SSF250Model
                key={amrInfo.amrId}
                position={position}
                rotation={rotation}
                modelId={amrInfo.amrId}
              />
            );
          case 'Type-B':
            return (
              <SSF1200Model
                key={amrInfo.amrId}
                position={position}
                rotation={rotation}
                modelId={amrInfo.amrId}
              />
            );
          case 'Type-C':
          default:
            return (
              <AMRModel
                key={amrInfo.amrId}
                position={position}
                rotation={rotation}
                loading={index % 2 === 0 ? true : false}
                modelId={amrInfo.amrId}
              />
            );
        }
      })}
    </>
  );
};
