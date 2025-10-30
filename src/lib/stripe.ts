import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {});

export default stripe;

// Stripe helper functions
export const stripeHelpers = {
  // Create a connected account for providers
  createConnectedAccount: async (providerId: string, email: string, country: string = 'IN') => {
    return await stripe.accounts.create({
      type: 'express',
      country,
      email,
      metadata: {
        providerId,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
  },

  // Create account link for onboarding
  createAccountLink: async (accountId: string, refreshUrl: string, returnUrl: string) => {
    return await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
  },

  // Get account details
  getAccount: async (accountId: string) => {
    return await stripe.accounts.retrieve(accountId);
  },

  // Create payment intent for booking
  createPaymentIntent: async (params: {
    amount: number;
    currency: string;
    connectedAccountId: string;
    applicationFeeAmount: number;
    metadata: Record<string, string>;
  }) => {
    const { amount, currency, connectedAccountId, applicationFeeAmount, metadata } = params;

    return await stripe.paymentIntents.create({
      amount,
      currency,
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: connectedAccountId,
      },
      metadata,
    });
  },

  // Confirm payment intent
  confirmPaymentIntent: async (paymentIntentId: string, paymentMethod: string) => {
    return await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethod,
    });
  },

  // Create a transfer to connected account
  createTransfer: async (params: {
    amount: number;
    currency: string;
    destination: string;
    metadata?: Record<string, string>;
  }) => {
    return await stripe.transfers.create(params);
  },

  // Get balance for connected account
  getBalance: async (accountId: string) => {
    return await stripe.balance.retrieve({
      stripeAccount: accountId,
    });
  },

  // Create payout for connected account
  createPayout: async (params: {
    amount: number;
    currency: string;
    method: 'standard' | 'instant';
    accountId: string;
    metadata?: Record<string, string>;
  }) => {
    const { accountId, ...payoutParams } = params;
    return await stripe.payouts.create(payoutParams, {
      stripeAccount: accountId,
    });
  },

  // List transactions for connected account
  listTransactions: async (params: {
    accountId: string;
    limit?: number;
    startingAfter?: string;
    endingBefore?: string;
  }) => {
    const { accountId, ...listParams } = params;
    return await stripe.balanceTransactions.list(listParams, {
      stripeAccount: accountId,
    });
  },

  // List payouts for connected account
  listPayouts: async (params: {
    accountId: string;
    limit?: number;
    startingAfter?: string;
    endingBefore?: string;
  }) => {
    const { accountId, ...listParams } = params;
    return await stripe.payouts.list(listParams, {
      stripeAccount: accountId,
    });
  },

  // Get payment intent
  getPaymentIntent: async (paymentIntentId: string) => {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  },

  // Cancel payment intent
  cancelPaymentIntent: async (paymentIntentId: string) => {
    return await stripe.paymentIntents.cancel(paymentIntentId);
  },

  // Calculate application fee (platform fee) - now supports dynamic commission
  calculateApplicationFee: (amount: number, feePercentage?: number) => {
    // If no fee percentage provided, it will be fetched from settings in the calling function
    const fee = feePercentage ?? 3; // Fallback to 3% if not provided
    return Math.round((amount * fee) / 100);
  },

  // Convert amount to Stripe format (smallest currency unit)
  toStripeAmount: (amount: number) => {
    return Math.round(amount * 100); // Convert to paise for INR
  },

  // Convert from Stripe format to regular amount
  fromStripeAmount: (amount: number) => {
    return amount / 100; // Convert from paise to rupees
  },
};

// Webhook signature verification
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  endpointSecret: string
) => {
  return stripe.webhooks.constructEvent(payload, signature, endpointSecret);
};
