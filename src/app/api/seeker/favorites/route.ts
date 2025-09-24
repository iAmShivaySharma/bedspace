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

    // In production, you would query a Favorites collection
    // For now, return realistic mock data
    const locations = ['Bandra West', 'Andheri East', 'Powai', 'Thane', 'Worli'];
    const titles = [
      'Modern Private Room',
      'Cozy Studio',
      'Shared Space Near Metro',
      'Luxury Apartment',
      'Budget Friendly Room',
    ];
    const providers = ['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Alice Brown', 'David Lee'];
    const amenitiesList = [
      ['wifi', 'ac', 'kitchen'],
      ['wifi', 'laundry', 'parking'],
      ['pool', 'gym', 'parking'],
      ['wifi', 'ac', 'security'],
      ['kitchen', 'laundry', 'wifi'],
    ];

    const favorites = Array.from({ length: Math.floor(Math.random() * 6) + 3 }, (_, i) => ({
      id: i + 1,
      title: titles[Math.floor(Math.random() * titles.length)],
      location: `${locations[Math.floor(Math.random() * locations.length)]}, Mumbai`,
      price: Math.floor(Math.random() * 15000) + 5000, // 5000-20000
      rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5-5.0
      provider: providers[Math.floor(Math.random() * providers.length)],
      amenities: amenitiesList[Math.floor(Math.random() * amenitiesList.length)],
      status: Math.random() > 0.8 ? 'booked' : 'available',
      savedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    }));

    return NextResponse.json({
      success: true,
      data: favorites,
    });
  } catch (error) {
    console.error('Get seeker favorites error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get seeker favorites' },
      { status: 500 }
    );
  }
}
