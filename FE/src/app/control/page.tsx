'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loading } from '@/components/ui/loading';

const Scene3D = dynamic(() => import('@/components/Scene3D'), {
  ssr: false,
  loading: () => <Loading />,
});
const Scene2D = dynamic(() => import('@/components/Scene2D'), {
  ssr: false,
  loading: () => <Loading />,
});
const Heatmap = dynamic(() => import('@/components/Heatmap'), {
  ssr: false,
  loading: () => <Loading />,
});

export default function ControlPage() {
  return (
    <div className='flex h-screen'>
      {/* 왼쪽 대시보드 영역 */}
      <div className='flex min-w-[300px] grow p-4 bg-gray-100'>
        <Card className='w-full p-4'>
          <h2 className='mb-4 text-xl font-bold'>AMR </h2>
          <div className='space-y-2'>
            <div>빈도 기반 경로 시각화</div>
            <div>교착 발생 지점 시각화</div>
            <div>AMR별 작업 히스토리 조회</div>
            <div>작업 ID, 시각 및 종료 시간, 소요 시간, 성공 여부</div>
          </div>
        </Card>
      </div>

      {/* 오른쪽 시각화 영역 */}
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
                  <Scene3D />
                </TabsContent>
                <TabsContent value='2d' className='h-full m-0 data-[state=active]:block'>
                  <Scene2D />
                </TabsContent>
                <TabsContent value='heatmap' className='h-full m-0 data-[state=active]:block'>
                  <Heatmap />
                </TabsContent>
              </Suspense>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
