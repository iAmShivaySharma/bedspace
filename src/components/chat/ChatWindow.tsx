// components/chat/ChatWindow.tsx
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  X,
  Smile,
  CheckCheck,
  Check,
  Loader2,
} from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useGetMessagesQuery, useSendMessageMutation } from '@/lib/api/commonApi';
import { useAppSelector } from '@/lib/store/hooks';
import { formatDistanceToNow } from 'date-fns';
import type { Conversation, Message } from '@/types';

interface ChatWindowProps {
  conversation: Conversation;
  onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, onClose }) => {
  const { user } = useAppSelector(state => state.auth);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const roomId = conversation.id;
  const userId = user?._id || '';
  const userName = user?.name || 'User';

  // Check if user has access to this conversation
  const hasAccess = user && conversation.participant && conversation.participant.id !== userId;

  console.log('Access check:', {
    user,
    userId: user?._id,
    userIdField: user?.id,
    participantId: conversation.participant?.id,
    hasAccess,
  });

  if (!hasAccess) {
    return (
      <div className='flex flex-col h-full w-full bg-gray-50 items-center justify-center'>
        <div className='text-center text-gray-500 p-8'>
          <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <X className='w-8 h-8 text-red-500' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>Access Denied</h3>
          <p className='text-gray-500 mb-4'>You don't have permission to view this conversation.</p>
          {onClose && (
            <button
              onClick={onClose}
              className='px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors'
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  // RTK Query hooks for messages
  const {
    data: messagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useGetMessagesQuery({ conversationId: conversation.id }, { skip: !conversation.id });

  // RTK Query mutation for sending messages
  const [sendMessageMutation, { isLoading: isSending }] = useSendMessageMutation();

  // Socket event handlers
  const handleNewMessage = useCallback(
    (message: any) => {
      // Refetch messages when new message received via socket
      refetchMessages();
    },
    [refetchMessages]
  );

  const handleUserTyping = useCallback(
    (data: { userName: string }) => {
      if (data.userName === userName) return; // Don't show own typing

      setTypingUsers(prev => {
        if (!prev.includes(data.userName)) {
          return [...prev, data.userName];
        }
        return prev;
      });

      // Remove typing indicator after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(user => user !== data.userName));
      }, 3000);
    },
    [userName]
  );

  const handleUserStoppedTyping = useCallback((data: { userName: string }) => {
    setTypingUsers(prev => prev.filter(user => user !== data.userName));
  }, []);

  // Initialize socket
  const { isConnected, startTyping, stopTyping, sendMessage } = useSocket({
    roomId,
    onNewMessage: handleNewMessage,
    onUserTyping: handleUserTyping,
    onUserStoppedTyping: handleUserStoppedTyping,
  });

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setTimeout(scrollToBottom, 100);
  }, [messagesData?.data]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setNewMessage(textarea.value);

    // Reset height to get correct scrollHeight
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const minHeight = 48;
    const maxHeight = 120;
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;

    // Handle typing indicators
    if (textarea.value.trim() && !isTyping) {
      setIsTyping(true);
      startTyping(userName);
    } else if (!textarea.value.trim() && isTyping) {
      setIsTyping(false);
      stopTyping(userName);
    }
  };

  // Handle message sending with proper API integration
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsTyping(false);
    stopTyping(userName);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }

    try {
      // Send message using RTK Query mutation
      const response = await sendMessageMutation({
        conversationId: conversation.id,
        content: messageContent,
        receiverId: conversation.participant.id,
        messageType: 'text',
      }).unwrap();

      // Broadcast message through Socket.IO for real-time delivery
      if (response.success && response.data) {
        await sendMessage(response.data, userId, userName);
      }

      // Refetch messages to get the latest data
      refetchMessages();

      // Scroll to bottom after sending
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message content on error
      setNewMessage(messageContent);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string | undefined) => {
    if (!timestamp) return 'Just now';

    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Just now';

      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Just now';
    }
  };

  const renderMessage = (msg: Message, index: number) => {
    if (!msg || (!msg.id && !msg._id)) return null;

    // Ensure proper comparison between sender ID and current user ID
    // Convert both to strings to handle ObjectId vs string comparison
    const msgSenderId = msg.senderId?.toString();

    // Get current user ID using only _id
    const currentUserId = user?._id?.toString() || '';

    const isOwn = msgSenderId === currentUserId;

    // Debug logging (remove in production)
    console.log('Message comparison:', {
      msgSenderId,
      currentUserId,
      isOwn,
      messageContent: msg.content?.substring(0, 20),
    });

    const messages = messagesData?.data || [];
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

    // Show avatar for first message in a sequence or different sender
    const showAvatar = !isOwn && (!prevMessage || prevMessage.senderId?.toString() !== msgSenderId);

    // Show sender name for first message from a sender or after a gap
    const showSenderName =
      !isOwn && (!prevMessage || prevMessage.senderId?.toString() !== msgSenderId);

    // Show timestamp for last message in sequence or different sender coming next
    const showTimestamp = !nextMessage || nextMessage.senderId?.toString() !== msgSenderId;

    // Get sender name
    const senderName = isOwn
      ? 'You'
      : msg.sender?.name || conversation.participant.name || 'Unknown';

    return (
      <div
        key={msg.id || msg._id || index}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
      >
        <div
          className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-3 max-w-[85%] sm:max-w-[75%]`}
        >
          {/* Avatar for received messages */}
          {!isOwn && (
            <div className='flex-shrink-0 w-10 h-10'>
              {showAvatar ? (
                <img
                  src={
                    msg.sender?.avatar ||
                    conversation.participant.avatar ||
                    '/images/default-avatar.png'
                  }
                  alt={senderName}
                  className='w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm'
                />
              ) : (
                <div className='w-10 h-10' /> // Spacer to maintain alignment
              )}
            </div>
          )}

          {/* Message content */}
          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} min-w-0 flex-1`}>
            {/* Sender name */}
            {showSenderName && (
              <div
                className={`text-xs font-medium mb-1 px-1 ${
                  isOwn ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                {senderName}
              </div>
            )}

            {/* Message bubble */}
            <div
              className={`px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 max-w-full ${
                isOwn
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
              }`}
            >
              <p className='text-sm leading-relaxed whitespace-pre-wrap break-words'>
                {msg.content}
              </p>
            </div>

            {/* Timestamp and status */}
            {showTimestamp && (
              <div
                className={`flex items-center mt-1 gap-1 px-1 ${
                  isOwn ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <span className='text-xs text-gray-500'>{formatMessageTime(msg.createdAt)}</span>
                {/* Message status for sent messages */}
                {isOwn && (
                  <div className='flex items-center'>
                    {msg.isRead ? (
                      <CheckCheck className='w-3 h-3 text-blue-500' />
                    ) : (
                      <Check className='w-3 h-3 text-gray-400' />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Avatar spacer for sent messages to maintain alignment */}
          {isOwn && <div className='flex-shrink-0 w-10 h-10' />}
        </div>
      </div>
    );
  };

  const messages = messagesData?.data || [];

  return (
    <div className='flex flex-col h-full w-full bg-gray-50'>
      {/* Header */}
      <div className='flex-shrink-0'>
        {/* Connection Status Bar */}
        {!isConnected && (
          <div className='px-4 py-2 bg-amber-100 border-b border-amber-200 text-amber-800 text-sm text-center'>
            <div className='flex items-center justify-center gap-2'>
              <Loader2 className='w-4 h-4 animate-spin' />
              Reconnecting...
            </div>
          </div>
        )}

        {/* Main Header */}
        <div className='flex items-center justify-between p-4 bg-white border-b border-gray-200'>
          <div className='flex items-center gap-3 min-w-0 flex-1'>
            {/* Avatar with status */}
            <div className='relative flex-shrink-0'>
              <img
                src={conversation.participant.avatar || '/images/default-avatar.png'}
                alt={conversation.participant.name}
                className='w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover'
              />
              <div
                className={`absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}
              />
            </div>

            <div className='min-w-0 flex-1'>
              <h3 className='font-semibold text-gray-900 text-base sm:text-lg truncate'>
                {conversation.participant.name}
              </h3>
              <div className='flex items-center gap-2 text-sm text-gray-500'>
                <div
                  className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}
                />
                <span className='hidden sm:inline'>{isConnected ? 'Online' : 'Offline'}</span>
                {typingUsers.length > 0 && (
                  <span className='text-blue-600 font-medium animate-pulse'>typing...</span>
                )}
              </div>
              {conversation.listing && (
                <div className='text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full mt-1 inline-block truncate max-w-full'>
                  📍 {conversation.listing.title}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className='flex items-center gap-1 flex-shrink-0'>
            <button className='p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors hidden sm:block'>
              <Phone className='w-5 h-5' />
            </button>
            <button className='p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors hidden sm:block'>
              <Video className='w-5 h-5' />
            </button>
            <button className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors'>
              <MoreVertical className='w-5 h-5' />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className='p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors'
              >
                <X className='w-5 h-5' />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className='flex-1 overflow-y-auto px-4 py-4'>
        {messagesLoading ? (
          <div className='flex justify-center items-center h-32'>
            <div className='flex items-center gap-2 text-gray-500'>
              <Loader2 className='w-5 h-5 animate-spin' />
              <span className='text-sm'>Loading messages...</span>
            </div>
          </div>
        ) : messages.length > 0 ? (
          <div className='space-y-1'>
            {messages.map((msg, index) => renderMessage(msg, index))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className='text-center text-gray-500 py-16'>
            <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Send className='w-8 h-8 text-gray-400' />
            </div>
            <p className='text-lg font-medium mb-2'>Start the conversation!</p>
            <p className='text-sm'>Send your first message to {conversation.participant.name}</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className='flex-shrink-0 border-t border-gray-200 bg-white p-4'>
        <div className='flex items-end gap-2 sm:gap-3'>
          {/* Attachment button */}
          <button className='p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0'>
            <Paperclip className='w-5 h-5' />
          </button>

          {/* Message input */}
          <div className='flex-1 relative'>
            <div className='flex items-end bg-gray-50 rounded-2xl border border-gray-300 focus-within:border-blue-500 focus-within:bg-white transition-all duration-200'>
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyPress}
                placeholder={`Message ${conversation.participant.name}...`}
                className='flex-1 px-4 py-3 bg-transparent resize-none focus:outline-none text-sm placeholder-gray-500 max-h-32 min-h-[48px]'
                disabled={!isConnected || isSending}
                rows={1}
              />

              <button className='p-2 text-gray-400 hover:text-yellow-500 transition-colors flex-shrink-0'>
                <Smile className='w-5 h-5' />
              </button>
            </div>

            {/* Character count */}
            {newMessage.length > 0 && (
              <div className='absolute -bottom-6 right-0 text-xs text-gray-400'>
                {newMessage.length}/1000
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={!isConnected || !newMessage.trim() || isSending}
            className={`p-3 rounded-full transition-all duration-200 flex-shrink-0 ${
              isConnected && newMessage.trim() && !isSending
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSending ? (
              <Loader2 className='w-5 h-5 animate-spin' />
            ) : (
              <Send className='w-5 h-5' />
            )}
          </button>
        </div>

        {/* Status messages */}
        {!isConnected && (
          <div className='text-xs text-amber-600 mt-2 flex items-center gap-2'>
            <div className='w-2 h-2 bg-amber-500 rounded-full animate-pulse' />
            Connection lost. Messages will be sent when reconnected.
          </div>
        )}

        {isSending && (
          <div className='text-xs text-blue-600 mt-2 flex items-center gap-2'>
            <Loader2 className='w-3 h-3 animate-spin' />
            Sending message...
          </div>
        )}
      </div>
    </div>
  );
};
