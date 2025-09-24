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

    // For now, return mock data based on user activity
    // In production, you would query a Messages collection
    let count = 0;

    switch (user.role) {
      case 'admin':
        // Admin might have fewer direct messages
        count = Math.floor(Math.random() * 2); // 0-1 messages
        break;
      case 'provider':
        // Provider might have more inquiries from seekers
        count = Math.floor(Math.random() * 6); // 0-5 messages
        break;
      case 'seeker':
        // Seeker might have responses from providers
        count = Math.floor(Math.random() * 4); // 0-3 messages
        break;
      default:
        count = 0;
    }

    return NextResponse.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Get unread messages count error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get unread messages count' },
      { status: 500 }
    );
  }
}
