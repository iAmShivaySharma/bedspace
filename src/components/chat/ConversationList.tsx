'use client';

import React, { useState } from 'react';
import { Search, Plus, MessageCircle } from 'lucide-react';
import { useGetConversationsQuery } from '@/lib/api/commonApi';
import { useSocket } from '@/hooks/useSocket';
import { useAppSelector } from '@/lib/store/hooks';
import { formatDistanceToNow } from 'date-fns';
import type { Conversation } from '@/types';

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
  onStartNewChat?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
  selectedConversationId,
  onStartNewChat,
}) => {
  const { user } = useAppSelector(state => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Initialize socket for real-time updates
  const { isConnected } = useSocket({
    roomId: 'conversations-list', // General room for conversation updates
    onUserStatusUpdated: (data: { userId: string; status: string }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.status === 'online') {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    },
  });

  const {
    data: conversationsData,
    isLoading,
    error,
    refetch,
  } = useGetConversationsQuery(
    { page: 1, limit: 50 },
    { pollingInterval: isConnected ? 0 : 30000 } // No polling when websocket is connected
  );

  const filteredConversations =
    conversationsData?.data?.filter(conversation => {
      // Additional validation: ensure conversation has valid participant and user is not seeing their own chat
      if (
        !conversation.participant ||
        !conversation.participant.id ||
        conversation.participant.id === user?._id
      ) {
        return false;
      }

      // Search filter
      const matchesSearch =
        conversation.participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversation.lastMessage?.content?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    }) || [];

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateMessage = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const renderConversationItem = (conversation: Conversation) => {
    const isSelected = selectedConversationId === conversation.id;
    const isOnline = onlineUsers.has(conversation.participant.id);
    const hasUnread = conversation.unreadCount > 0;

    return (
      <div
        key={conversation.id}
        onClick={() => onSelectConversation(conversation)}
        className={`flex items-center p-3 cursor-pointer transition-colors border-b border-gray-100 hover:bg-gray-50 ${
          isSelected ? 'bg-blue-50 border-blue-200' : ''
        }`}
      >
        <div className='relative mr-3'>
          <img
            src={conversation.participant.avatar || '/images/default-avatar.png'}
            alt={conversation.participant.name}
            className='w-12 h-12 rounded-full object-cover'
          />
          {isOnline && (
            <div className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white'></div>
          )}
        </div>

        <div className='flex-1 min-w-0'>
          <div className='flex items-center justify-between mb-1'>
            <h4 className={`font-medium truncate ${hasUnread ? 'font-semibold' : ''}`}>
              {conversation.participant.name}
            </h4>
            {conversation.lastMessage && (
              <span className='text-xs text-gray-500 flex-shrink-0'>
                {formatLastMessageTime(conversation.lastMessage.createdAt)}
              </span>
            )}
          </div>

          <div className='flex items-center justify-between'>
            <p className={`text-sm truncate ${hasUnread ? 'font-medium' : 'text-gray-600'}`}>
              {conversation.lastMessage ? (
                <>
                  {conversation.lastMessage.senderId === user?._id && (
                    <span className='text-gray-500'>You: </span>
                  )}
                  {truncateMessage(conversation.lastMessage.content)}
                </>
              ) : (
                <span className='text-gray-500 italic'>No messages yet</span>
              )}
            </p>
            {hasUnread && (
              <div className='bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2'>
                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
              </div>
            )}
          </div>

          <div className='flex items-center mt-1'>
            <span className='text-xs text-gray-500 capitalize'>
              {conversation.participant.role}
            </span>
            {conversation.listing && (
              <>
                <div className='w-1 h-1 bg-gray-400 rounded-full mx-2'></div>
                <span className='text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full'>
                  📍 {conversation.listing.title}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className='p-4 text-center'>
        <p className='text-red-500 mb-4'>Failed to load conversations</p>
        <button
          onClick={() => refetch()}
          className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full bg-white'>
      {/* Header */}
      <div className='p-4 border-b border-gray-200'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-semibold text-gray-900'>Messages</h2>
          {onStartNewChat && (
            <button
              onClick={onStartNewChat}
              className='p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
              title='Start new chat'
            >
              <Plus className='w-5 h-5' />
            </button>
          )}
        </div>

        {/* Search */}
        <div className='relative'>
          <Search className='w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
          <input
            type='text'
            placeholder='Search conversations...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          />
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className='p-2 bg-amber-100 text-amber-800 text-sm text-center'>
          Connection lost. Messages may be delayed.
        </div>
      )}

      {/* Conversations List */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className='p-4'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='flex items-center p-3 border-b border-gray-100'>
                <div className='w-12 h-12 bg-gray-200 rounded-full mr-3 animate-pulse'></div>
                <div className='flex-1'>
                  <div className='h-4 bg-gray-200 rounded mb-2 animate-pulse'></div>
                  <div className='h-3 bg-gray-200 rounded w-3/4 animate-pulse'></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length > 0 ? (
          <div>{filteredConversations.map(renderConversationItem)}</div>
        ) : searchTerm ? (
          <div className='text-center py-8 text-gray-500'>
            <Search className='w-12 h-12 mx-auto mb-4 text-gray-300' />
            <p>No conversations found for "{searchTerm}"</p>
          </div>
        ) : (
          <div className='text-center py-8 text-gray-500'>
            <MessageCircle className='w-12 h-12 mx-auto mb-4 text-gray-300' />
            <p className='mb-2'>No conversations yet</p>
            {onStartNewChat && (
              <button
                onClick={onStartNewChat}
                className='text-blue-500 hover:text-blue-600 transition-colors'
              >
                Start your first conversation
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
