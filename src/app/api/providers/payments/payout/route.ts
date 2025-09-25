import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { StripeAccount, Payout } from '@/models/StripePayment';
import { requireProviderVerification } from '@/middleware/verification';
import { authenticate } from '@/middleware/auth';
import { stripeHelpers } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    // Check provider verification
    const verificationError = await requireProviderVerification(request);
    if (verificationError) return verificationError;

    // Get authenticated user
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, method = 'standard' } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payout amount',
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Get provider's Stripe account
    const stripeAccount = await StripeAccount.findOne({ providerId: user._id });

    if (!stripeAccount || !stripeAccount.payoutsEnabled) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stripe account not found or payouts not enabled',
        },
        { status: 400 }
      );
    }

    try {
      // Check available balance
      const balance = await stripeHelpers.getBalance(stripeAccount.stripeAccountId);
      const availableAmount = stripeHelpers.fromStripeAmount(
        balance.available.reduce((sum, item) => sum + item.amount, 0)
      );

      if (amount > availableAmount) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient balance. Available: ₹${availableAmount.toLocaleString()}`,
          },
          { status: 400 }
        );
      }

      // Create payout through Stripe
      const stripePayout = await stripeHelpers.createPayout({
        amount: stripeHelpers.toStripeAmount(amount),
        currency: 'inr',
        method,
        accountId: stripeAccount.stripeAccountId,
        metadata: {
          providerId: user._id,
          requestedBy: user.name,
        },
      });

      // Save payout record to database
      const payout = new Payout({
        stripePayoutId: stripePayout.id,
        providerId: user._id,
        amount,
        currency: stripePayout.currency,
        status: stripePayout.status,
        method,
        arrival_date: new Date(stripePayout.arrival_date * 1000),
        description: `Payout to ${user.name}`,
      });

      await payout.save();

      return NextResponse.json({
        success: true,
        message: 'Payout requested successfully',
        data: {
          payoutId: stripePayout.id,
          amount,
          status: stripePayout.status,
          arrivalDate: new Date(stripePayout.arrival_date * 1000),
          method,
        },
      });
    } catch (stripeError: any) {
      console.error('Stripe payout error:', stripeError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to process payout request',
          details: stripeError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Payout request error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to request payout' },
      { status: 500 }
    );
  }
}

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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get payout history from database
    const payouts = await Payout.find({ providerId: user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Payout.countDocuments({ providerId: user._id });

    return NextResponse.json({
      success: true,
      data: payouts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get payouts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payout history' },
      { status: 500 }
    );
  }
}
