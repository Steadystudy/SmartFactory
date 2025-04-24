'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import { Map3DEnvironment } from '@/entities/map';
import { AMRSimulator } from '@/features/3d-viewer/ui/AMRSimulator';

const Warehouse = () => {
  return (
    <>
      <Map3DEnvironment />
      {/* 모델 렌더링 */}

      {/* AMR 시뮬레이터 추가 */}
      <AMRSimulator />
      {/* <AMRSimulator /> */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
      />
    </>
  );
};

const Scene3DViewer = () => {
  return (
    <div className='w-full h-full'>
      <Canvas camera={{ position: [20, 20, 20], fov: 60 }}>
        <Suspense fallback={null}>
          <Warehouse />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene3DViewer;
