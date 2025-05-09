'use client';

import { BaseModel3D } from './BaseModel3D';
import { Model3DProps } from '../model/types';
import { useGLTF } from '@react-three/drei';

export const SSF1200Model = (props: Omit<Model3DProps, 'scene'>) => {
  const { scene } = useGLTF('/SSF-1200.glb');

  return <BaseModel3D scene={scene} {...props} />;
};
