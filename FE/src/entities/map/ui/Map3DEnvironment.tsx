'use client';

import { useGLTF } from '@react-three/drei';
import { Suspense } from 'react';
import { LoadingSpinner } from './MapLoading';

export const Map3DEnvironment = () => {
  const { scene } = useGLTF('/FF.glb');
  // console.log(scene.children[0].children.filter((obj) => obj.name.includes('lane')));

  return (
    <>
      {/* 공장 모델 */}
      <primitive
        object={scene}
        scale={1}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        // onClick={(e) => {
        // console.log(e.eventObject);
        // }}
      />

      <axesHelper args={[100]} />
      <gridHelper args={[100, 100]} />

      {/* 조명 설정 */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
    </>
  );
};

export const Map3D = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Map3DEnvironment />
    </Suspense>
  );
};

useGLTF.preload('/Factory.glb');
useGLTF.preload('/Line.glb');
