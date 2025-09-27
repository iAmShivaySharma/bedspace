import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthenticatedUser } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { Message, Conversation } from '@/models/Message';
import { logApiRequest, logError } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      logApiRequest(
        'GET',
        `/api/messages/${params.conversationId}`,
        undefined,
        401,
        Date.now() - startTime
      );
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    }

    const user = authResult.user as AuthenticatedUser;
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findById(params.conversationId);
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const isParticipant = conversation.participants.some((p: any) => p.toString() === user.id);
    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Get messages
    const messages = await Message.find({
      conversationId: params.conversationId,
      isDeleted: false,
    })
      .populate('senderId', 'name avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Message.countDocuments({
      conversationId: params.conversationId,
      isDeleted: false,
    });

    const transformedMessages = messages.map(message => ({
      id: message._id.toString(),
      conversationId: message.conversationId,
      senderId: message.senderId._id.toString(),
      receiverId: message.receiverId.toString(),
      content: message.content,
      messageType: message.messageType,
      isRead: message.isRead,
      createdAt: message.createdAt.toISOString(),
      sender: {
        id: message.senderId._id.toString(),
        name: message.senderId.name,
        avatar: message.senderId.avatar,
      },
    }));

    logApiRequest(
      'GET',
      `/api/messages/${params.conversationId}`,
      user.id,
      200,
      Date.now() - startTime
    );

    return NextResponse.json({
      success: true,
      data: transformedMessages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logError(`Error in GET /api/messages/${params.conversationId}:`, error);
    logApiRequest(
      'GET',
      `/api/messages/${params.conversationId}`,
      undefined,
      500,
      Date.now() - startTime
    );
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    }

    const user = authResult.user as AuthenticatedUser;
    await connectDB();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'read') {
      // Mark messages as read
      await Message.updateMany(
        {
          conversationId: params.conversationId,
          receiverId: user.id,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        }
      );

      logApiRequest(
        'PATCH',
        `/api/messages/${params.conversationId}`,
        user.id,
        200,
        Date.now() - startTime
      );

      return NextResponse.json({
        success: true,
        message: 'Messages marked as read',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logError(`Error in PATCH /api/messages/${params.conversationId}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to update messages' },
      { status: 500 }
    );
  }
}
