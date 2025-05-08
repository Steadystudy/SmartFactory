'use client';

import { Canvas } from '@react-three/fiber';
import { MapControls, Sphere } from '@react-three/drei';
import { Suspense } from 'react';
import { Map3D, MapLoading } from '@/entities/map';
import { useSelectedAMRStore } from '@/shared/store/selected-amr-store';
import { Model3DRenderer } from '@/entities/amrModel';
import { useCameraFollow } from '../lib';

const Warehouse = () => {
  const { selectedAmrId, startX, startY, targetX, targetY } = useSelectedAMRStore();
  const { controlsRef } = useCameraFollow({ is2D: false });

  return (
    <>
      {/* 모델 렌더링 */}
      <Model3DRenderer />

      {/* 출발지 표시 (파란색 구체) */}
      {selectedAmrId && (
        <Sphere args={[0.5, 32, 32]} position={[startX!, 0.5, startY!]}>
          <meshStandardMaterial color='#3b82f6' transparent opacity={0.8} />
        </Sphere>
      )}

      {/* 도착지 표시 (빨간색 구체) */}
      {selectedAmrId && (
        <Sphere args={[0.5, 32, 32]} position={[targetX!, 0.5, targetY!]}>
          <meshStandardMaterial color='#ef4444' transparent opacity={0.8} />
        </Sphere>
      )}

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
        <Canvas camera={{ position: [40, 40, 40], fov: 60 }}>
          <Map3D />
          <Warehouse />
        </Canvas>
      </Suspense>
    </>
  );
};

export default Scene3DViewer;
