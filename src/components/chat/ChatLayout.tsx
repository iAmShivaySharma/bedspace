'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { NewChatModal } from './NewChatModal';
import { useGetConversationsQuery } from '@/lib/api/commonApi';
import type { Conversation } from '@/types';

interface ChatLayoutProps {
  defaultConversationId?: string;
  className?: string;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({
  defaultConversationId,
  className = '',
}) => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const searchParams = useSearchParams();
  const { data: conversationsData } = useGetConversationsQuery({ page: 1, limit: 50 });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle URL-based conversation selection
  useEffect(() => {
    const conversationId = searchParams.get('conversation') || defaultConversationId;
    if (conversationId && conversationsData?.data) {
      const conversation = conversationsData.data.find(c => c.id === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  }, [searchParams, defaultConversationId, conversationsData]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleCloseChat = () => {
    setSelectedConversation(null);
  };

  const handleNewChat = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowNewChatModal(false);
  };

  return (
    <div className={`flex h-full bg-gray-50 ${className}`}>
      {/* Conversations Sidebar */}
      <div
        className={`${
          isMobile && selectedConversation ? 'hidden' : 'flex'
        } w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white flex-shrink-0`}
      >
        <ConversationList
          onSelectConversation={handleSelectConversation}
          selectedConversationId={selectedConversation?.id}
          onStartNewChat={() => setShowNewChatModal(true)}
        />
      </div>

      {/* Chat Window */}
      <div className={`flex-1 ${!selectedConversation && !isMobile ? 'hidden md:flex' : 'flex'}`}>
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onClose={isMobile ? handleCloseChat : undefined}
          />
        ) : (
          <div className='flex-1 flex items-center justify-center bg-gray-50'>
            <div className='text-center text-gray-500'>
              <div className='w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center'>
                <svg
                  className='w-12 h-12 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.5}
                    d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>Welcome to Messages</h3>
              <p className='text-gray-500 mb-4'>
                Select a conversation to start messaging or create a new one.
              </p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
              >
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onConversationCreated={handleNewChat}
        />
      )}
    </div>
  );
};
