import mongoose, { Schema, Document } from 'mongoose';

export interface IStripeAccount extends Document {
  _id: string;
  providerId: mongoose.Types.ObjectId;
  stripeAccountId: string;
  accountStatus: 'pending' | 'restricted' | 'enabled';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requiresVerification: boolean;
  requirements: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentIntent extends Document {
  _id: string;
  stripePaymentIntentId: string;
  bookingId: mongoose.Types.ObjectId;
  seekerId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  listingId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status:
    | 'requires_payment_method'
    | 'requires_confirmation'
    | 'requires_action'
    | 'processing'
    | 'succeeded'
    | 'canceled';
  paymentType: 'rent' | 'security_deposit' | 'booking_fee';
  applicationFeeAmount: number;
  transferData?: {
    destination: string;
    amount: number;
  };
  metadata: Record<string, string>;
  clientSecret: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransfer extends Document {
  _id: string;
  stripeTransferId: string;
  providerId: mongoose.Types.ObjectId;
  paymentIntentId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'canceled' | 'in_transit';
  destination: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayout extends Document {
  _id: string;
  stripePayoutId: string;
  providerId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled';
  method: 'standard' | 'instant';
  arrival_date: Date;
  description: string;
  failure_code?: string;
  failure_message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StripeAccountSchema = new Schema<IStripeAccount>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    stripeAccountId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ['pending', 'restricted', 'enabled'],
      default: 'pending',
    },
    chargesEnabled: {
      type: Boolean,
      default: false,
    },
    payoutsEnabled: {
      type: Boolean,
      default: false,
    },
    detailsSubmitted: {
      type: Boolean,
      default: false,
    },
    requiresVerification: {
      type: Boolean,
      default: true,
    },
    requirements: {
      currentlyDue: [String],
      eventuallyDue: [String],
      pastDue: [String],
    },
  },
  {
    timestamps: true,
  }
);

const PaymentIntentSchema = new Schema<IPaymentIntent>(
  {
    stripePaymentIntentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'BookingRequest',
      required: true,
      index: true,
    },
    seekerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'inr',
    },
    status: {
      type: String,
      enum: [
        'requires_payment_method',
        'requires_confirmation',
        'requires_action',
        'processing',
        'succeeded',
        'canceled',
      ],
      required: true,
    },
    paymentType: {
      type: String,
      enum: ['rent', 'security_deposit', 'booking_fee'],
      required: true,
    },
    applicationFeeAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    transferData: {
      destination: String,
      amount: Number,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    clientSecret: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const TransferSchema = new Schema<ITransfer>(
  {
    stripeTransferId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paymentIntentId: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentIntent',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'inr',
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'canceled', 'in_transit'],
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const PayoutSchema = new Schema<IPayout>(
  {
    stripePayoutId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'inr',
    },
    status: {
      type: String,
      enum: ['pending', 'in_transit', 'paid', 'failed', 'canceled'],
      required: true,
    },
    method: {
      type: String,
      enum: ['standard', 'instant'],
      default: 'standard',
    },
    arrival_date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    failure_code: String,
    failure_message: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
PaymentIntentSchema.index({ providerId: 1, status: 1 });
PaymentIntentSchema.index({ seekerId: 1, status: 1 });
PaymentIntentSchema.index({ createdAt: -1 });

TransferSchema.index({ providerId: 1, status: 1 });
TransferSchema.index({ createdAt: -1 });

PayoutSchema.index({ providerId: 1, status: 1 });
PayoutSchema.index({ createdAt: -1 });

const StripeAccount =
  mongoose.models.StripeAccount ||
  mongoose.model<IStripeAccount>('StripeAccount', StripeAccountSchema);
const PaymentIntent =
  mongoose.models.PaymentIntent ||
  mongoose.model<IPaymentIntent>('PaymentIntent', PaymentIntentSchema);
const Transfer = mongoose.models.Transfer || mongoose.model<ITransfer>('Transfer', TransferSchema);
const Payout = mongoose.models.Payout || mongoose.model<IPayout>('Payout', PayoutSchema);

export { StripeAccount, PaymentIntent, Transfer, Payout };
