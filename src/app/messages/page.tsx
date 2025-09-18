'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Search, User, Clock } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    avatar?: string;
    role: 'seeker' | 'provider';
  };
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
  messages: Message[];
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/messages/conversations', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.data || []);
        if (data.data?.length > 0 && !selectedConversation) {
          setSelectedConversation(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: selectedConversation,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchConversations(); // Refresh conversations
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/messages/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentConversation = conversations.find(conv => conv.id === selectedConversation);

  if (loading) {
    return (
      <DashboardLayout title="Messages">
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            <Card className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2 animate-pulse">
              <CardContent className="p-4">
                <div className="h-full bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Messages">
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card>
            <CardContent className="p-4 h-full flex flex-col">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Messages</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No conversations yet</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => {
                        setSelectedConversation(conversation.id);
                        if (conversation.unreadCount > 0) {
                          markAsRead(conversation.id);
                        }
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation === conversation.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {conversation.participant.avatar ? (
                            <img
                              src={conversation.participant.avatar}
                              alt={conversation.participant.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-gray-900 truncate">
                              {conversation.participant.name}
                            </h3>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage.content}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2">
            <CardContent className="p-0 h-full flex flex-col">
              {currentConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {currentConversation.participant.avatar ? (
                          <img
                            src={currentConversation.participant.avatar}
                            alt={currentConversation.participant.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {currentConversation.participant.name}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {currentConversation.participant.role}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {currentConversation.messages.map((message) => {
                      const isOwn = message.senderId === 'current-user-id'; // Replace with actual user ID
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isOwn
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isOwn ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-1"
                      />
                      <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-gray-600">
                      Choose a conversation from the list to start messaging.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
