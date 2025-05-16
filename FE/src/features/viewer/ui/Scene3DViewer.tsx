'use client';

import { Canvas } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import { Suspense, useEffect, useRef } from 'react';
import { Map3D, MapLoading } from '@/entities/map';
import { useSelectedAMRStore } from '@/shared/store/selected-amr-store';
import { Model3DRenderer } from '@/entities/amrModel';
import { useCameraFollow } from '../lib';
import { MapPointer } from '@/entities/3dPointer';
import { RoutePath } from './RoutePath';
import * as THREE from 'three';

const Warehouse = () => {
  const { selectedAmrId, startX, startY, targetX, targetY } = useSelectedAMRStore();
  const { controlsRef } = useCameraFollow();
  const lastValidTarget = useRef<THREE.Vector3>(new THREE.Vector3(40, 0, 40));
  const isUpdating = useRef(false);

  useEffect(() => {
    if (!controlsRef.current) return;

    const controls = controlsRef.current;

    lastValidTarget.current.copy(controls.target);

    const handleControlChange = () => {
      if (isUpdating.current) return;

      const camera = controls.object;
      const currentTarget = controls.target;

      if (
        currentTarget.x < 5 ||
        currentTarget.x > 75 ||
        currentTarget.z < 5 ||
        currentTarget.z > 75
      ) {
        isUpdating.current = true;

        const cameraOffset = new THREE.Vector3().subVectors(camera.position, currentTarget);

        const newTargetX = Math.max(0, Math.min(80, currentTarget.x));
        const newTargetZ = Math.max(0, Math.min(80, currentTarget.z));
        const newTarget = new THREE.Vector3(newTargetX, currentTarget.y, newTargetZ);

        const newCameraPosition = new THREE.Vector3().addVectors(newTarget, cameraOffset);

        controls.target.copy(newTarget);
        camera.position.copy(newCameraPosition);

        camera.updateProjectionMatrix();
        controls.update();

        lastValidTarget.current.copy(newTarget);

        setTimeout(() => {
          isUpdating.current = false;
        }, 0);
      } else {
        lastValidTarget.current.copy(currentTarget);
      }
    };

    controls.addEventListener('change', handleControlChange);

    return () => {
      controls.removeEventListener('change', handleControlChange);
    };
  }, [controlsRef]);

  return (
    <>
      {/* 모델 렌더링 */}
      <Model3DRenderer />

      {/* 출발지 표시 (파란색 구체) */}
      {selectedAmrId && startX && startY && (
        <MapPointer position={[startX, 3, startY]} color='Blue' />
      )}

      {/* 도착지 표시 (빨간색 구체) */}
      {selectedAmrId && targetX && targetY && (
        <MapPointer position={[targetX, 3, targetY]} color='Red' />
      )}

      {/* Route 경로 시각화 */}
      {selectedAmrId && <RoutePath />}

      <MapControls
        ref={controlsRef}
        enableZoom={true}
        minDistance={20}
        maxDistance={80}
        autoRotate={false}
        maxPolarAngle={Math.PI / 4}
        minPolarAngle={Math.PI / 4}
        target={[40, 0, 40]}
      />
    </>
  );
};

const Scene3DViewer = () => {
  return (
    <>
      <MapLoading />
      <Suspense fallback={null}>
        <Canvas camera={{ position: [60, 50, 60], fov: 60 }}>
          <Map3D />
          <Warehouse />
        </Canvas>
      </Suspense>
    </>
  );
};

export default Scene3DViewer;
