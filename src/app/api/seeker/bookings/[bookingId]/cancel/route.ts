import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { BookingRequest } from '@/models/Booking';

interface RouteParams {
  params: {
    bookingId: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { bookingId } = params;

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

    const body = await request.json();
    const { reason } = body;

    await connectDB();

    // Find booking and verify it belongs to the current seeker
    const booking = await BookingRequest.findById(bookingId);

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (booking.seekerId.toString() !== user._id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to cancel this booking' },
        { status: 403 }
      );
    }

    // Check if booking can be cancelled
    if (booking.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Only pending bookings can be cancelled' },
        { status: 400 }
      );
    }

    // Cancel booking
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = user._id;
    booking.cancellationReason = reason || 'Cancelled by seeker';

    await booking.save();

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
