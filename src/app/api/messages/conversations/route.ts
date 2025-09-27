import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthenticatedUser } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { Conversation, Message } from '@/models/Message';
import { logApiRequest, logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      logApiRequest('GET', '/api/messages/conversations', undefined, 401, Date.now() - startTime);
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    }

    const user = authResult.user as AuthenticatedUser;
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1') || 1;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) || 20 : 20;

    console.log('Pagination params:', { page, limit, limitParam });

    // Get user conversations directly using find instead of aggregation
    console.log('Fetching conversations for user:', user.id);

    const conversations = await Conversation.find({
      participants: user.id,
      isActive: true,
    })
      .populate('participants', 'name avatar role email')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    console.log('Found conversations:', conversations.length);

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Transform conversations to match expected format
    const transformedConversations = await Promise.all(
      conversations.map(async (conversation: any) => {
        console.log('Processing conversation:', conversation._id);

        // Get the other participant (not the current user)
        const otherParticipant = conversation.participants?.find(
          (p: any) => p._id.toString() !== user.id
        );

        if (!otherParticipant) {
          console.log('No other participant found, skipping conversation:', conversation._id);
          return null;
        }

        // Get unread count for this conversation
        const unreadCount = await Message.countDocuments({
          conversationId: conversation._id,
          receiverId: user.id,
          isRead: false,
        });

        // Get recent messages for this conversation (last 5)
        const recentMessages = await Message.find({
          conversationId: conversation._id,
        })
          .populate('senderId', 'name avatar')
          .sort({ createdAt: -1 })
          .limit(5);

        return {
          id: conversation._id,
          participant: {
            id: otherParticipant._id,
            name: otherParticipant.name,
            avatar: otherParticipant.avatar || '/images/default-avatar.png',
            role: otherParticipant.role,
            email: otherParticipant.email,
          },
          lastMessage: conversation.lastMessage
            ? {
                content: conversation.lastMessage.content,
                createdAt: conversation.lastMessage.createdAt.toISOString(),
                senderId: conversation.lastMessage.senderId.toString(),
                type: conversation.lastMessage.type || 'text',
              }
            : null,
          unreadCount,
          messageCount: conversation.messageCount || 0,
          createdAt: conversation.createdAt.toISOString(),
          lastActivity: (conversation.lastMessageAt || conversation.updatedAt).toISOString(),
          listing: conversation.listingId
            ? {
                id: conversation.listingId,
                title: conversation.listingTitle,
              }
            : null,
          messages: recentMessages.reverse().map((message: any) => ({
            id: message._id,
            content: message.content,
            senderId: message.senderId._id.toString(),
            receiverId: message.receiverId.toString(),
            type: message.type,
            isRead: message.isRead,
            createdAt: message.createdAt.toISOString(),
            sender: {
              id: message.senderId._id,
              name: message.senderId.name,
              avatar: message.senderId.avatar,
            },
          })),
        };
      })
    );

    // Filter out null results from failed processing
    const validConversations = transformedConversations.filter(conv => conv !== null);

    logApiRequest('GET', '/api/messages/conversations', user.id, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: validConversations,
      pagination: {
        page,
        limit,
        total: validConversations.length,
      },
    });
  } catch (error: any) {
    logError('Error in GET /api/messages/conversations:', error);
    logApiRequest('GET', '/api/messages/conversations', undefined, 500, Date.now() - startTime);
    console.error('Detailed conversations error:', {
      error: error?.message || 'Unknown error',
      stack: error?.stack,
      url: request.url,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch conversations',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    }

    const user = authResult.user as AuthenticatedUser;
    await connectDB();

    const body = await request.json();
    const { participantId, initialMessage, listingId, listingTitle } = body;

    if (!participantId) {
      return NextResponse.json(
        { success: false, error: 'Participant ID is required' },
        { status: 400 }
      );
    }

    // Find or create conversation
    const conversation = await (Conversation as any).findOrCreate(
      user.id,
      participantId,
      listingId,
      listingTitle
    );

    // If there's an initial message, create it
    if (initialMessage && initialMessage.trim()) {
      const message = new Message({
        conversationId: conversation._id,
        senderId: user.id,
        receiverId: participantId,
        content: initialMessage,
        type: 'text',
        isRead: false,
      });

      await message.save();

      // Update conversation
      conversation.lastMessage = message._id;
      conversation.lastActivity = new Date();
      await conversation.save();
    }

    // Populate conversation for response
    await conversation.populate('participants', 'name avatar role email');

    const otherParticipant = conversation.participants.find(
      (p: any) => p._id.toString() !== user.id
    );

    logApiRequest('POST', '/api/messages/conversations', user.id, 201, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: {
        id: conversation._id,
        participant: {
          id: otherParticipant._id,
          name: otherParticipant.name,
          avatar: otherParticipant.avatar || '/images/default-avatar.png',
          role: otherParticipant.role,
          email: otherParticipant.email,
        },
        messageCount: conversation.messageCount,
        createdAt: conversation.createdAt.toISOString(),
        lastActivity: conversation.lastActivity.toISOString(),
      },
    });
  } catch (error) {
    logError('Error in POST /api/messages/conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
