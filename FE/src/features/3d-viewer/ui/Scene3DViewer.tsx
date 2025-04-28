'use client';

import { Canvas } from '@react-three/fiber';
import { MapControls, Sphere } from '@react-three/drei';
import { Suspense, useRef, useEffect } from 'react';
import { Map3DEnvironment } from '@/entities/map';
import { AMRSimulator } from '@/features/3d-viewer/ui/AMRSimulator';
import { useSelectedAMRStore } from '@/shared/store/selected-amr-store';
import { useModelStore } from '@/shared/model/store';
import { MapControls as MapControlsImpl } from 'three-stdlib';
import gsap from 'gsap';

const Warehouse = () => {
  const controlsRef = useRef<MapControlsImpl>(null);
  const { selectedAmrId, startX, startY, targetX, targetY } = useSelectedAMRStore();
  const { models } = useModelStore();

  useEffect(() => {
    if (selectedAmrId && controlsRef.current) {
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

        // GSAP를 사용하여 부드러운 이동
        gsap.to(currentTarget, {
          x: newTarget.x,
          y: newTarget.y,
          z: newTarget.z,
          duration: 1,
          ease: 'power1.in',
          onUpdate: () => {
            controlsRef.current?.update();
          },
        });
      }
    }
  }, [selectedAmrId, models]);

  return (
    <>
      <Map3DEnvironment />
      {/* 모델 렌더링 */}

      {/* AMR 시뮬레이터 추가 */}
      <AMRSimulator />
      {/* <AMRSimulator /> */}

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
          <Warehouse />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene3DViewer;
