import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { Notification } from '@/models/Notification';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get actual unread notification count from database
    const count = await (Notification as any).getUnreadCount(user._id);

    return NextResponse.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Get notifications count error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get notifications count' },
      { status: 500 }
    );
  }
}
