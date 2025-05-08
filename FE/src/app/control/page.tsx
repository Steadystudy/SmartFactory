'use client';

import { ControlPanel } from '@/features/control-panel';
import { VisualizationPanel } from '@/features/visualization';
import { SOCKET_URL } from '@/shared/constants/api';
import { useAmrSocketStore } from '@/shared/store/amrSocket';
import { Client } from '@stomp/stompjs';
import { useEffect } from 'react';
import SockJS from 'sockjs-client';

const StompClientConfig = {
  connectHeaders: {},
  // debug: (str: string) => console.log(str),
  reconnectDelay: 5000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000,
};

export default function ControlPage() {
  const { setAmrSocket, setIsConnected } = useAmrSocketStore();

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

    client.activate();
    setAmrSocket(client);

    return () => {
      socket.close();
    };
  }, [setAmrSocket, setIsConnected]);

  return (
    <div className='flex h-screen'>
      <ControlPanel />
      <VisualizationPanel />
    </div>
  );
}
