'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loading } from '@/components/ui/loading';
import dynamic from 'next/dynamic';
import { Suspense, useEffect } from 'react';
import { useModelStore } from '@/shared/model/store';
import { AMRInfo } from '@/entities/3d-model';
import Scene3DViewer from '@/features/3d-viewer';
import Scene2DViewer from '@/features/2d-viewer';

const Heatmap = dynamic(() => import('@/components/Heatmap'), {
  ssr: false,
  loading: () => <Loading />,
});

// 가상의 AMR 데이터 생성 함수
const generateVirtualAMRData = (): Omit<AMRInfo, 'prevX' | 'prevY'>[] => {
  // 각 AMR 타입별로 2개씩 생성
  const amrData: Omit<AMRInfo, 'prevX' | 'prevY'>[] = [
    // AMR 1
    {
      amrId: 'amr-1',
      state: 1, // IDLE
      locationX: 10,
      locationY: 10,
      dir: Math.PI / 4,
      battery: 85,
      currentNode: 1,
      loading: false,
      missionId: 0,
      missionType: 'MOVING',
      submissionId: 0,
      linearVelocity: 0.5,
      errorList: [],
      timestamp: new Date().toISOString(),
      type: '1',
      startX: 8,
      startY: 8,
      targetX: 12,
      targetY: 12,
    },
    // AMR 2
    {
      amrId: 'amr-2',
      state: 2, // PROCESSING
      locationX: -8,
      locationY: -5,
      dir: -Math.PI / 6,
      battery: 72,
      currentNode: 2,
      loading: true,
      missionId: 101,
      missionType: 'LOADING',
      submissionId: 201,
      linearVelocity: 1.2,
      errorList: [],
      timestamp: new Date().toISOString(),
      type: '1',
      startX: -10,
      startY: -7,
      targetX: -6,
      targetY: -3,
    },
    // AMR 3
    {
      amrId: 'amr-3',
      state: 0, // ERROR
      locationX: 5,
      locationY: -12,
      dir: Math.PI / 3,
      battery: 45,
      currentNode: 3,
      loading: false,
      missionId: 0,
      missionType: 'MOVING',
      submissionId: 0,
      linearVelocity: 0,
      errorList: ['E001', 'E003'],
      timestamp: new Date().toISOString(),
      type: '1',
      startX: 3,
      startY: -14,
      targetX: 7,
      targetY: -10,
    },
    // AMR 4
    {
      amrId: 'amr-4',
      state: 3, // CHARGING
      locationX: -12,
      locationY: 8,
      dir: -Math.PI / 4,
      battery: 90,
      currentNode: 4,
      loading: false,
      missionId: 0,
      missionType: 'CHARGING',
      submissionId: 0,
      linearVelocity: 0.3,
      errorList: [],
      timestamp: new Date().toISOString(),
      type: '1',
      startX: -14,
      startY: 6,
      targetX: -10,
      targetY: 10,
    },
    // AMR 5
    {
      amrId: 'amr-5',
      state: 2, // PROCESSING
      locationX: 0,
      locationY: -10,
      dir: Math.PI / 2,
      battery: 65,
      currentNode: 5,
      loading: true,
      missionId: 102,
      missionType: 'UNLOADING',
      submissionId: 202,
      linearVelocity: 0.8,
      errorList: [],
      timestamp: new Date().toISOString(),
      type: '1',
      startX: -2,
      startY: -12,
      targetX: 2,
      targetY: -8,
    },
    // AMR 6
    {
      amrId: 'amr-6',
      state: 1, // IDLE
      locationX: -5,
      locationY: 15,
      dir: -Math.PI / 3,
      battery: 78,
      currentNode: 6,
      loading: false,
      missionId: 0,
      missionType: 'MOVING',
      submissionId: 0,
      linearVelocity: 0.4,
      errorList: [],
      timestamp: new Date().toISOString(),
      type: '1',
      startX: -7,
      startY: 13,
      targetX: -3,
      targetY: 17,
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
          <div className='mt-4 h-[calc(100vh-8rem)]'>
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
