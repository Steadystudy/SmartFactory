'use client';

import { Canvas } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import { Suspense } from 'react';
import { Map3D, MapLoading } from '@/entities/map';
import { useSelectedAMRStore } from '@/shared/store/selected-amr-store';
import { Model3DRenderer } from '@/entities/amrModel';
import { useCameraFollow } from '../lib';
import { MapPointer } from '@/entities/3dPointer';
import { RoutePath } from './RoutePath';

const Warehouse = () => {
  const { selectedAmrId, startX, startY, targetX, targetY } = useSelectedAMRStore();
  const { controlsRef } = useCameraFollow();

  return (
    <>
      {/* 모델 렌더링 */}
      <Model3DRenderer />

      {/* 출발지 표시 (파란색 구체) */}
      {selectedAmrId && <MapPointer position={[startX!, 3, startY!]} color='Blue' />}

      {/* 도착지 표시 (빨간색 구체) */}
      {selectedAmrId && <MapPointer position={[targetX!, 3, targetY!]} color='Red' />}

      {/* Route 경로 시각화 */}
      <RoutePath />

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
