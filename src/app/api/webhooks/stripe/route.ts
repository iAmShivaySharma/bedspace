import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyWebhookSignature } from '@/lib/stripe';
import { StripeAccount, PaymentIntent, Transfer, Payout } from '@/models/StripePayment';
import { BookingRequest } from '@/models/Booking';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing webhook secret configuration' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = verifyWebhookSignature(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    await connectDB();

    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'transfer.created':
        await handleTransferCreated(event.data.object as Stripe.Transfer);
        break;

      case 'transfer.updated':
        await handleTransferUpdated(event.data.object as Stripe.Transfer);
        break;

      case 'payout.created':
        await handlePayoutCreated(event.data.object as Stripe.Payout);
        break;

      case 'payout.updated':
        await handlePayoutUpdated(event.data.object as Stripe.Payout);
        break;

      case 'payout.paid':
        await handlePayoutPaid(event.data.object as Stripe.Payout);
        break;

      case 'payout.failed':
        await handlePayoutFailed(event.data.object as Stripe.Payout);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Handler functions
async function handleAccountUpdated(account: Stripe.Account) {
  console.log('Account updated:', account.id);

  const stripeAccount = await StripeAccount.findOne({ stripeAccountId: account.id });
  if (!stripeAccount) {
    console.log('No local account found for:', account.id);
    return;
  }

  // Update account status
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
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);

  const payment = await PaymentIntent.findOne({ stripePaymentIntentId: paymentIntent.id });
  if (!payment) {
    console.log('No local payment found for:', paymentIntent.id);
    return;
  }

  // Update payment status
  payment.status = 'succeeded';
  await payment.save();

  // Update booking status to approved if this was a booking payment
  if (payment.bookingId) {
    const booking = await BookingRequest.findById(payment.bookingId);
    if (booking && booking.status === 'pending') {
      booking.status = 'approved';
      booking.respondedAt = new Date();
      booking.responseMessage = 'Payment received - booking confirmed';
      await booking.save();
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id);

  const payment = await PaymentIntent.findOne({ stripePaymentIntentId: paymentIntent.id });
  if (!payment) {
    console.log('No local payment found for:', paymentIntent.id);
    return;
  }

  // Update payment status
  payment.status = 'canceled';
  await payment.save();

  // Update booking status to rejected if this was a booking payment
  if (payment.bookingId) {
    const booking = await BookingRequest.findById(payment.bookingId);
    if (booking && booking.status === 'pending') {
      booking.status = 'rejected';
      booking.respondedAt = new Date();
      booking.responseMessage = 'Payment failed - booking rejected';
      await booking.save();
    }
  }
}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  console.log('Transfer created:', transfer.id);

  // Find the payment intent this transfer is associated with
  const paymentIntent = await PaymentIntent.findOne({
    stripePaymentIntentId: transfer.source_transaction as string,
  });

  if (!paymentIntent) {
    console.log('No payment intent found for transfer:', transfer.id);
    return;
  }

  // Create transfer record
  const newTransfer = new Transfer({
    stripeTransferId: transfer.id,
    providerId: paymentIntent.providerId,
    paymentIntentId: paymentIntent._id,
    amount: transfer.amount / 100, // Convert from cents
    currency: transfer.currency,
    status: 'pending',
    destination: transfer.destination as string,
    description: transfer.description || 'Transfer to provider',
  });

  await newTransfer.save();
}

async function handleTransferUpdated(transfer: Stripe.Transfer) {
  console.log('Transfer updated:', transfer.id);

  const localTransfer = await Transfer.findOne({ stripeTransferId: transfer.id });
  if (!localTransfer) {
    console.log('No local transfer found for:', transfer.id);
    return;
  }

  // Update transfer status
  localTransfer.status = transfer.status || 'pending';
  await localTransfer.save();
}

async function handlePayoutCreated(payout: Stripe.Payout) {
  console.log('Payout created:', payout.id);

  // Find the stripe account this payout belongs to
  const stripeAccount = await StripeAccount.findOne({ stripeAccountId: payout.destination });
  if (!stripeAccount) {
    console.log('No stripe account found for payout:', payout.id);
    return;
  }

  // Check if we already have this payout recorded
  const existingPayout = await Payout.findOne({ stripePayoutId: payout.id });
  if (existingPayout) {
    return; // Already recorded
  }

  // Create payout record
  const newPayout = new Payout({
    stripePayoutId: payout.id,
    providerId: stripeAccount.providerId,
    amount: payout.amount / 100, // Convert from cents
    currency: payout.currency,
    status: payout.status,
    method: payout.method === 'instant' ? 'instant' : 'standard',
    arrival_date: new Date(payout.arrival_date * 1000),
    description: payout.description || 'Payout to bank account',
  });

  await newPayout.save();
}

async function handlePayoutUpdated(payout: Stripe.Payout) {
  console.log('Payout updated:', payout.id);

  const localPayout = await Payout.findOne({ stripePayoutId: payout.id });
  if (!localPayout) {
    console.log('No local payout found for:', payout.id);
    return;
  }

  // Update payout status
  localPayout.status = payout.status;
  localPayout.arrival_date = new Date(payout.arrival_date * 1000);
  await localPayout.save();
}

async function handlePayoutPaid(payout: Stripe.Payout) {
  console.log('Payout paid:', payout.id);

  const localPayout = await Payout.findOne({ stripePayoutId: payout.id });
  if (!localPayout) {
    console.log('No local payout found for:', payout.id);
    return;
  }

  // Update payout status
  localPayout.status = 'paid';
  await localPayout.save();
}

async function handlePayoutFailed(payout: Stripe.Payout) {
  console.log('Payout failed:', payout.id);

  const localPayout = await Payout.findOne({ stripePayoutId: payout.id });
  if (!localPayout) {
    console.log('No local payout found for:', payout.id);
    return;
  }

  // Update payout status
  localPayout.status = 'failed';
  localPayout.failure_code = payout.failure_code || undefined;
  localPayout.failure_message = payout.failure_message || undefined;
  await localPayout.save();
}
