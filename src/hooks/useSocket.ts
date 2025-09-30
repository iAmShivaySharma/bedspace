// hooks/useSocket.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { socketManager } from '@/lib/socketManager';

interface UseSocketProps {
  roomId?: string;
  onNewMessage?: (message: any) => void;
  onUserTyping?: (data: { userName: string }) => void;
  onUserStoppedTyping?: (data: { userName: string }) => void;
  onUserStatusUpdated?: (data: { userId: string; status: string }) => void;
}

export const useSocket = ({
  roomId,
  onNewMessage,
  onUserTyping,
  onUserStoppedTyping,
  onUserStatusUpdated,
}: UseSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const subscriberIdRef = useRef(`subscriber_${Math.random().toString(36).substr(2, 9)}`);

  // Use refs to store stable references to callback functions
  const handlersRef = useRef({
    onNewMessage,
    onUserTyping,
    onUserStoppedTyping,
    onUserStatusUpdated,
  });

  // Update refs when callbacks change
  useEffect(() => {
    handlersRef.current = {
      onNewMessage,
      onUserTyping,
      onUserStoppedTyping,
      onUserStatusUpdated,
    };
  }, [onNewMessage, onUserTyping, onUserStoppedTyping, onUserStatusUpdated]);

  // Connection status tracking
  useEffect(() => {
    let statusInterval: NodeJS.Timeout;

    const updateConnectionStatus = () => {
      const connected = socketManager.isConnected();
      setIsConnected(connected);
    };

    // Initial status check
    updateConnectionStatus();

    // Check status periodically
    statusInterval = setInterval(updateConnectionStatus, 1000);

    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  // Room and event management
  useEffect(() => {
    const subscriberId = subscriberIdRef.current;

    const setupSocketHandlers = async () => {
      try {
        // Join room if provided
        if (roomId) {
          await socketManager.joinRoom(roomId, subscriberId);
        }

        // Register event handlers
        if (handlersRef.current.onNewMessage) {
          await socketManager.on('new-message', handlersRef.current.onNewMessage, subscriberId);
        }

        if (handlersRef.current.onUserTyping) {
          await socketManager.on('user-typing', handlersRef.current.onUserTyping, subscriberId);
        }

        if (handlersRef.current.onUserStoppedTyping) {
          await socketManager.on(
            'user-stopped-typing',
            handlersRef.current.onUserStoppedTyping,
            subscriberId
          );
        }

        if (handlersRef.current.onUserStatusUpdated) {
          await socketManager.on(
            'user-status-updated',
            handlersRef.current.onUserStatusUpdated,
            subscriberId
          );
        }

        // Connection events
        await socketManager.on(
          'connect',
          () => {
            console.log('useSocket: Connected to server');
            setIsConnected(true);
            setReconnectAttempts(0);
          },
          subscriberId
        );

        await socketManager.on(
          'disconnect',
          () => {
            console.log('useSocket: Disconnected from server');
            setIsConnected(false);
          },
          subscriberId
        );

        await socketManager.on(
          'reconnect_attempt',
          (attemptNumber: number) => {
            console.log('useSocket: Reconnection attempt:', attemptNumber);
            setReconnectAttempts(attemptNumber);
          },
          subscriberId
        );
      } catch (error) {
        console.error('useSocket: Failed to setup handlers:', error);
      }
    };

    setupSocketHandlers();

    // Cleanup
    return () => {
      console.log('useSocket: Cleaning up for roomId:', roomId);

      if (roomId) {
        socketManager.leaveRoom(roomId, subscriberId);
      }

      // Remove event handlers
      if (handlersRef.current.onNewMessage) {
        socketManager.off('new-message', handlersRef.current.onNewMessage);
      }
      if (handlersRef.current.onUserTyping) {
        socketManager.off('user-typing', handlersRef.current.onUserTyping);
      }
      if (handlersRef.current.onUserStoppedTyping) {
        socketManager.off('user-stopped-typing', handlersRef.current.onUserStoppedTyping);
      }
      if (handlersRef.current.onUserStatusUpdated) {
        socketManager.off('user-status-updated', handlersRef.current.onUserStatusUpdated);
      }
    };
  }, [roomId]); // Only depend on roomId

  // Helper functions for emitting events
  const sendMessage = useCallback(
    async (message: any, senderId: string, senderName: string) => {
      if (roomId && socketManager.isConnected()) {
        try {
          await socketManager.emit('send-message', {
            roomId,
            message,
            senderId,
            senderName,
          });
        } catch (error) {
          console.error('useSocket: Failed to send message:', error);
        }
      } else {
        console.warn('useSocket: Cannot send message - not connected or no roomId');
      }
    },
    [roomId]
  );

  const startTyping = useCallback(
    async (userName: string) => {
      if (roomId && socketManager.isConnected()) {
        try {
          await socketManager.emit('typing-start', { roomId, userName });
        } catch (error) {
          console.error('useSocket: Failed to start typing:', error);
        }
      }
    },
    [roomId]
  );

  const stopTyping = useCallback(
    async (userName: string) => {
      if (roomId && socketManager.isConnected()) {
        try {
          await socketManager.emit('typing-stop', { roomId, userName });
        } catch (error) {
          console.error('useSocket: Failed to stop typing:', error);
        }
      }
    },
    [roomId]
  );

  const updateUserStatus = useCallback(
    async (userId: string, status: 'online' | 'offline' | 'away') => {
      if (roomId && socketManager.isConnected()) {
        try {
          await socketManager.emit('user-status-change', { roomId, userId, status });
        } catch (error) {
          console.error('useSocket: Failed to update user status:', error);
        }
      }
    },
    [roomId]
  );

  return {
    socket: socketManager.isConnected() ? { id: socketManager.getSocketId() } : null,
    isConnected,
    reconnectAttempts,
    sendMessage,
    startTyping,
    stopTyping,
    updateUserStatus,
  };
};
