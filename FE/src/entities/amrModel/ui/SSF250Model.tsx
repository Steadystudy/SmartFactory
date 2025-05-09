'use client';

import { BaseModel3D } from './BaseModel3D';
import { Model3DProps } from '../model/types';
import { useGLTF } from '@react-three/drei';

export const SSF250Model = (props: Omit<Model3DProps, 'scene'>) => {
  const { scene } = useGLTF('/AMR-1.glb');

  return <BaseModel3D scene={scene} {...props} />;
};
