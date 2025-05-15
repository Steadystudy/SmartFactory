'use client';

import { BaseModel3D } from './BaseModel3D';
import { Model3DProps } from '../model/types';
import { useAnimations, useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

export const AMRModel = (props: Omit<Model3DProps, 'scene'>) => {
  const { scene, animations } = useGLTF('/SSF-150.glb');
  const {
    amrState: { loading, amrId },
  } = props;
  // 각 인스턴스마다 새로운 scene 클론 생성
  const instance = useMemo(() => {
    const clonedScene = scene.clone();
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = child.material.clone();
      }
    });
    return clonedScene;
  }, [scene]);
  const { actions } = useAnimations(animations, instance);

  useEffect(() => {
    // 이전 애니메이션 중지
    Object.values(actions).forEach((action) => {
      action?.stop();
    });

    if (loading) {
      console.log(amrId, 'SSF-150 Load 애니메이션 실행');
      actions['SSF-150 Load']?.reset().play();
    } else {
      console.log(amrId, 'SSF-150 Unload 애니메이션 실행');
      actions['SSF-150 Unload']?.reset().play();
    }
  }, [loading, actions]);

  return (
    <>
      <BaseModel3D scene={instance} {...props} />
    </>
  );
};
