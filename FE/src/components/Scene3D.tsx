'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense } from 'react';

function AMRModel() {
  const { scene } = useGLTF('/AMR3.glb');
  return <primitive object={scene} scale={1} position={[0, 0, 0]} />;
}

const Warehouse = () => {
  return (
    <>
      {/* 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color='#f0f0f0' />
      </mesh>

      {/* 선반 */}
      {[...Array(3)].map((_, i) => (
        <mesh key={i} position={[-5 + i * 5, 0, -5]} castShadow receiveShadow>
          <boxGeometry args={[2, 2, 1]} />
          <meshStandardMaterial color='#8b4513' />
        </mesh>
      ))}

      {/* AMR */}
      <AMRModel />

      {/* 조명 설정 */}
      {/* 메인 천장 조명 */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
    </>
  );
};

const Scene3D = () => {
  return (
    <div className='w-full h-full'>
      <Canvas shadows camera={{ position: [-1, 2, 2] }}>
        <Suspense fallback={null}>
          <Warehouse />
          <OrbitControls />
          <gridHelper args={[20, 20]} />
        </Suspense>
      </Canvas>
    </div>
  );
};

// GLB 모델 미리 로드
useGLTF.preload('/AMR3.glb');

export default Scene3D;
