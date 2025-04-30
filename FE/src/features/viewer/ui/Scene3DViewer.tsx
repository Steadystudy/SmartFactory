'use client';

import { Canvas } from '@react-three/fiber';
import { MapControls, Sphere } from '@react-three/drei';
import { Suspense } from 'react';
import { Map3DEnvironment } from '@/entities/map';
import { useSelectedAMRStore } from '@/shared/store/selected-amr-store';
import { useModelStore } from '@/shared/model/store';
import { Model3DRenderer, ModelType } from '@/entities/amrModel';
import { useCameraFollow } from '../lib';

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

const Warehouse = () => {
  const { models } = useModelStore();
  const { selectedAmrId, startX, startY, targetX, targetY } = useSelectedAMRStore();
  const { controlsRef } = useCameraFollow({ is2D: false });

  return (
    <>
      {/* 모델 렌더링 */}
      {models?.map((amrInfo, index) => (
        <Model3DRenderer type={getModelTypeByIndex(index)} key={amrInfo.amrId} amrInfo={amrInfo} />
      ))}

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
        minDistance={5}
        maxDistance={50}
        maxPolarAngle={Math.PI / 4}
        minPolarAngle={Math.PI / 4}
      />
    </>
  );
};

const Scene3DViewer = () => {
  const { reset } = useSelectedAMRStore();

  const handleCanvasClick = (event: React.MouseEvent) => {
    // event.defaultPrevented가 true이면 하위 컴포넌트에서 이벤트를 처리한 것
    if (!event.defaultPrevented) {
      reset();
    }
  };

  return (
    <div className='w-full h-full cursor-grab active:cursor-grabbing' onClick={handleCanvasClick}>
      <Canvas camera={{ position: [40, 40, 40], fov: 40 }}>
        <Suspense fallback={null}>
          <Map3DEnvironment />
          <Warehouse />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene3DViewer;
