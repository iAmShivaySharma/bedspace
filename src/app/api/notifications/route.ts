import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import { logApiRequest, logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      logApiRequest('GET', '/api/notifications', undefined, 401, Date.now() - startTime);
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // all, read, unread
    const category = searchParams.get('category') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    const user = authResult.user as { id: string; role: string };
    const skip = (page - 1) * limit;

    // Get notifications from database
    const notifications = await (Notification as any).getUserNotifications(user.id, {
      filter,
      category,
      limit,
      skip,
    });

    // Get total count for pagination
    const totalCount = await (Notification as any).getUnreadCount(
      user.id,
      category === 'all' ? undefined : category
    );

    // Transform to match expected format
    const transformedNotifications = notifications.map((notification: any) => ({
      id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      category: notification.category,
      isRead: notification.isRead,
      metadata: notification.metadata,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
    }));

    logApiRequest('GET', '/api/notifications', user.id, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: transformedNotifications,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    logError('Get notifications error', error, {
      url: request.url,
      method: 'GET',
    });

    logApiRequest('GET', '/api/notifications', undefined, 500, Date.now() - startTime);

    return NextResponse.json(
      { success: false, error: 'Failed to get notifications' },
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
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { title, message, type = 'info', category = 'system', metadata } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Title and message are required' },
        { status: 400 }
      );
    }

    const user = authResult.user as { id: string };

    // Create notification
    const notification = await (Notification as any).createNotification(
      user.id,
      title,
      message,
      type,
      category,
      metadata
    );

    logApiRequest('POST', '/api/notifications', user.id, 201, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        category: notification.category,
        isRead: notification.isRead,
        metadata: notification.metadata,
        createdAt: notification.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logError('Create notification error', error, {
      url: request.url,
      method: 'POST',
    });

    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { notificationIds } = body; // Array of notification IDs to mark as read

    const user = authResult.user as { id: string };

    // Mark notifications as read
    await (Notification as any).markAsRead(user.id, notificationIds);

    logApiRequest('PATCH', '/api/notifications', user.id, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read',
    });
  } catch (error) {
    logError('Mark notifications as read error', error, {
      url: request.url,
      method: 'PATCH',
    });

    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
