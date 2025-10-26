import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { BookingRequest } from '@/models/Booking';
import { Listing } from '@/models/Listing';
import { StripeAccount, PaymentIntent } from '@/models/StripePayment';
import { Settings } from '@/models/Settings';
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

    if (user.role !== 'seeker') {
      return NextResponse.json(
        { success: false, error: 'Only seekers can create payments' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { listingId, checkInDate, duration, notes } = body;

    if (!listingId || !checkInDate || !duration) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get listing details
    const listing = await Listing.findById(listingId).populate('providerId');
    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    if (!listing.isActive || !listing.isApproved) {
      return NextResponse.json(
        { success: false, error: 'Listing is not available for booking' },
        { status: 400 }
      );
    }

    // Check if provider has a Stripe account
    const providerStripeAccount = await StripeAccount.findOne({
      providerId: listing.providerId._id,
    });

    if (!providerStripeAccount || !providerStripeAccount.chargesEnabled) {
      return NextResponse.json(
        {
          success: false,
          error: 'Provider payment setup is not complete. Please contact the provider.',
        },
        { status: 400 }
      );
    }

    // Get platform commission from settings
    const settings = await (Settings as any).getSettings();
    const commissionPercentage = settings.booking?.bookingFee || 3;

    // Calculate amounts
    const monthlyRent = listing.rent;
    const securityDeposit = listing.securityDeposit || monthlyRent;
    const totalRent = monthlyRent * duration;
    const totalAmount = totalRent + securityDeposit;
    const applicationFeeAmount = stripeHelpers.calculateApplicationFee(
      totalAmount,
      commissionPercentage
    );

    // Check for existing pending booking
    const existingBooking = await BookingRequest.findOne({
      seekerId: user._id,
      listingId,
      status: { $in: ['pending', 'approved', 'pending_payment'] },
    });

    let booking;
    if (existingBooking) {
      // Update existing booking
      booking = existingBooking;
      booking.requestedDate = new Date(checkInDate);
      booking.message = notes?.trim() || booking.message;
      booking.status = 'pending_payment';
    } else {
      // Create new booking request
      booking = new BookingRequest({
        seekerId: user._id,
        providerId: listing.providerId._id,
        listingId,
        requestedDate: new Date(checkInDate),
        message: notes?.trim() || `Booking request for ${duration} month(s)`,
        status: 'pending_payment',
      });
    }

    await booking.save();

    // Create Stripe payment intent
    const paymentIntent = await stripeHelpers.createPaymentIntent({
      amount: stripeHelpers.toStripeAmount(totalAmount),
      currency: 'inr',
      connectedAccountId: providerStripeAccount.stripeAccountId,
      applicationFeeAmount: stripeHelpers.toStripeAmount(applicationFeeAmount),
      metadata: {
        bookingId: booking._id.toString(),
        seekerId: user._id,
        providerId: listing.providerId._id.toString(),
        listingId: listingId,
        type: 'booking',
        duration: duration.toString(),
        monthlyRent: monthlyRent.toString(),
        securityDeposit: securityDeposit.toString(),
      },
    });

    // Save payment intent to database
    const dbPaymentIntent = new PaymentIntent({
      stripePaymentIntentId: paymentIntent.id,
      bookingId: booking._id,
      seekerId: user._id,
      providerId: listing.providerId._id,
      listingId: listingId,
      amount: stripeHelpers.toStripeAmount(totalAmount),
      currency: 'inr',
      status: paymentIntent.status,
      paymentType: 'booking_fee',
      applicationFeeAmount: stripeHelpers.toStripeAmount(applicationFeeAmount),
      transferData: {
        destination: providerStripeAccount.stripeAccountId,
        amount: stripeHelpers.toStripeAmount(totalAmount - applicationFeeAmount),
      },
      metadata: paymentIntent.metadata || {},
      clientSecret: paymentIntent.client_secret || '',
    });

    await dbPaymentIntent.save();

    logger.info('Payment intent created successfully', {
      userId: user._id,
      bookingId: booking._id,
      listingId,
      totalAmount,
      paymentIntentId: paymentIntent.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: totalAmount,
        currency: 'inr',
        booking: {
          id: booking._id,
          status: booking.status,
          totalAmount,
          monthlyRent,
          securityDeposit,
          duration,
          checkInDate,
        },
      },
    });
  } catch (error: any) {
    logger.error('Create payment intent error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
