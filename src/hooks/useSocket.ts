import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from '@/lib/store/hooks';

interface UseSocketOptions {
  autoConnect?: boolean;
}

interface SocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { autoConnect = true } = options;
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const socketRef = useRef<Socket | null>(null);
  const [socketState, setSocketState] = useState<SocketState>({
    connected: false,
    connecting: false,
    error: null,
  });

  // Get token from cookies (as used in the auth middleware)
  const getToken = () => {
    if (typeof window !== 'undefined' && document.cookie) {
      const cookies = document.cookie.split(';');
      const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='));
      return authCookie ? authCookie.split('=')[1] : null;
    }
    return null;
  };

  const connect = () => {
    const token = getToken();
    if (!token || socketRef.current?.connected) return;

    setSocketState(prev => ({ ...prev, connecting: true, error: null }));

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      auth: { token },
      autoConnect: false,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setSocketState({
        connected: true,
        connecting: false,
        error: null,
      });
    });

    socket.on('disconnect', reason => {
      console.log('Socket disconnected:', reason);
      setSocketState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
      }));
    });

    socket.on('connect_error', error => {
      console.error('Socket connection error:', error);
      setSocketState({
        connected: false,
        connecting: false,
        error: error.message,
      });
    });

    socket.on('error', error => {
      console.error('Socket error:', error);
      setSocketState(prev => ({
        ...prev,
        error: error.message,
      }));
    });

    socketRef.current = socket;
    socket.connect();
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const emit = (event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.removeAllListeners(event);
      }
    }
  };

  useEffect(() => {
    if (autoConnect && user && isAuthenticated) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user, isAuthenticated, autoConnect]);

  return {
    socket: socketRef.current,
    ...socketState,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
};
