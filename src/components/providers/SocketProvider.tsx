'use client';

import React, { createContext, useContext } from 'react';

// Simple context that can be used if needed for global socket state
interface SocketContextType {
  // This provider is now simplified since useSocket hook handles everything
  isSocketSupported: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const value: SocketContextType = {
    isSocketSupported: typeof window !== 'undefined',
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
