import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthenticatedUser } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { Message, Conversation } from '@/models/Message';
import { logApiRequest, logError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      logApiRequest('POST', '/api/messages', undefined, 401, Date.now() - startTime);
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    }

    const user = authResult.user as AuthenticatedUser;
    await connectDB();

    const body = await request.json();
    const { conversationId, content, messageType = 'text', receiverId } = body;

    if (!conversationId || !content || !receiverId) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID, content, and receiver ID are required' },
        { status: 400 }
      );
    }

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId).populate('participants');
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const isParticipant = conversation.participants.some((p: any) => p._id.toString() === user.id);
    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Create message
    const message = new Message({
      conversationId,
      senderId: user.id,
      receiverId,
      content: content.trim(),
      messageType,
    });

    await message.save();

    // Populate sender info
    await message.populate('senderId', 'name avatar');

    logApiRequest('POST', '/api/messages', user.id, 201, Date.now() - startTime);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: message._id,
          conversationId: message.conversationId,
          senderId: message.senderId._id,
          receiverId: message.receiverId,
          content: message.content,
          messageType: message.messageType,
          isRead: message.isRead,
          createdAt: message.createdAt.toISOString(),
          sender: {
            id: message.senderId._id,
            name: message.senderId.name,
            avatar: message.senderId.avatar,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logError('Error in POST /api/messages:', error);
    logApiRequest('POST', '/api/messages', undefined, 500, Date.now() - startTime);
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}
