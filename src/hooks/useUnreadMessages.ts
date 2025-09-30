import { useState, useCallback } from 'react';
import { useGetUnreadMessageCountQuery } from '@/lib/api/commonApi';
import { useSocket } from './useSocket';

export const useUnreadMessages = () => {
  const [realtimeUnreadCount, setRealtimeUnreadCount] = useState<number | null>(null);

  // Socket for real-time unread count updates
  const { isConnected } = useSocket({
    roomId: 'unread-messages',
    onNewMessage: useCallback(() => {
      // Increment unread count when new message received
      setRealtimeUnreadCount(prev => (prev || 0) + 1);
    }, []),
  });

  const {
    data: unreadData,
    isLoading,
    error,
    refetch,
  } = useGetUnreadMessageCountQuery(undefined, {
    pollingInterval: isConnected ? 0 : 30000, // No polling when websocket is connected
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Use real-time count if available, otherwise fallback to API data
  const unreadCount = realtimeUnreadCount ?? unreadData?.data?.count ?? 0;

  // Reset real-time count when messages are read
  const resetUnreadCount = useCallback(() => {
    setRealtimeUnreadCount(0);
    refetch(); // Also refetch from server
  }, [refetch]);

  return {
    unreadCount,
    isLoading,
    error,
    resetUnreadCount,
    isConnected,
  };
};
