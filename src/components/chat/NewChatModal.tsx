'use client';

import React, { useState } from 'react';
import { X, Search, User, Users } from 'lucide-react';
import { useCreateConversationMutation } from '@/lib/api/commonApi';
import { useAppSelector } from '@/lib/store/hooks';
import type { Conversation } from '@/types';

interface NewChatModalProps {
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
  listingId?: string;
  listingTitle?: string;
}

interface UserSearchResult {
  _id: string;
  name: string;
  email: string;
  role: 'seeker' | 'provider' | 'admin';
  avatar?: string;
  isVerified: boolean;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ onClose, onConversationCreated }) => {
  const { user } = useAppSelector(state => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [initialMessage, setInitialMessage] = useState('');

  const [createConversation, { isLoading: isCreating }] = useCreateConversationMutation();

  // Mock search function - in real app, this would call an API
  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Simulate API call - replace with actual search endpoint
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(term)}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter out current user
          const filteredResults = data.data.filter((u: UserSearchResult) => u._id !== user?.id);
          setSearchResults(filteredResults);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      // For demo purposes, show mock results
      const mockResults: UserSearchResult[] = [
        {
          _id: '1',
          name: 'John Provider',
          email: 'john@example.com',
          role: 'provider' as const,
          avatar: '/images/default-avatar.png',
          isVerified: true,
        },
        {
          _id: '2',
          name: 'Jane Seeker',
          email: 'jane@example.com',
          role: 'seeker' as const,
          isVerified: false,
        },
      ].filter(u => u.name.toLowerCase().includes(term.toLowerCase()));
      setSearchResults(mockResults);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!selectedUser) return;

    try {
      const result = await createConversation({
        participantId: selectedUser._id,
        initialMessage: initialMessage.trim() || undefined,
      }).unwrap();

      if (result.success && result.data) {
        onConversationCreated(result.data);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'provider':
        return <Users className='w-4 h-4' />;
      case 'admin':
        return (
          <div className='w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs'>
            A
          </div>
        );
      default:
        return <User className='w-4 h-4' />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'provider':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900'>Start New Conversation</h2>
          <button
            onClick={onClose}
            className='p-2 text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Search */}
        <div className='p-6 border-b border-gray-200'>
          <div className='relative'>
            <Search className='w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
            <input
              type='text'
              placeholder='Search users by name or email...'
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                handleSearch(e.target.value);
              }}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              autoFocus
            />
          </div>
        </div>

        {/* Search Results */}
        <div className='flex-1 overflow-y-auto'>
          {isSearching ? (
            <div className='p-6 text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto'></div>
              <p className='text-gray-500 mt-2'>Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className='p-4 space-y-2'>
              {searchResults.map(result => (
                <div
                  key={result._id}
                  onClick={() => setSelectedUser(result)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUser?._id === result._id
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <img
                    src={result.avatar || '/images/default-avatar.png'}
                    alt={result.name}
                    className='w-10 h-10 rounded-full mr-3'
                  />
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center'>
                      <h4 className='font-medium text-gray-900 truncate'>{result.name}</h4>
                      {result.isVerified && (
                        <div className='ml-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center'>
                          <svg
                            className='w-2 h-2 text-white'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path
                              fillRule='evenodd'
                              d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                              clipRule='evenodd'
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className='flex items-center mt-1'>
                      <p className='text-sm text-gray-600 truncate'>{result.email}</p>
                      <div className='ml-2 flex items-center'>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(result.role)}`}
                        >
                          <span className='mr-1'>{getRoleIcon(result.role)}</span>
                          {result.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm ? (
            <div className='p-6 text-center text-gray-500'>
              <Search className='w-12 h-12 mx-auto mb-4 text-gray-300' />
              <p>No users found for "{searchTerm}"</p>
            </div>
          ) : (
            <div className='p-6 text-center text-gray-500'>
              <User className='w-12 h-12 mx-auto mb-4 text-gray-300' />
              <p>Search for users to start a conversation</p>
            </div>
          )}
        </div>

        {/* Initial Message */}
        {selectedUser && (
          <div className='p-6 border-t border-gray-200'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Initial Message (Optional)
            </label>
            <textarea
              value={initialMessage}
              onChange={e => setInitialMessage(e.target.value)}
              placeholder='Type your first message...'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              rows={3}
            />
          </div>
        )}

        {/* Footer */}
        <div className='flex items-center justify-end space-x-3 p-6 border-t border-gray-200'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={handleCreateConversation}
            disabled={!selectedUser || isCreating}
            className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {isCreating ? 'Creating...' : 'Start Conversation'}
          </button>
        </div>
      </div>
    </div>
  );
};
