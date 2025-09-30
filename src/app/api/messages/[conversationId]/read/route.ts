import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthenticatedUser } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { Message } from '@/models/Message';
import { logApiRequest, logError } from '@/lib/logger';

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

    // Mark messages as read
    const result = await Message.updateMany(
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
      `/api/messages/${params.conversationId}/read`,
      user.id,
      200,
      Date.now() - startTime
    );

    return NextResponse.json({
      success: true,
      message: 'Messages marked as read',
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    logError(`Error in PATCH /api/messages/${params.conversationId}/read:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
