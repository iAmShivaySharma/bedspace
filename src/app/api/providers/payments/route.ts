import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { StripeAccount, PaymentIntent, Transfer, Payout } from '@/models/StripePayment';
import { requireProviderVerification } from '@/middleware/verification';
import { authenticate } from '@/middleware/auth';
import { stripeHelpers } from '@/lib/stripe';

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
    const type = searchParams.get('type') || 'summary';

    // Get provider's Stripe account
    const stripeAccount = await StripeAccount.findOne({ providerId: user._id });

    if (!stripeAccount) {
      return NextResponse.json({
        success: true,
        data: {
          hasStripeAccount: false,
          accountStatus: null,
          balance: {
            available: 0,
            pending: 0,
          },
          earnings: {
            total: 0,
            thisMonth: 0,
            pending: 0,
          },
          transactions: [],
          payouts: [],
        },
      });
    }

    try {
      // Get real-time balance from Stripe
      const balance = await stripeHelpers.getBalance(stripeAccount.stripeAccountId);

      const availableBalance = balance.available.reduce((sum, item) => sum + item.amount, 0);
      const pendingBalance = balance.pending.reduce((sum, item) => sum + item.amount, 0);

      if (type === 'summary') {
        // Get payment summaries from database
        const [paymentIntents, transfers, payouts] = await Promise.all([
          PaymentIntent.find({ providerId: user._id }).sort({ createdAt: -1 }).limit(10),
          Transfer.find({ providerId: user._id }).sort({ createdAt: -1 }).limit(10),
          Payout.find({ providerId: user._id }).sort({ createdAt: -1 }).limit(10),
        ]);

        // Calculate earnings
        const totalEarnings = await PaymentIntent.aggregate([
          {
            $match: {
              providerId: user._id,
              status: 'succeeded',
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ]);

        // Calculate this month's earnings
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyEarnings = await PaymentIntent.aggregate([
          {
            $match: {
              providerId: user._id,
              status: 'succeeded',
              createdAt: { $gte: startOfMonth },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ]);

        const pendingEarnings = await PaymentIntent.aggregate([
          {
            $match: {
              providerId: user._id,
              status: { $in: ['requires_payment_method', 'requires_confirmation', 'processing'] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ]);

        return NextResponse.json({
          success: true,
          data: {
            hasStripeAccount: true,
            accountStatus: stripeAccount.accountStatus,
            chargesEnabled: stripeAccount.chargesEnabled,
            payoutsEnabled: stripeAccount.payoutsEnabled,
            balance: {
              available: stripeHelpers.fromStripeAmount(availableBalance),
              pending: stripeHelpers.fromStripeAmount(pendingBalance),
            },
            earnings: {
              total: stripeHelpers.fromStripeAmount(totalEarnings[0]?.total || 0),
              thisMonth: stripeHelpers.fromStripeAmount(monthlyEarnings[0]?.total || 0),
              pending: stripeHelpers.fromStripeAmount(pendingEarnings[0]?.total || 0),
            },
            recentPayments: paymentIntents.slice(0, 5),
            recentTransfers: transfers.slice(0, 5),
            recentPayouts: payouts.slice(0, 5),
          },
        });
      }

      if (type === 'transactions') {
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        // Get transactions from Stripe
        const stripeTransactions = await stripeHelpers.listTransactions({
          accountId: stripeAccount.stripeAccountId,
          limit,
        });

        // Also get our local payment records
        const localPayments = await PaymentIntent.find({ providerId: user._id })
          .populate('bookingId', 'message requestedDate')
          .populate('listingId', 'title address')
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip((page - 1) * limit);

        return NextResponse.json({
          success: true,
          data: {
            stripeTransactions: stripeTransactions.data,
            localPayments,
            hasMore: stripeTransactions.has_more,
          },
        });
      }

      if (type === 'payouts') {
        // Get payouts from Stripe
        const stripePayouts = await stripeHelpers.listPayouts({
          accountId: stripeAccount.stripeAccountId,
          limit: 20,
        });

        return NextResponse.json({
          success: true,
          data: {
            payouts: stripePayouts.data,
            hasMore: stripePayouts.has_more,
          },
        });
      }
    } catch (stripeError: any) {
      console.error('Stripe API error:', stripeError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch payment data from Stripe',
          details: stripeError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid type parameter',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Get provider payments error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment data' },
      { status: 500 }
    );
  }
}
