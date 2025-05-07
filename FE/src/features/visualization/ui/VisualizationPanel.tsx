'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loading } from '@/components/ui/loading';
import dynamic from 'next/dynamic';
import SockJS from 'sockjs-client';
import { Suspense, useEffect, useState } from 'react';
import { useModelStore } from '@/shared/model/store';
import { Scene2DViewer, Scene3DViewer } from '@/features/viewer';
import { AMR_CURRENT_STATE } from '../model/types';
import { degreeToRadian } from '@/shared/hooks/useMathUtils';
import { SOCKET_URL } from '@/shared/constants/api';
import { Client } from '@stomp/stompjs';

const Heatmap = dynamic(() => import('@/components/Heatmap'), {
  ssr: false,
  loading: () => <Loading />,
});

const StompClientConfig = {
  connectHeaders: {},
  // debug: (str: string) => console.log(str),
  reconnectDelay: 5000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000,
};

export const VisualizationPanel = () => {
  const { updateModels } = useModelStore();
  const [amrSocket, setAmrSocket] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = new SockJS(SOCKET_URL + '/status');

    const client = new Client({
      ...StompClientConfig,
      webSocketFactory: () => socket,
      onConnect: () => {
        console.log('connected');
        setIsConnected(true);
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
    });
    // const socket = io('ws://192.168.30.159:5000', {
    //   transports: ['websocket'],
    //   autoConnect: true,
    // });

    // socket.on('connect', () => {
    //   console.log('connected');
    //   setIsConnected(true);
    // });

    // socket.on('disconnect', () => {
    //   setIsConnected(false);
    // });

    client.activate();
    setAmrSocket(client);

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (!isConnected || !amrSocket) return;
    amrSocket.subscribe('/amr/mission', (message) => {
      // console.log(message);
    });

    amrSocket.subscribe('/amr/real-time', (message) => {
      const data = JSON.parse(message.body).amrRealTimeList;
      console.log(data);
      updateModels(data.map((d: AMR_CURRENT_STATE) => ({ ...d, dir: degreeToRadian(d.dir) })));
    });
    // amrSocket.on('amr_status', (data: { body: AMR_CURRENT_STATE }[]) => {
    //   updateModels(
    //     data.map((d) => ({ ...d.body, dir: degreeToRadian(d.body.dir) } as AMR_CURRENT_STATE)),
    //   );
    // });
  }, [isConnected, amrSocket, updateModels]);

  return (
    <div className='flex-shrink-0 w-[calc(75%-80px)] p-4 h-dvh'>
      <div className='h-full'>
        <Tabs defaultValue='3d' className='w-full h-full'>
          <TabsList className='grid w-full grid-cols-3 cursor-pointer bg-white/10'>
            <TabsTrigger value='3d'>3D View</TabsTrigger>
            <TabsTrigger value='2d'>2D View</TabsTrigger>
            <TabsTrigger value='heatmap'>Heatmap</TabsTrigger>
          </TabsList>
          <div className='h-full mt-4 cursor-grab'>
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
