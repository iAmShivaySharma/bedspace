import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';

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

    // For now, return mock data based on user role
    // In production, you would query a Notifications collection
    let count = 0;

    switch (user.role) {
      case 'admin':
        // Admin might have provider verification notifications
        count = Math.floor(Math.random() * 5); // 0-4 notifications
        break;
      case 'provider':
        // Provider might have booking requests, reviews, etc.
        count = Math.floor(Math.random() * 3); // 0-2 notifications
        break;
      case 'seeker':
        // Seeker might have booking confirmations, new listings, etc.
        count = Math.floor(Math.random() * 4); // 0-3 notifications
        break;
      default:
        count = 0;
    }

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
