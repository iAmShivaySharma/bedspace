import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  _id: string;
  bookingId: mongoose.Types.ObjectId;
  payerId: mongoose.Types.ObjectId;
  payeeId: mongoose.Types.ObjectId;
  listingId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  paymentMethod: 'UPI' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'wallet' | 'cash';
  transactionId?: string;
  paymentGateway?: string;
  description: string;
  metadata?: {
    months?: number;
    securityDeposit?: number;
    platformFee?: number;
    taxes?: number;
  };
  processedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  refundedAt?: Date;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'BookingRequest',
      required: true,
      index: true,
    },
    payerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    payeeId: {
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
      default: 'INR',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
      required: true,
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'bank_transfer', 'credit_card', 'debit_card', 'wallet', 'cash'],
      required: true,
    },
    transactionId: {
      type: String,
      sparse: true,
      index: true,
    },
    paymentGateway: {
      type: String,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    metadata: {
      months: Number,
      securityDeposit: Number,
      platformFee: Number,
      taxes: Number,
    },
    processedAt: Date,
    completedAt: Date,
    failureReason: String,
    refundedAt: Date,
    refundAmount: Number,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better query performance
PaymentSchema.index({ payerId: 1, status: 1 });
PaymentSchema.index({ payeeId: 1, status: 1 });
PaymentSchema.index({ bookingId: 1, status: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });

// Virtual for formatted amount
PaymentSchema.virtual('formattedAmount').get(function () {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: this.currency,
    maximumFractionDigits: 0,
  }).format(this.amount);
});

// Static method to create payment
PaymentSchema.statics.createPayment = function (
  bookingId: string | mongoose.Types.ObjectId,
  payerId: string | mongoose.Types.ObjectId,
  payeeId: string | mongoose.Types.ObjectId,
  listingId: string | mongoose.Types.ObjectId,
  amount: number,
  paymentMethod: string,
  description: string,
  metadata?: any
) {
  return this.create({
    bookingId,
    payerId,
    payeeId,
    listingId,
    amount,
    paymentMethod,
    description,
    metadata,
  });
};

// Static method to get user payments with pagination
PaymentSchema.statics.getUserPayments = function (
  userId: string | mongoose.Types.ObjectId,
  role: 'payer' | 'payee' | 'any' = 'any',
  options: {
    status?: string;
    limit?: number;
    skip?: number;
  } = {}
) {
  const { status, limit = 20, skip = 0 } = options;

  let query: any = {};

  if (role === 'payer') {
    query.payerId = userId;
  } else if (role === 'payee') {
    query.payeeId = userId;
  } else {
    query.$or = [{ payerId: userId }, { payeeId: userId }];
  }

  if (status && status !== 'all') {
    query.status = status;
  }

  return this.find(query)
    .populate('bookingId', 'status requestedDate')
    .populate('listingId', 'title address city')
    .populate('payerId', 'name email')
    .populate('payeeId', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get payment statistics
PaymentSchema.statics.getPaymentStats = function (
  userId?: string | mongoose.Types.ObjectId,
  role?: 'payer' | 'payee'
) {
  let matchQuery: any = {};

  if (userId && role) {
    if (role === 'payer') {
      matchQuery.payerId = userId;
    } else if (role === 'payee') {
      matchQuery.payeeId = userId;
    }
  }

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);
};

// Method to update payment status
PaymentSchema.methods.updateStatus = function (
  status: string,
  metadata?: { transactionId?: string; failureReason?: string; refundAmount?: number }
) {
  this.status = status;

  if (metadata?.transactionId) {
    this.transactionId = metadata.transactionId;
  }

  if (status === 'processing') {
    this.processedAt = new Date();
  } else if (status === 'completed') {
    this.completedAt = new Date();
  } else if (status === 'failed' && metadata?.failureReason) {
    this.failureReason = metadata.failureReason;
  } else if (status === 'refunded') {
    this.refundedAt = new Date();
    if (metadata?.refundAmount) {
      this.refundAmount = metadata.refundAmount;
    }
  }

  return this.save();
};

const Payment = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export { Payment };
