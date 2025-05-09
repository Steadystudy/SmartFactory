'use client';

import { BaseModel3D } from './BaseModel3D';
import { Model3DProps } from '../model/types';
import { useGLTF } from '@react-three/drei';
import { useEffect } from 'react';

export const AMRModel = (props: Omit<Model3DProps, 'scene'>) => {
  const { scene } = useGLTF('/AMR.glb');
  const { loading } = props;

  useEffect(() => {}, [scene, loading]);

  return (
    <>
      <BaseModel3D scene={scene} {...props} />
    </>
  );
};
