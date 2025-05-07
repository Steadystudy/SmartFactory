'use client';

import { useProgress } from '@react-three/drei';

export const MapLoading = () => {
  const { progress } = useProgress();

  return (
    <>
      {progress < 100 ? (
        <div className='flex items-center justify-center w-full h-full'>
          <div className='flex flex-col items-center justify-center text-white'>
            <div className='w-10 h-10 border-4 rounded-full border-t-blue-500 animate-spin' />
            <p className='mt-4'>{progress.toFixed(0)}% 로딩중</p>
          </div>
        </div>
      ) : null}
    </>
  );
};
