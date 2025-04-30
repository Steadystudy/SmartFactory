'use client';

import { BaseModel3D } from './BaseModel3D';
import { Model3DProps } from '../model/types';

export const SSF1200Model = (props: Omit<Model3DProps, 'modelPath'>) => {
  return <BaseModel3D modelPath='/SSF-1200.glb' {...props} />;
};
