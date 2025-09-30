import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { BookingRequest } from '@/models/Booking';
import { requireProviderVerification } from '@/middleware/verification';
import { authenticate } from '@/middleware/auth';

interface RouteParams {
  params: {
    bookingId: string;
    action: 'approve' | 'reject';
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { bookingId, action } = params;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    // Check provider verification
    const verificationError = await requireProviderVerification(request);
    if (verificationError) return verificationError;

    // Get authenticated user
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { responseMessage } = body;

    await connectDB();

    // Find the booking and verify it belongs to the current provider
    const booking = await BookingRequest.findById(bookingId).exec();

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    // Verify the booking belongs to the current provider
    if (booking.providerId.toString() !== user._id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to modify this booking' },
        { status: 403 }
      );
    }

    // Check if booking is still pending
    if (booking.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Booking has already been processed' },
        { status: 400 }
      );
    }

    // Update booking status
    booking.status = action === 'approve' ? 'approved' : 'rejected';
    booking.responseMessage = responseMessage || '';
    booking.respondedAt = new Date();

    await booking.save();

    // Populate the updated booking for response
    const populatedBooking = await BookingRequest.findById(bookingId)
      .populate('seekerId', 'name email phone')
      .populate('listingId', 'title address rent')
      .exec();

    return NextResponse.json(
      {
        success: true,
        message: `Booking ${action}d successfully`,
        data: populatedBooking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Booking response error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process booking response' },
      { status: 500 }
    );
  }
}
