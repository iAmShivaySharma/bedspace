import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { BookingRequest } from '@/models/Booking';
import { requireProviderVerification } from '@/middleware/verification';
import { authenticate } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Check provider verification
    const verificationError = await requireProviderVerification(request);
    if (verificationError) return verificationError;

    // Get authenticated user
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const query: any = {
      providerId: user._id, // Only get bookings for the current provider
    };
    if (status && status !== 'all') {
      query.status = status;
    }

    const bookings = await BookingRequest.find(query)
      .populate('seekerId', 'name email phone')
      .populate('listingId', 'title address rent')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await BookingRequest.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        data: bookings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get provider bookings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
