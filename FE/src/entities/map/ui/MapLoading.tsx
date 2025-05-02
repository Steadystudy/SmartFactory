'use client';

import { Html, useProgress } from '@react-three/drei';

export const LoadingSpinner = () => {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className='flex flex-col items-center justify-center text-white'>
        <div className='w-10 h-10 border-4 rounded-full border-t-blue-500 animate-spin' />
        <p className='mt-4'>{progress.toFixed(0)}% 로딩중</p>
      </div>
    </Html>
  );
};
