'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAppSelector } from '@/lib/store/hooks';

interface SocketContextType {
  socket: any;
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAppSelector(state => state.auth);

  const socketData = useSocket({
    autoConnect: isAuthenticated,
  });

  const value: SocketContextType = {
    socket: socketData.socket,
    connected: socketData.connected,
    connecting: socketData.connecting,
    error: socketData.error,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};
