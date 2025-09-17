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

    // In production, you would query a Bookings collection
    // For now, return realistic mock data
    const titles = ['Modern Private Room', 'Cozy Studio', 'Shared Space Near Metro', 'Luxury Apartment', 'Budget Friendly Room'];
    const providers = ['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Alice Brown', 'David Lee'];
    const statuses = ['pending', 'approved', 'rejected'];

    const bookings = Array.from({ length: Math.floor(Math.random() * 4) + 2 }, (_, i) => {
      const requestDate = new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000);
      const moveInDate = new Date(requestDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      return {
        id: i + 1,
        title: titles[Math.floor(Math.random() * titles.length)],
        provider: providers[Math.floor(Math.random() * providers.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        requestDate: requestDate.toISOString().split('T')[0],
        moveInDate: moveInDate.toISOString().split('T')[0],
        price: Math.floor(Math.random() * 15000) + 5000 // 5000-20000
      };
    });

    return NextResponse.json({
      success: true,
      data: bookings
    });

  } catch (error) {
    console.error('Get seeker bookings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get seeker bookings' },
      { status: 500 }
    );
  }
}
