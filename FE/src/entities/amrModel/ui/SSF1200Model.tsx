'use client';

import { BaseModel3D } from './BaseModel3D';
import { Model3DProps } from '../model/types';
import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

export const SSF1200Model = (props: Omit<Model3DProps, 'scene'>) => {
  const { scene } = useGLTF('/SSF-650.glb');
  const instance = useMemo(() => {
    const clonedScene = scene.clone();
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = child.material.clone();
      }
    });
    return clonedScene;
  }, [scene]);

  return <BaseModel3D scene={instance} {...props} />;
};
useGLTF.preload('/SSF-650.glb');
