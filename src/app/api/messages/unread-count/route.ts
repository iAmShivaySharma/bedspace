import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthenticatedUser } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { Message } from '@/models/Message';
import { logApiRequest, logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      logApiRequest('GET', '/api/messages/unread-count', undefined, 401, Date.now() - startTime);
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    }

    const user = authResult.user as AuthenticatedUser;
    await connectDB();

    // Count unread messages for the current user
    const unreadCount = await Message.countDocuments({
      receiverId: user.id,
      isRead: false,
    });

    logApiRequest('GET', '/api/messages/unread-count', user.id, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: { count: unreadCount },
    });
  } catch (error) {
    logError('Error in GET /api/messages/unread-count:', error);
    logApiRequest('GET', '/api/messages/unread-count', undefined, 500, Date.now() - startTime);
    return NextResponse.json(
      { success: false, error: 'Failed to get unread message count' },
      { status: 500 }
    );
  }
}
