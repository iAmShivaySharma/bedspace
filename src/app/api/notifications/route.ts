import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import { logApiRequest, logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Authenticate user
    const { user, error } = await authenticate(request);
    if (error || !user) {
      logApiRequest('GET', '/api/notifications', undefined, 401, Date.now() - startTime);
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // all, read, unread
    const category = searchParams.get('category') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    const skip = (page - 1) * limit;

    // Debug: Log user ID being used
    console.log('Fetching notifications for user:', user._id, 'with filters:', {
      filter,
      category,
      limit,
      skip,
    });

    // Get notifications from database
    const notifications = await (Notification as any).getUserNotifications(user._id, {
      filter,
      category,
      limit,
      skip,
    });

    console.log('Found notifications:', notifications.length);

    // Get total count for pagination
    const totalCount = await (Notification as any).getUnreadCount(
      user._id,
      category === 'all' ? undefined : category
    );

    console.log('Total count:', totalCount);

    // Transform to match expected format
    const transformedNotifications = notifications.map((notification: any) => ({
      _id: notification._id.toString(),
      userId: notification.userId.toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      category: notification.category,
      isRead: notification.isRead,
      data: notification.metadata,
      createdAt: notification.createdAt.toISOString(),
    }));

    logApiRequest('GET', '/api/notifications', user._id, 200, Date.now() - startTime);

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
    // Authenticate user
    const { user, error } = await authenticate(request);
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
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

    // Create notification
    const notification = await (Notification as any).createNotification(
      user._id,
      title,
      message,
      type,
      category,
      metadata
    );

    logApiRequest('POST', '/api/notifications', user._id, 201, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: {
        id: notification._id.toString(),
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
    // Authenticate user
    const { user, error } = await authenticate(request);
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { notificationIds } = body; // Array of notification IDs to mark as read

    // Mark notifications as read
    await (Notification as any).markAsRead(user._id, notificationIds);

    logApiRequest('PATCH', '/api/notifications', user._id, 200, Date.now() - startTime);

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
