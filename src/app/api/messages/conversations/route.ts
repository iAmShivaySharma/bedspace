import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import { logApiRequest, logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    logApiRequest('GET', '/api/messages/conversations', undefined, 200, Date.now() - startTime);

    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const { user } = authResult;
    await connectDB();

    // Mock conversations data - in real implementation, you'd have a Messages/Conversations model
    const mockConversations = [
      {
        id: 'conv_001',
        participant: {
          id: 'user_002',
          name: 'Rajesh Kumar',
          avatar: '/images/avatar-1.jpg',
          role: 'provider'
        },
        lastMessage: {
          content: 'The room is available from next month. Would you like to schedule a visit?',
          createdAt: '2024-01-20T15:30:00Z',
          senderId: 'user_002'
        },
        unreadCount: 2,
        messages: [
          {
            id: 'msg_001',
            content: 'Hi, I\'m interested in your listing in Bandra West.',
            senderId: user.id,
            receiverId: 'user_002',
            createdAt: '2024-01-20T14:00:00Z',
            isRead: true
          },
          {
            id: 'msg_002',
            content: 'Hello! Thank you for your interest. The room is currently available.',
            senderId: 'user_002',
            receiverId: user.id,
            createdAt: '2024-01-20T14:15:00Z',
            isRead: true
          },
          {
            id: 'msg_003',
            content: 'Great! Can you tell me more about the amenities and nearby facilities?',
            senderId: user.id,
            receiverId: 'user_002',
            createdAt: '2024-01-20T14:30:00Z',
            isRead: true
          },
          {
            id: 'msg_004',
            content: 'The room comes with AC, WiFi, and kitchen access. There\'s a metro station 5 minutes away.',
            senderId: 'user_002',
            receiverId: user.id,
            createdAt: '2024-01-20T15:00:00Z',
            isRead: false
          },
          {
            id: 'msg_005',
            content: 'The room is available from next month. Would you like to schedule a visit?',
            senderId: 'user_002',
            receiverId: user.id,
            createdAt: '2024-01-20T15:30:00Z',
            isRead: false
          }
        ]
      },
      {
        id: 'conv_002',
        participant: {
          id: 'user_003',
          name: 'Priya Sharma',
          avatar: '/images/avatar-2.jpg',
          role: 'provider'
        },
        lastMessage: {
          content: 'Thank you for your interest. I\'ll get back to you soon.',
          createdAt: '2024-01-19T11:20:00Z',
          senderId: 'user_003'
        },
        unreadCount: 0,
        messages: [
          {
            id: 'msg_006',
            content: 'Hi, is the shared room in Andheri still available?',
            senderId: user.id,
            receiverId: 'user_003',
            createdAt: '2024-01-19T10:00:00Z',
            isRead: true
          },
          {
            id: 'msg_007',
            content: 'Yes, it is! Would you like to know more details?',
            senderId: 'user_003',
            receiverId: user.id,
            createdAt: '2024-01-19T10:30:00Z',
            isRead: true
          },
          {
            id: 'msg_008',
            content: 'What are the house rules and what\'s included in the rent?',
            senderId: user.id,
            receiverId: 'user_003',
            createdAt: '2024-01-19T11:00:00Z',
            isRead: true
          },
          {
            id: 'msg_009',
            content: 'Thank you for your interest. I\'ll get back to you soon.',
            senderId: 'user_003',
            receiverId: user.id,
            createdAt: '2024-01-19T11:20:00Z',
            isRead: true
          }
        ]
      },
      {
        id: 'conv_003',
        participant: {
          id: 'user_004',
          name: 'Amit Patel',
          avatar: '/images/avatar-3.jpg',
          role: 'provider'
        },
        lastMessage: {
          content: 'The studio apartment has been booked. Thank you!',
          createdAt: '2024-01-18T16:45:00Z',
          senderId: 'user_004'
        },
        unreadCount: 0,
        messages: [
          {
            id: 'msg_010',
            content: 'Hello, I\'m interested in the luxury studio in Powai.',
            senderId: user.id,
            receiverId: 'user_004',
            createdAt: '2024-01-18T15:00:00Z',
            isRead: true
          },
          {
            id: 'msg_011',
            content: 'Hi! The studio is beautiful and fully furnished. When are you looking to move in?',
            senderId: 'user_004',
            receiverId: user.id,
            createdAt: '2024-01-18T15:30:00Z',
            isRead: true
          },
          {
            id: 'msg_012',
            content: 'I\'m looking to move in next month. Is it still available?',
            senderId: user.id,
            receiverId: 'user_004',
            createdAt: '2024-01-18T16:00:00Z',
            isRead: true
          },
          {
            id: 'msg_013',
            content: 'The studio apartment has been booked. Thank you!',
            senderId: 'user_004',
            receiverId: user.id,
            createdAt: '2024-01-18T16:45:00Z',
            isRead: true
          }
        ]
      }
    ];

    const responseTime = Date.now() - startTime;
    console.log(`✅ GET /api/messages/conversations completed in ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      data: mockConversations
    });

  } catch (error) {
    logError('Error in GET /api/messages/conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
