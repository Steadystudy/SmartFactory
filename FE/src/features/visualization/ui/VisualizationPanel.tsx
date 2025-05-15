'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loading } from '@/components/ui/loading';
import { Suspense, useEffect } from 'react';
import { useModelStore } from '@/shared/model/store';
import { Scene2DViewer, Scene3DViewer } from '@/features/viewer';
import { AMR_CURRENT_STATE } from '../model/types';
import { degreeToRadian } from '@/shared/hooks/useMathUtils';
import { useAmrSocketStore } from '@/shared/store/amrSocket';
import { useLineStore } from '@/shared/store/lineStore';

export const VisualizationPanel = () => {
  const { updateModels } = useModelStore();
  const { amrSocket, isConnected } = useAmrSocketStore();

  useEffect(() => {
    if (!isConnected || !amrSocket) return;

    amrSocket.subscribe('/amr/real-time', (message) => {
      const data = JSON.parse(message.body).amrRealTimeList;
      updateModels(data.map((d: AMR_CURRENT_STATE) => ({ ...d, dir: degreeToRadian(d.dir) })));
    });
  }, [isConnected, amrSocket, updateModels]);

  const { setLines } = useLineStore();

  useEffect(() => {
    if (!isConnected || !amrSocket) return;
    amrSocket.subscribe('/amr/line', (message) => {
      const data = JSON.parse(message.body);
      setLines(data.lineList);
    });
  }, [amrSocket, isConnected]);

  return (
    <div className='flex-shrink-0 w-[calc(75%-80px)] p-4 h-dvh'>
      <div className='h-full'>
        <Tabs defaultValue='3d' className='w-full h-full'>
          <TabsList className='grid w-full grid-cols-2 cursor-pointer bg-white/10'>
            <TabsTrigger value='3d'>공장 전체 View</TabsTrigger>
            <TabsTrigger value='2d'>Top View</TabsTrigger>
          </TabsList>
          <div className='h-full mt-4 cursor-grab'>
            <Suspense fallback={<Loading />}>
              <TabsContent value='3d' className='h-full m-0 data-[state=active]:block'>
                <Scene3DViewer />
              </TabsContent>
              <TabsContent value='2d' className='h-full m-0 data-[state=active]:block'>
                <Scene2DViewer />
              </TabsContent>
            </Suspense>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
