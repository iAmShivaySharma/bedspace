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

    if (user.role !== 'seeker') {
      return NextResponse.json(
        { success: false, error: 'Seeker access required' },
        { status: 403 }
      );
    }

    await connectDB();

    // In production, you would query actual collections
    // For now, return realistic mock data based on user activity
    const stats = {
      savedListings: Math.floor(Math.random() * 15) + 5, // 5-19
      activeBookings: Math.floor(Math.random() * 5) + 1, // 1-5
      messages: Math.floor(Math.random() * 10) + 2, // 2-11
      searchAlerts: Math.floor(Math.random() * 3) + 1 // 1-3
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get seeker stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get seeker stats' },
      { status: 500 }
    );
  }
}
