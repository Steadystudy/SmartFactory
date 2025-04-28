'use client';

import { ModelType } from '@/entities/3d-model';
import { AMRModel, SSF250Model, SSF1200Model } from '@/entities/3d-model';
import { AMR_CURRENT_STATE } from '@/features/visualization';
import { degreeToRadian } from '@/shared/hooks/useMathUtils';
import { useSelectedAMRStore } from '@/shared/store/selected-amr-store';

const ANIMATION_SETTINGS = {
  height: 0,
};

interface Model3DRendererProps {
  amrInfo: AMR_CURRENT_STATE;
  type?: ModelType;
}

export const Model3DRenderer = ({ amrInfo, type = 'amr' }: Model3DRendererProps) => {
  const { setSelectedAmrId } = useSelectedAMRStore();

  // 모델 타입에 따라 적절한 컴포넌트 렌더링
  const renderModel = () => {
    const position: [number, number, number] = [
      amrInfo.locationX,
      ANIMATION_SETTINGS.height,
      amrInfo.locationY,
    ];
    const rotation: [number, number, number] = [0, degreeToRadian(amrInfo.dir), 0];

    switch (type) {
      case 'ssf250':
        return (
          <SSF250Model
            position={position}
            rotation={rotation}
            onClick={() => setSelectedAmrId(amrInfo.amrId)}
          />
        );
      case 'ssf1200':
        return (
          <SSF1200Model
            position={position}
            rotation={rotation}
            onClick={() => setSelectedAmrId(amrInfo.amrId)}
          />
        );
      case 'amr':
      default:
        return (
          <AMRModel
            position={position}
            rotation={rotation}
            onClick={() => setSelectedAmrId(amrInfo.amrId)}
          />
        );
    }
  };

  return renderModel();
};
