'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loading } from '@/components/ui/loading';
import dynamic from 'next/dynamic';
import { Suspense, useEffect } from 'react';
import { useModelStore } from '@/shared/model/store';
import Scene3DViewer from '@/features/3d-viewer';
import Scene2DViewer from '@/features/2d-viewer';
import { AMR_CURRENT_STATE } from '../model/types';
import { AMRState } from '@/entities/3d-model';

const Heatmap = dynamic(() => import('@/components/Heatmap'), {
  ssr: false,
  loading: () => <Loading />,
});

// 가상의 AMR 데이터 생성 함수
const generateVirtualAMRData = (): AMR_CURRENT_STATE[] => {
  // 각 AMR 타입별로 2개씩 생성
  const amrData: AMR_CURRENT_STATE[] = [
    // AMR 1
    {
      amrId: 'AMR001',
      state: AMRState.PROCESSING,
      locationX: 10,
      locationY: 10,
      dir: 45,
      currentNode: 1,
      loading: false,
      linearVelocity: 0.5,
      errorCode: '',
    },
    // AMR 2
    {
      amrId: 'AMR002',
      state: AMRState.CHARGING,
      locationX: -8,
      locationY: -5,
      dir: 210,
      currentNode: 2,
      loading: true,
      linearVelocity: 1.2,
      errorCode: '',
    },
    // AMR 3
    {
      amrId: 'AMR003',
      state: AMRState.ERROR,
      locationX: 5,
      locationY: -12,
      dir: 60,
      currentNode: 3,
      loading: false,
      linearVelocity: 0,
      errorCode: 'ERROR01',
    },
    // AMR 4
    {
      amrId: 'AMR004',
      state: AMRState.CHARGING,
      locationX: -12,
      locationY: 8,
      dir: 225,
      currentNode: 4,
      loading: false,
      linearVelocity: 0.3,
      errorCode: '',
    },
    // AMR 5
    {
      amrId: 'AMR005',
      state: AMRState.PROCESSING,
      locationX: 0,
      locationY: -10,
      dir: 96,
      currentNode: 5,
      loading: true,
      linearVelocity: 0.8,
      errorCode: '',
    },
    // AMR 6
    {
      amrId: 'AMR006',
      state: AMRState.IDLE,
      locationX: -5,
      locationY: 15,
      dir: -Math.PI / 3,
      currentNode: 6,
      loading: false,
      linearVelocity: 0.4,
      errorCode: '',
    },
  ];

  return amrData;
};

export const VisualizationPanel = () => {
  const { updateModels } = useModelStore();

  // 컴포넌트 마운트 시 가상 데이터 생성 및 스토어 업데이트
  useEffect(() => {
    const virtualAMRData = generateVirtualAMRData();
    updateModels(virtualAMRData);
  }, [updateModels]);

  return (
    <div className='w-[800px] flex-shrink-0 p-4'>
      <div className='w-full h-full'>
        <Tabs defaultValue='3d' className='w-full h-full'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='3d'>3D View</TabsTrigger>
            <TabsTrigger value='2d'>2D View</TabsTrigger>
            <TabsTrigger value='heatmap'>Heatmap</TabsTrigger>
          </TabsList>
          <div className='mt-4 w-[768px] h-[768px]'>
            <Suspense fallback={<Loading />}>
              <TabsContent value='3d' className='h-full m-0 data-[state=active]:block'>
                <Scene3DViewer />
              </TabsContent>
              <TabsContent value='2d' className='h-full m-0 data-[state=active]:block'>
                <Scene2DViewer />
              </TabsContent>
              <TabsContent value='heatmap' className='h-full m-0 data-[state=active]:block'>
                <Heatmap />
              </TabsContent>
            </Suspense>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
