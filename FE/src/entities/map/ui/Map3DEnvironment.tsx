'use client';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useEffect, useRef } from 'react';

export const Map3D = () => {
  const group = useRef(null);
  const { scene, animations } = useGLTF('/Factory.glb');
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    Object.values(actions).forEach((action) => {
      action?.play();
    });
  }, [actions]);

  return (
    <>
      {/* 공장 모델 */}
      <primitive
        ref={group}
        object={scene}
        scale={1}
        position={[65.5, 8, 9]}
        rotation={[0, 0, 0]}
        // onClick={(e) => {
        //   console.log(e.eventObject);
        // }}
      />

      <axesHelper args={[100]} />
      {/* <gridHelper args={[100, 100]} /> */}

      {/* 조명 설정 */}
      <ambientLight intensity={1.5} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
    </>
  );
};

useGLTF.preload('/Factory.glb');
