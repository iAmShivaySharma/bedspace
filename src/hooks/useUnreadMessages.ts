import { useGetUnreadMessageCountQuery } from '@/lib/api/commonApi';
import { useChat } from './useChat';

export const useUnreadMessages = () => {
  const { connected } = useChat();

  const {
    data: unreadData,
    isLoading,
    error,
  } = useGetUnreadMessageCountQuery(undefined, {
    pollingInterval: connected ? 0 : 30000, // No polling when websocket is connected
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const unreadCount = unreadData?.data?.count || 0;

  return {
    unreadCount,
    isLoading,
    error,
  };
};
