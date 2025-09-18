import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthenticatedUser } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import Activity from '@/models/Activity';
import { logApiRequest, logError } from '@/lib/logger';

interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      logApiRequest('GET', '/api/activities/recent', undefined, 401, Date.now() - startTime);
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const userRole = searchParams.get('userRole');
    const userId = searchParams.get('userId');

    // Build query based on user role and permissions
    const query: Record<string, unknown> = {};

    const user = authResult.user as AuthenticatedUser;
    if (user.role === 'admin') {
      // Admins can see all activities or filter by role/user
      if (userRole) {
        query.userRole = userRole;
      }
      if (userId) {
        query.userId = userId;
      }
    } else {
      // Regular users can only see their own activities
      query.userId = user.id;
    }

    // Get recent activities
    const activities = await Activity.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 50)) // Max 50 activities
      .lean();

    // Format activities for response
    const formattedActivities = activities.map(activity => ({
      id: activity._id,
      action: activity.action,
      description: activity.description,
      details: activity.details,
      user: activity.userId
        ? {
            id: (activity.userId as unknown as PopulatedUser)._id,
            name: (activity.userId as unknown as PopulatedUser).name,
            email: (activity.userId as unknown as PopulatedUser).email,
            role: (activity.userId as unknown as PopulatedUser).role,
          }
        : null,
      userRole: activity.userRole,
      ipAddress: activity.ipAddress,
      createdAt: activity.createdAt,
      timeAgo: getTimeAgo(activity.createdAt),
    }));

    logApiRequest('GET', '/api/activities/recent', user.id, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: formattedActivities,
      total: formattedActivities.length,
    });
  } catch (error) {
    logError('Get recent activities error', error, {
      url: request.url,
      method: 'GET',
    });

    logApiRequest('GET', '/api/activities/recent', undefined, 500, Date.now() - startTime);

    return NextResponse.json(
      { success: false, error: 'Failed to get recent activities' },
      { status: 500 }
    );
  }
}

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }

  return new Date(date).toLocaleDateString();
}
