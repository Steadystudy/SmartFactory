import { useRef, useEffect } from 'react';
import { MapControls as MapControlsImpl } from 'three-stdlib';
import { useModelStore } from '@/shared/model/store';
import { useSelectedAMRStore } from '@/shared/store/selected-amr-store';
import gsap from 'gsap';

// 뷰어 타입에 따른 카메라 이동 설정
interface CameraFollowOptions {
  is2D?: boolean;
}

export const useCameraFollow = ({ is2D = false }: CameraFollowOptions = {}) => {
  const { models } = useModelStore();
  const { selectedAmrId } = useSelectedAMRStore();
  const controlsRef = useRef<MapControlsImpl>(null);

  // 선택된 AMR이 변경되면 해당 위치로 카메라 이동
  useEffect(() => {
    // 선택된 AMR이 없거나 controlsRef가 없으면 실행하지 않음
    if (!selectedAmrId || !controlsRef.current) return;

    const selectedAMR = models.find((model) => model.amrId === selectedAmrId);
    if (selectedAMR) {
      // 현재 타겟 위치
      const currentTarget = controlsRef.current.target;

      // 새로운 타겟 위치
      const newTarget = {
        x: selectedAMR.locationX,
        y: 0,
        z: selectedAMR.locationY,
      };
      console.log(currentTarget, 'to:', newTarget);

      // 2D 뷰어에서는 회전 없이 이동만 수행
      if (is2D) {
        //FIXME: 2D 뷰어에서는 카메라의 회전을 고정
        controlsRef.current?.target.set(newTarget.x, newTarget.y, newTarget.z);
        controlsRef.current?.update();
      } else {
        // GSAP를 사용하여 부드러운 이동
        gsap.to(currentTarget, {
          x: newTarget.x,
          y: newTarget.y,
          z: newTarget.z,
          duration: 1,
          onUpdate: () => {
            controlsRef.current?.update();
          },
        });
      }
    }
  }, [selectedAmrId, models, is2D]);

  return { controlsRef };
};
