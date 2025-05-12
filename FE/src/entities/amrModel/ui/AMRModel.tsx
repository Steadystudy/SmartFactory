'use client';

import { BaseModel3D } from './BaseModel3D';
import { Model3DProps } from '../model/types';
import { useAnimations, useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const animationNames = {
  Material_load: 'Material_load',
  Material_Unload: 'Material_Unload',
  Box_load: 'Box_load',
  Box_Unload: 'Box_Unload',
};

export const AMRModel = (props: Omit<Model3DProps, 'scene'>) => {
  const { scene, animations } = useGLTF('/SSF-150.glb');
  const { actions } = useAnimations(animations, scene);
  const { loading } = props;
  // 각 인스턴스마다 새로운 scene 클론 생성
  const instance = useMemo(() => {
    const clonedScene = scene.clone();
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = child.material.clone();
      }
    });
    return clonedScene;
  }, [scene, loading]);

  useEffect(() => {
    // 이전 애니메이션 중지
    Object.values(actions).forEach((action) => {
      action?.stop();
    });

    if (loading) {
      console.log('Box_load 애니메이션 실행');
      actions[animationNames.Box_load]?.reset().play();
    } else {
      console.log('Box_Unload 애니메이션 실행');
      actions[animationNames.Box_Unload]?.reset().play();
    }
  }, [loading, actions]);

  return (
    <>
      <BaseModel3D scene={instance} {...props} />
    </>
  );
};

useGLTF.preload('/SSF-150.glb');
