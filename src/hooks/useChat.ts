import { useEffect, useRef, useState } from 'react';
import { useSocket } from './useSocket';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { commonApi } from '@/lib/api/commonApi';
import type { Message, Conversation } from '@/types';

interface TypingUser {
  userId: string;
  user: {
    id: string;
    name: string;
  };
}

interface ChatState {
  typingUsers: Record<string, TypingUser[]>;
  onlineUsers: Set<string>;
  activeConversation: string | null;
}

export const useChat = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { socket, connected } = useSocket();

  const [chatState, setChatState] = useState<ChatState>({
    typingUsers: {},
    onlineUsers: new Set(),
    activeConversation: null,
  });

  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Socket event handlers
  useEffect(() => {
    if (!socket || !connected) return;

    const handleMessageReceived = (message: Message) => {
      // Invalidate relevant queries to trigger refetch
      dispatch(
        commonApi.util.invalidateTags([
          { type: 'Message', id: message.conversationId },
          { type: 'Conversation', id: 'LIST' },
        ])
      );
    };

    const handleMessageSent = (message: Message) => {
      // Invalidate relevant queries to trigger refetch
      dispatch(
        commonApi.util.invalidateTags([
          { type: 'Message', id: message.conversationId },
          { type: 'Conversation', id: 'LIST' },
        ])
      );
    };

    const handleMessageRead = (data: {
      conversationId: string;
      readByUserId: string;
      readCount: number;
    }) => {
      // Invalidate message and conversation queries
      dispatch(
        commonApi.util.invalidateTags([
          { type: 'Message', id: data.conversationId },
          { type: 'Conversation', id: 'LIST' },
        ])
      );
    };

    const handleTypingStart = (data: {
      conversationId: string;
      userId: string;
      user: { id: string; name: string };
    }) => {
      if (data.userId === user?.id) return; // Don't show own typing indicator

      setChatState(prev => {
        const currentTyping = prev.typingUsers[data.conversationId] || [];
        const isAlreadyTyping = currentTyping.some(u => u.userId === data.userId);

        if (!isAlreadyTyping) {
          return {
            ...prev,
            typingUsers: {
              ...prev.typingUsers,
              [data.conversationId]: [...currentTyping, { userId: data.userId, user: data.user }],
            },
          };
        }
        return prev;
      });

      // Clear any existing timeout for this user
      if (typingTimeoutRef.current[`${data.conversationId}-${data.userId}`]) {
        clearTimeout(typingTimeoutRef.current[`${data.conversationId}-${data.userId}`]);
      }

      // Set timeout to automatically remove typing indicator
      typingTimeoutRef.current[`${data.conversationId}-${data.userId}`] = setTimeout(() => {
        setChatState(prev => ({
          ...prev,
          typingUsers: {
            ...prev.typingUsers,
            [data.conversationId]: (prev.typingUsers[data.conversationId] || []).filter(
              u => u.userId !== data.userId
            ),
          },
        }));
      }, 3000);
    };

    const handleTypingStop = (data: { conversationId: string; userId: string }) => {
      setChatState(prev => ({
        ...prev,
        typingUsers: {
          ...prev.typingUsers,
          [data.conversationId]: (prev.typingUsers[data.conversationId] || []).filter(
            u => u.userId !== data.userId
          ),
        },
      }));

      // Clear timeout
      if (typingTimeoutRef.current[`${data.conversationId}-${data.userId}`]) {
        clearTimeout(typingTimeoutRef.current[`${data.conversationId}-${data.userId}`]);
        delete typingTimeoutRef.current[`${data.conversationId}-${data.userId}`];
      }
    };

    const handleUserStatusUpdate = (data: { userId: string; status: string }) => {
      setChatState(prev => {
        const newOnlineUsers = new Set(prev.onlineUsers);
        if (data.status === 'online') {
          newOnlineUsers.add(data.userId);
        } else {
          newOnlineUsers.delete(data.userId);
        }
        return { ...prev, onlineUsers: newOnlineUsers };
      });
    };

    const handleConnectionEstablished = () => {
      console.log('Chat connection established');
    };

    // Register event listeners
    socket.on('message:received', handleMessageReceived);
    socket.on('message:sent', handleMessageSent);
    socket.on('message:read', handleMessageRead);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('user:status:update', handleUserStatusUpdate);
    socket.on('connection:established', handleConnectionEstablished);

    // Cleanup
    return () => {
      socket.off('message:received', handleMessageReceived);
      socket.off('message:sent', handleMessageSent);
      socket.off('message:read', handleMessageRead);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('user:status:update', handleUserStatusUpdate);
      socket.off('connection:established', handleConnectionEstablished);

      // Clear all typing timeouts
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
      typingTimeoutRef.current = {};
    };
  }, [socket, connected, user?.id, dispatch]);

  // Chat actions
  const sendMessage = (data: {
    conversationId?: string;
    receiverId: string;
    content: string;
    type?: 'text' | 'image' | 'file';
    metadata?: any;
  }) => {
    if (socket?.connected) {
      socket.emit('message:send', {
        ...data,
        type: data.type || 'text',
      });
    }
  };

  const markAsRead = (conversationId: string, messageIds?: string[]) => {
    if (socket?.connected) {
      socket.emit('message:markRead', { conversationId, messageIds });
    }
  };

  const loadConversation = (conversationId: string) => {
    if (socket?.connected) {
      socket.emit('conversation:load', { conversationId });
      setChatState(prev => ({ ...prev, activeConversation: conversationId }));
    }
  };

  const startTyping = (conversationId: string, receiverId: string) => {
    if (socket?.connected) {
      socket.emit('typing:start', { conversationId, receiverId });
    }
  };

  const stopTyping = (conversationId: string, receiverId: string) => {
    if (socket?.connected) {
      socket.emit('typing:stop', { conversationId, receiverId });
    }
  };

  const joinRoom = (conversationId: string) => {
    if (socket?.connected) {
      socket.emit('room:join', { conversationId });
    }
  };

  const leaveRoom = (conversationId: string) => {
    if (socket?.connected) {
      socket.emit('room:leave', { conversationId });
    }
  };

  const deleteMessage = (messageId: string, deleteForEveryone = false) => {
    if (socket?.connected) {
      socket.emit('message:delete', { messageId, deleteForEveryone });
    }
  };

  const setActiveConversation = (conversationId: string | null) => {
    setChatState(prev => ({ ...prev, activeConversation: conversationId }));
  };

  return {
    // State
    ...chatState,
    connected,

    // Actions
    sendMessage,
    markAsRead,
    loadConversation,
    startTyping,
    stopTyping,
    joinRoom,
    leaveRoom,
    deleteMessage,
    setActiveConversation,

    // Helpers
    getTypingUsers: (conversationId: string) => chatState.typingUsers[conversationId] || [],
    isUserOnline: (userId: string) => chatState.onlineUsers.has(userId),
  };
};
