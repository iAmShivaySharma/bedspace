import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import { logApiRequest, logError } from '@/lib/logger';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now();

  try {
    // Authenticate user
    const { user, error } = await authenticate(request);
    if (error || !user) {
      logApiRequest(
        'POST',
        `/api/notifications/${params.id}/read`,
        undefined,
        401,
        Date.now() - startTime
      );
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();
    const notificationId = params.id;

    // Find and update the notification
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId: user._id,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      logApiRequest(
        'POST',
        `/api/notifications/${params.id}/read`,
        user._id,
        404,
        Date.now() - startTime
      );
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    logApiRequest(
      'POST',
      `/api/notifications/${params.id}/read`,
      user._id,
      200,
      Date.now() - startTime
    );

    return NextResponse.json({
      success: true,
      data: {
        id: notification._id.toString(),
        isRead: notification.isRead,
        readAt: notification.readAt,
      },
    });
  } catch (error) {
    logError('Mark notification as read error', error, {
      url: request.url,
      method: 'POST',
      notificationId: params.id,
    });

    logApiRequest(
      'POST',
      `/api/notifications/${params.id}/read`,
      undefined,
      500,
      Date.now() - startTime
    );

    return NextResponse.json(
      { success: false, error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
