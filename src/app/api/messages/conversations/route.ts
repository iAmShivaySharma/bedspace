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
    const limit = parseInt(searchParams.get('limit') || '20') || 20;

    // Get user conversations with unread counts
    const conversations = await (Conversation as any).getUserConversations(user.id, page, limit);

    // Transform conversations to match expected format
    const transformedConversations = await Promise.all(
      conversations.map(async (conversation: any) => {
        // Get the other participant (not the current user)
        const otherParticipant = conversation.participants.find(
          (p: any) => p._id.toString() !== user.id
        );

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
          messageCount: conversation.messageCount,
          createdAt: conversation.createdAt.toISOString(),
          lastActivity: conversation.lastActivity.toISOString(),
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

    logApiRequest('GET', '/api/messages/conversations', user.id, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: transformedConversations,
      pagination: {
        page,
        limit,
        total: transformedConversations.length,
      },
    });
  } catch (error) {
    logError('Error in GET /api/messages/conversations:', error);
    logApiRequest('GET', '/api/messages/conversations', undefined, 500, Date.now() - startTime);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
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
