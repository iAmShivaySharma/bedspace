import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  _id: string;
  listingId: mongoose.Types.ObjectId;
  seekerId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  checkInDate: Date;
  checkOutDate?: Date; // Optional for long-term stays
  duration: number; // Duration in months
  totalAmount: number; // Total amount to be paid
  securityDeposit: number;
  monthlyRent: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'active' | 'completed';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  paymentIntentId?: string; // Stripe payment intent ID
  stripeCustomerId?: string;
  notes?: string;
  seekerNotes?: string;
  providerNotes?: string;
  adminNotes?: string;
  cancelledBy?: mongoose.Types.ObjectId;
  cancellationReason?: string;
  cancelledAt?: Date;
  confirmedAt?: Date;
  activatedAt?: Date;
  completedAt?: Date;
  lastPaymentDate?: Date;
  nextPaymentDue?: Date;
  paymentHistory: IPaymentRecord[];
  documents: IBookingDocument[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentRecord {
  _id?: string;
  amount: number;
  type: 'security_deposit' | 'monthly_rent' | 'advance_payment' | 'refund';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentIntentId?: string;
  paidAt?: Date;
  dueDate?: Date;
  notes?: string;
  createdAt: Date;
}

export interface IBookingDocument {
  _id?: string;
  type: 'agreement' | 'id_proof' | 'income_proof' | 'other';
  fileName: string;
  fileUrl: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
}

const PaymentRecordSchema = new Schema<IPaymentRecord>(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['security_deposit', 'monthly_rent', 'advance_payment', 'refund'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    paymentIntentId: String,
    paidAt: Date,
    dueDate: Date,
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

const BookingDocumentSchema = new Schema<IBookingDocument>({
  type: {
    type: String,
    enum: ['agreement', 'id_proof', 'income_proof', 'other'],
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: Date,
  rejectionReason: {
    type: String,
    maxlength: 200,
  },
});

const BookingSchema = new Schema<IBooking>(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
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
    checkInDate: {
      type: Date,
      required: true,
      index: true,
    },
    checkOutDate: Date,
    duration: {
      type: Number,
      required: true,
      min: 1, // Minimum 1 month
      max: 24, // Maximum 24 months
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    securityDeposit: {
      type: Number,
      required: true,
      min: 0,
    },
    monthlyRent: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'active', 'completed'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentIntentId: String,
    stripeCustomerId: String,
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    seekerNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    providerNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    cancelledAt: Date,
    confirmedAt: Date,
    activatedAt: Date,
    completedAt: Date,
    lastPaymentDate: Date,
    nextPaymentDue: Date,
    paymentHistory: [PaymentRecordSchema],
    documents: [BookingDocumentSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
BookingSchema.index({ seekerId: 1, status: 1 });
BookingSchema.index({ providerId: 1, status: 1 });
BookingSchema.index({ listingId: 1, status: 1 });
BookingSchema.index({ checkInDate: 1, status: 1 });
BookingSchema.index({ nextPaymentDue: 1, status: 1 });
BookingSchema.index({ createdAt: -1 });

// Compound index for preventing duplicate active bookings
BookingSchema.index(
  { seekerId: 1, listingId: 1, status: 1 },
  {
    partialFilterExpression: { status: { $in: ['pending', 'confirmed', 'active'] } },
  }
);

// Virtual for total cost
BookingSchema.virtual('totalCost').get(function () {
  return this.totalAmount + this.securityDeposit;
});

// Method to confirm booking
BookingSchema.methods.confirm = function () {
  this.status = 'confirmed';
  this.confirmedAt = new Date();
  return this.save();
};

// Method to cancel booking
BookingSchema.methods.cancel = function (cancelledBy: string, reason?: string) {
  this.status = 'cancelled';
  this.cancelledBy = cancelledBy;
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
  return this.save();
};

// Static method to get bookings for a user
BookingSchema.statics.getUserBookings = function (
  userId: string,
  userRole: string,
  filters: any = {}
) {
  let query: any = {};

  if (userRole === 'seeker') {
    query.seekerId = userId;
  } else if (userRole === 'provider') {
    query.providerId = userId;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  return this.find(query)
    .populate('seekerId', 'name email phone')
    .populate('providerId', 'name email phone')
    .populate('listingId', 'title address city rent securityDeposit')
    .sort({ createdAt: -1 });
};

const FullBooking =
  mongoose.models.FullBooking || mongoose.model<IBooking>('FullBooking', BookingSchema);

export { FullBooking };
export default FullBooking;
