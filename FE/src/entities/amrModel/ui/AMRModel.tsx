'use client';

import { BaseModel3D } from './BaseModel3D';
import { Model3DProps } from '../model/types';

export const AMRModel = (props: Omit<Model3DProps, 'modelPath'>) => {
  return <BaseModel3D modelPath='/AMR3.glb' {...props} />;
};
