import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { BookingRequest } from '@/models/Booking';
import { PaymentIntent } from '@/models/StripePayment';
import { stripeHelpers } from '@/lib/stripe';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { success: false, error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get payment intent from database
    const dbPaymentIntent = await PaymentIntent.findOne({
      stripePaymentIntentId: paymentIntentId,
      seekerId: user._id,
    }).populate('bookingId');

    if (!dbPaymentIntent) {
      return NextResponse.json(
        { success: false, error: 'Payment intent not found' },
        { status: 404 }
      );
    }

    // Get latest status from Stripe
    const stripePaymentIntent = await stripeHelpers.getPaymentIntent(paymentIntentId);

    // Update database with latest status
    dbPaymentIntent.status = stripePaymentIntent.status;
    await dbPaymentIntent.save();

    // Update booking status based on payment status
    const booking = await BookingRequest.findById(dbPaymentIntent.bookingId);
    if (booking && stripePaymentIntent.status === 'succeeded') {
      booking.status = 'pending'; // Pending provider approval
      await booking.save();
    }

    logger.info('Payment status checked', {
      userId: user._id,
      paymentIntentId,
      status: stripePaymentIntent.status,
      bookingId: dbPaymentIntent.bookingId,
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentIntentId,
        status: stripePaymentIntent.status,
        amount: stripeHelpers.fromStripeAmount(dbPaymentIntent.amount),
        booking: booking
          ? {
              id: booking._id,
              status: booking.status,
            }
          : null,
      },
    });
  } catch (error: any) {
    logger.error('Confirm payment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}
