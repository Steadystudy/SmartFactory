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
      {models?.map((amrInfo) => {
        const position: [number, number, number] = [
          amrInfo.locationX,
          ANIMATION_SETTINGS.height,
          amrInfo.locationY,
        ];
        const rotation: [number, number, number] = [0, amrInfo.dir, 0];
        switch (amrInfo.type) {
          case 'Type-A':
            return (
              <AMRModel
                key={amrInfo.amrId}
                position={position}
                rotation={rotation}
                amrState={amrInfo}
              />
            );
          case 'Type-B':
            return (
              <SSF250Model
                key={amrInfo.amrId}
                position={position}
                rotation={rotation}
                amrState={amrInfo}
              />
            );
          case 'Type-C':
          default:
            return (
              <SSF1200Model
                key={amrInfo.amrId}
                position={position}
                rotation={rotation}
                amrState={amrInfo}
              />
            );
        }
      })}
    </>
  );
};
