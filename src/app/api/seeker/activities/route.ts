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

    // In production, you would query an Activities collection
    // For now, return realistic mock data
    const activities = [
      {
        id: 1,
        type: 'search',
        title: `Searched for "Private room in ${['Bandra', 'Andheri', 'Powai', 'Thane'][Math.floor(Math.random() * 4)]}"`,
        time: `${Math.floor(Math.random() * 12) + 1} hours ago`,
        icon: 'Search',
        color: 'text-blue-500',
      },
      {
        id: 2,
        type: 'favorite',
        title: `Added "${['Cozy Studio', 'Modern Room', 'Shared Space', 'Private Apartment'][Math.floor(Math.random() * 4)]}" to favorites`,
        time: `${Math.floor(Math.random() * 3) + 1} day${Math.floor(Math.random() * 3) + 1 > 1 ? 's' : ''} ago`,
        icon: 'Heart',
        color: 'text-red-500',
      },
      {
        id: 3,
        type: 'booking',
        title: `Booking request sent to ${['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Alice Brown'][Math.floor(Math.random() * 4)]}`,
        time: `${Math.floor(Math.random() * 5) + 2} days ago`,
        icon: 'Calendar',
        color: 'text-green-500',
      },
      {
        id: 4,
        type: 'message',
        title: `New message from ${['Provider', 'Landlord', 'Property Manager'][Math.floor(Math.random() * 3)]}`,
        time: `${Math.floor(Math.random() * 7) + 1} days ago`,
        icon: 'MessageCircle',
        color: 'text-purple-500',
      },
    ];

    // Randomize the order and take first 4
    const shuffled = activities.sort(() => 0.5 - Math.random()).slice(0, 4);

    return NextResponse.json({
      success: true,
      data: shuffled,
    });
  } catch (error) {
    console.error('Get seeker activities error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get seeker activities' },
      { status: 500 }
    );
  }
}
