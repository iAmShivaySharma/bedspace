'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, MoreVertical, Phone, Video } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useGetMessagesQuery } from '@/lib/api/commonApi';
import { useAppSelector } from '@/lib/store/hooks';
import { formatDistanceToNow } from 'date-fns';
import type { Conversation, Message } from '@/types';

interface ChatWindowProps {
  conversation: Conversation;
  onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, onClose }) => {
  const { user } = useAppSelector(state => state.auth);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    sendMessage,
    markAsRead,
    loadConversation,
    startTyping,
    stopTyping,
    joinRoom,
    leaveRoom,
    getTypingUsers,
    isUserOnline,
    connected,
  } = useChat();

  const {
    data: messagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useGetMessagesQuery(
    { conversationId: conversation.id },
    { pollingInterval: connected ? 0 : 30000 } // No polling when websocket is connected
  );

  const typingUsers = getTypingUsers(conversation.id);
  const isParticipantOnline = isUserOnline(conversation.participant.id);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesData?.data]);

  // Join conversation room on mount
  useEffect(() => {
    if (connected && conversation.id) {
      joinRoom(conversation.id);
      loadConversation(conversation.id);

      return () => {
        leaveRoom(conversation.id);
      };
    }
  }, [conversation.id, connected, joinRoom, leaveRoom, loadConversation]);

  // Mark messages as read when conversation opens
  useEffect(() => {
    if (messagesData?.data && conversation.unreadCount > 0) {
      const unreadMessages = messagesData.data.filter(
        msg => msg.receiverId === user?.id && !msg.isRead
      );
      if (unreadMessages.length > 0) {
        markAsRead(
          conversation.id,
          unreadMessages.map(msg => msg.id)
        );
      }
    }
  }, [messagesData?.data, conversation.id, conversation.unreadCount, markAsRead, user?.id]);

  const handleSendMessage = () => {
    if (!message.trim() || !connected) return;

    sendMessage({
      conversationId: conversation.id,
      receiverId: conversation.participant.id,
      content: message.trim(),
      type: 'text',
    });

    setMessage('');
    stopTyping(conversation.id, conversation.participant.id);
    setIsTyping(false);
  };

  const handleTyping = (value: string) => {
    setMessage(value);

    if (value.trim() && !isTyping) {
      setIsTyping(true);
      startTyping(conversation.id, conversation.participant.id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(conversation.id, conversation.participant.id);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const renderMessage = (msg: Message, index: number) => {
    const isOwn = msg.senderId === user?.id;
    const prevMessage = index > 0 ? messagesData?.data?.[index - 1] : null;
    const showAvatar = !isOwn && (!prevMessage || prevMessage.senderId !== msg.senderId);

    return (
      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          {showAvatar && !isOwn && (
            <img
              src={
                msg.sender?.avatar ||
                conversation.participant.avatar ||
                '/images/default-avatar.png'
              }
              alt={msg.sender?.name || 'User'}
              className='w-8 h-8 rounded-full mr-2 flex-shrink-0'
            />
          )}
          <div className={!isOwn && !showAvatar ? 'ml-10' : ''}>
            <div
              className={`px-4 py-2 rounded-lg ${
                isOwn
                  ? 'bg-blue-500 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'
              }`}
            >
              <p className='text-sm'>{msg.content}</p>
            </div>
            <div className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
              {formatMessageTime(msg.createdAt)}
              {isOwn && msg.isRead && <span className='ml-1 text-blue-500'>✓✓</span>}
              {isOwn && !msg.isRead && <span className='ml-1 text-gray-400'>✓</span>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='flex flex-col h-full bg-white'>
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b border-gray-200 bg-white'>
        <div className='flex items-center'>
          <img
            src={conversation.participant.avatar || '/images/default-avatar.png'}
            alt={conversation.participant.name}
            className='w-10 h-10 rounded-full mr-3'
          />
          <div>
            <h3 className='font-semibold text-gray-900'>{conversation.participant.name}</h3>
            <div className='flex items-center text-sm text-gray-500'>
              <div
                className={`w-2 h-2 rounded-full mr-2 ${isParticipantOnline ? 'bg-green-500' : 'bg-gray-400'}`}
              />
              {isParticipantOnline ? 'Online' : 'Offline'}
              {typingUsers.length > 0 && <span className='ml-2 text-blue-500'>typing...</span>}
            </div>
            {conversation.listing && (
              <div className='text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full mt-1 inline-block'>
                📍 About: {conversation.listing.title}
              </div>
            )}
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <button className='p-2 text-gray-400 hover:text-gray-600 transition-colors'>
            <Phone className='w-5 h-5' />
          </button>
          <button className='p-2 text-gray-400 hover:text-gray-600 transition-colors'>
            <Video className='w-5 h-5' />
          </button>
          <button className='p-2 text-gray-400 hover:text-gray-600 transition-colors'>
            <MoreVertical className='w-5 h-5' />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className='p-2 text-gray-400 hover:text-gray-600 transition-colors'
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className='flex-1 overflow-y-auto p-4 space-y-1'>
        {messagesLoading ? (
          <div className='flex justify-center items-center h-32'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
          </div>
        ) : messagesData?.data && messagesData.data.length > 0 ? (
          <>
            {messagesData.data.map((msg, index) => renderMessage(msg, index))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className='text-center text-gray-500 py-8'>
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className='p-4 border-t border-gray-200 bg-white'>
        <div className='flex items-end space-x-2'>
          <button className='p-2 text-gray-400 hover:text-gray-600 transition-colors'>
            <Paperclip className='w-5 h-5' />
          </button>
          <div className='flex-1'>
            <textarea
              value={message}
              onChange={e => handleTyping(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder='Type a message...'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || !connected}
            className='p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            <Send className='w-5 h-5' />
          </button>
        </div>
        {!connected && (
          <div className='text-xs text-amber-600 mt-1'>Connection lost. Trying to reconnect...</div>
        )}
      </div>
    </div>
  );
};
