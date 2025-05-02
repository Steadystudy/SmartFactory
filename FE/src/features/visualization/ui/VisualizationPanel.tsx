'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loading } from '@/components/ui/loading';
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import { useModelStore } from '@/shared/model/store';
import { Scene2DViewer, Scene3DViewer } from '@/features/viewer';
import { AMR_CURRENT_STATE } from '../model/types';
import { io, Socket } from 'socket.io-client';
import { degreeToRadian } from '@/shared/hooks/useMathUtils';

const Heatmap = dynamic(() => import('@/components/Heatmap'), {
  ssr: false,
  loading: () => <Loading />,
});

export const VisualizationPanel = () => {
  const { updateModels } = useModelStore();
  const [amrSocket, setAmrSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io('ws://192.168.30.159:5000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    setAmrSocket(socket);

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (!isConnected || !amrSocket) return;

    amrSocket.on('amr_status', (data: { body: AMR_CURRENT_STATE }[]) => {
      updateModels(
        data.map((d) => ({ ...d.body, dir: degreeToRadian(d.body.dir) } as AMR_CURRENT_STATE)),
      );
    });
  }, [isConnected, amrSocket, updateModels]);

  return (
    <div className='w-[800px] flex-shrink-0 p-4'>
      <div className='w-full h-full'>
        <Tabs defaultValue='3d' className='w-full h-full'>
          <TabsList className='grid w-full grid-cols-3 bg-white/10'>
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
