import { useRef, useEffect } from 'react';
import { MapControls as MapControlsImpl } from 'three-stdlib';
import { useModelStore } from '@/shared/model/store';
import { useSelectedAMRStore } from '@/shared/store/selected-amr-store';
import gsap from 'gsap';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export const useCameraFollow = () => {
  const { getSelectedModel } = useModelStore();
  const { selectedAmrId } = useSelectedAMRStore();
  const controlsRef = useRef<MapControlsImpl>(null);
  const initialRotationRef = useRef<THREE.Euler | null>(null);

  // 초기 카메라 설정 저장
  useEffect(() => {
    if (!controlsRef.current) return;

    const controls = controlsRef.current;
    const camera = controls.object;

    // 초기 rotation 저장
    initialRotationRef.current = camera.rotation.clone();

    return () => {
      controls.dispose();
    };
  }, []);

  useFrame(() => {
    if (!controlsRef.current || !initialRotationRef.current) return;

    const selectedAMR = getSelectedModel(selectedAmrId);

    if (selectedAMR) {
      const controls = controlsRef.current;
      const camera = controls.object;
      const currentTarget = controls.target;

      // 현재 카메라의 상대적 위치 계산
      const offsetX = camera.position.x - currentTarget.x;
      const offsetY = camera.position.y - currentTarget.y;
      const offsetZ = camera.position.z - currentTarget.z;

      const newTarget = {
        x: selectedAMR.locationX,
        y: 0,
        z: selectedAMR.locationY,
      };

      // 새로운 카메라 위치 계산 (상대적 거리 유지)
      const newCameraPosition = {
        x: newTarget.x + offsetX,
        y: newTarget.y + offsetY,
        z: newTarget.z + offsetZ,
      };

      // 타겟 위치로 부드럽게 이동
      gsap.to(currentTarget, {
        x: newTarget.x,
        y: newTarget.y,
        z: newTarget.z,
        duration: 1,
      });

      // 카메라 위치도 함께 이동
      gsap.to(camera.position, {
        x: newCameraPosition.x,
        y: newCameraPosition.y,
        z: newCameraPosition.z,
        duration: 1,
        onUpdate: () => {
          if (controls && controls instanceof MapControlsImpl) {
            // 초기 rotation 유지
            camera.rotation.copy(initialRotationRef.current!);
            controls.update();
          }
        },
      });
    }
  });

  return { controlsRef };
};
