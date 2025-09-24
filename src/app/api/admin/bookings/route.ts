import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const paymentStatus = searchParams.get('paymentStatus') || 'all';
    const search = searchParams.get('search') || '';

    // Get real users from database
    const seekers = await User.find({ role: 'seeker' }).select('name email phone').limit(15);
    const providers = await User.find({ role: 'provider' }).select('name email phone').limit(15);

    if (seekers.length === 0 || providers.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Generate mock bookings data (in production, this would come from a Bookings collection)
    const locations = [
      'Bandra West, Mumbai',
      'Andheri East, Mumbai',
      'Powai, Mumbai',
      'Thane West, Mumbai',
      'Worli, Mumbai',
      'Malad West, Mumbai',
    ];

    const titles = [
      'Modern Private Room with AC',
      'Cozy Shared Space Near Metro',
      'Luxury Studio Apartment',
      'Budget Friendly Room',
      'Spacious Private Room',
      'Furnished Shared Accommodation',
    ];

    const statuses = ['pending', 'approved', 'rejected', 'cancelled', 'completed'];
    const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

    // Create realistic bookings based on actual users
    const totalBookings = Math.min(30, seekers.length * 2); // Up to 2 bookings per seeker
    const mockBookings = Array.from({ length: totalBookings }, (_, i) => {
      const seeker = seekers[i % seekers.length];
      const provider = providers[Math.floor(Math.random() * providers.length)];

      // Create realistic booking dates
      const isHistorical = Math.random() < 0.4; // 40% historical bookings
      let checkInDate, checkOutDate;

      if (isHistorical) {
        // Historical booking (completed)
        checkInDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Last 90 days
        checkOutDate = new Date(
          checkInDate.getTime() + (Math.random() * 20 + 5) * 24 * 60 * 60 * 1000
        ); // 5-25 days stay
      } else {
        // Future booking
        checkInDate = new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000); // Next 60 days
        checkOutDate = new Date(
          checkInDate.getTime() + (Math.random() * 25 + 7) * 24 * 60 * 60 * 1000
        ); // 7-32 days stay
      }

      const duration = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const dailyRate = Math.floor(Math.random() * 8000) + 6000; // 6000-14000 per day (realistic Mumbai rates)
      const totalAmount = dailyRate * duration;

      // Determine status based on dates
      let bookingStatus;
      let paymentStat;

      if (isHistorical && checkOutDate < new Date()) {
        bookingStatus = 'completed';
        paymentStat = 'paid';
      } else if (checkInDate > new Date()) {
        bookingStatus = Math.random() < 0.8 ? 'approved' : 'pending';
        paymentStat = bookingStatus === 'approved' ? 'paid' : 'pending';
      } else {
        bookingStatus = statuses[Math.floor(Math.random() * statuses.length)];
        paymentStat = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
      }

      return {
        _id: `booking-${i + 1}`,
        seeker: {
          _id: seeker._id,
          name: seeker.name,
          email: seeker.email,
          phone: seeker.phone,
        },
        provider: {
          _id: provider._id,
          name: provider.name,
          email: provider.email,
          phone: provider.phone || `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        },
        listing: {
          _id: `listing-${Math.floor(Math.random() * 20) + 1}`,
          title: titles[Math.floor(Math.random() * titles.length)],
          location: locations[Math.floor(Math.random() * locations.length)],
          price: dailyRate,
        },
        status: bookingStatus,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate?.toISOString(),
        duration: duration,
        totalAmount: totalAmount,
        paymentStatus: paymentStat,
        createdAt: new Date(
          checkInDate.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000
        ).toISOString(), // Booked 0-14 days before check-in
        updatedAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(), // Updated in last 3 days
        notes: Math.random() > 0.7 ? 'Special requirements discussed with provider' : undefined,
      };
    });

    // Apply filters
    let filteredBookings = mockBookings;

    if (status !== 'all') {
      filteredBookings = filteredBookings.filter(booking => booking.status === status);
    }

    if (paymentStatus !== 'all') {
      filteredBookings = filteredBookings.filter(
        booking => booking.paymentStatus === paymentStatus
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredBookings = filteredBookings.filter(
        booking =>
          booking.seeker.name.toLowerCase().includes(searchLower) ||
          booking.provider.name.toLowerCase().includes(searchLower) ||
          booking.listing.title.toLowerCase().includes(searchLower) ||
          booking.listing.location.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    filteredBookings.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      data: filteredBookings,
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get bookings' }, { status: 500 });
  }
}
