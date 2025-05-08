import { Client } from '@stomp/stompjs';
import { create } from 'zustand';

interface AmrSocketStore {
  amrSocket: Client | null;
  isConnected: boolean;
  setAmrSocket: (amrSocket: Client) => void;
  setIsConnected: (isConnected: boolean) => void;
}

export const useAmrSocketStore = create<AmrSocketStore>((set) => ({
  amrSocket: null,
  isConnected: false,
  setAmrSocket: (amrSocket: Client) => set({ amrSocket }),
  setIsConnected: (isConnected: boolean) => set({ isConnected }),
}));
