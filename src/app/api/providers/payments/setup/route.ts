import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { StripeAccount } from '@/models/StripePayment';
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

    await connectDB();

    // Check if user already has a Stripe account
    const existingAccount = await StripeAccount.findOne({ providerId: user._id });
    if (existingAccount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stripe account already exists for this provider',
        },
        { status: 400 }
      );
    }

    try {
      // Create Stripe connected account
      const stripeAccount = await stripeHelpers.createConnectedAccount(user._id, user.email, 'IN');

      // Save account to database
      const newStripeAccount = new StripeAccount({
        providerId: user._id,
        stripeAccountId: stripeAccount.id,
        accountStatus: 'pending',
        chargesEnabled: stripeAccount.charges_enabled,
        payoutsEnabled: stripeAccount.payouts_enabled,
        detailsSubmitted: stripeAccount.details_submitted,
        requiresVerification: true,
        requirements: {
          currentlyDue: stripeAccount.requirements?.currently_due || [],
          eventuallyDue: stripeAccount.requirements?.eventually_due || [],
          pastDue: stripeAccount.requirements?.past_due || [],
        },
      });

      await newStripeAccount.save();

      // Create onboarding link
      const refreshUrl = `${process.env.NEXTAUTH_URL}/provider/payments/setup?refresh=true`;
      const returnUrl = `${process.env.NEXTAUTH_URL}/provider/payments?setup=complete`;

      const accountLink = await stripeHelpers.createAccountLink(
        stripeAccount.id,
        refreshUrl,
        returnUrl
      );

      return NextResponse.json({
        success: true,
        data: {
          accountId: stripeAccount.id,
          onboardingUrl: accountLink.url,
        },
      });
    } catch (stripeError: any) {
      console.error('Stripe account creation error:', stripeError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create Stripe account',
          details: stripeError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Stripe setup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to setup payments' },
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

    const stripeAccount = await StripeAccount.findOne({ providerId: user._id });

    if (!stripeAccount) {
      return NextResponse.json({
        success: true,
        data: {
          hasAccount: false,
        },
      });
    }

    try {
      // Get fresh account data from Stripe
      const account = await stripeHelpers.getAccount(stripeAccount.stripeAccountId);

      // Update local record with fresh data
      stripeAccount.accountStatus = account.charges_enabled ? 'enabled' : 'pending';
      stripeAccount.chargesEnabled = account.charges_enabled;
      stripeAccount.payoutsEnabled = account.payouts_enabled;
      stripeAccount.detailsSubmitted = account.details_submitted;
      stripeAccount.requiresVerification = (account.requirements?.currently_due?.length || 0) > 0;
      stripeAccount.requirements = {
        currentlyDue: account.requirements?.currently_due || [],
        eventuallyDue: account.requirements?.eventually_due || [],
        pastDue: account.requirements?.past_due || [],
      };

      await stripeAccount.save();

      return NextResponse.json({
        success: true,
        data: {
          hasAccount: true,
          accountId: stripeAccount.stripeAccountId,
          accountStatus: stripeAccount.accountStatus,
          chargesEnabled: stripeAccount.chargesEnabled,
          payoutsEnabled: stripeAccount.payoutsEnabled,
          detailsSubmitted: stripeAccount.detailsSubmitted,
          requiresVerification: stripeAccount.requiresVerification,
          requirements: stripeAccount.requirements,
        },
      });
    } catch (stripeError: any) {
      console.error('Stripe account fetch error:', stripeError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch Stripe account details',
          details: stripeError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Get stripe setup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get payment setup status' },
      { status: 500 }
    );
  }
}
