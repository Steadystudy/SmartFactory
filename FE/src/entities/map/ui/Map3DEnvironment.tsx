'use client';

import { useGLTF } from '@react-three/drei';

export const Map3DEnvironment = () => {
  const { scene } = useGLTF('/Factory.glb');
  const { scene: line } = useGLTF('/Line.glb');

  return (
    <>
      {/* 공장 모델 */}
      <primitive
        object={scene}
        scale={1} // 필요에 따라 스케일 조정
        position={[0, 39.5, 0]} // 필요에 따라 위치 조정
      />

      {/* 라인 모델 */}
      <primitive object={line} scale={1} position={[0, 1, 0]} />

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

useGLTF.preload('/Factory.glb');
