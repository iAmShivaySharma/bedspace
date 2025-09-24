import mongoose, { Schema, Document } from 'mongoose';
import { BOOKING_STATUS } from '@/constants';

export interface IBookingRequest extends Document {
  _id: string;
  listingId: mongoose.Types.ObjectId;
  seekerId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  message: string;
  requestedDate: Date;
  responseMessage?: string;
  respondedAt?: Date;
  respondedBy?: mongoose.Types.ObjectId;
  cancelledAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingRequestSchema = new Schema<IBookingRequest>(
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
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    requestedDate: {
      type: Date,
      required: true,
      index: true,
    },
    responseMessage: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    respondedAt: Date,
    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    cancelledAt: Date,
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better query performance
BookingRequestSchema.index({ seekerId: 1, status: 1 });
BookingRequestSchema.index({ providerId: 1, status: 1 });
BookingRequestSchema.index({ listingId: 1, status: 1 });
BookingRequestSchema.index({ createdAt: -1 });
BookingRequestSchema.index({ requestedDate: 1, status: 1 });

// Prevent duplicate booking requests for the same listing by the same seeker
BookingRequestSchema.index(
  { listingId: 1, seekerId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'approved'] },
    },
  }
);

// Virtual for response time (how long it took to respond)
BookingRequestSchema.virtual('responseTime').get(function () {
  if (this.respondedAt && this.createdAt) {
    return this.respondedAt.getTime() - this.createdAt.getTime();
  }
  return null;
});

// Virtual for days until requested date
BookingRequestSchema.virtual('daysUntilRequestedDate').get(function () {
  const now = new Date();
  const diffTime = this.requestedDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to approve booking
BookingRequestSchema.methods.approve = function (respondedBy: string, responseMessage?: string) {
  this.status = BOOKING_STATUS.APPROVED;
  this.respondedAt = new Date();
  this.respondedBy = respondedBy;
  if (responseMessage) {
    this.responseMessage = responseMessage;
  }
  return this.save();
};

// Method to reject booking
BookingRequestSchema.methods.reject = function (respondedBy: string, responseMessage?: string) {
  this.status = BOOKING_STATUS.REJECTED;
  this.respondedAt = new Date();
  this.respondedBy = respondedBy;
  if (responseMessage) {
    this.responseMessage = responseMessage;
  }
  return this.save();
};

// Method to cancel booking
BookingRequestSchema.methods.cancel = function (cancelledBy: string, cancellationReason?: string) {
  this.status = BOOKING_STATUS.CANCELLED;
  this.cancelledAt = new Date();
  this.cancelledBy = cancelledBy;
  if (cancellationReason) {
    this.cancellationReason = cancellationReason;
  }
  return this.save();
};

// Static method to get booking statistics
BookingRequestSchema.statics.getStats = function (providerId?: string) {
  const matchStage: any = {};
  if (providerId) {
    matchStage.providerId = new mongoose.Types.ObjectId(providerId);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        stats: {
          $push: {
            status: '$_id',
            count: '$count',
          },
        },
      },
    },
  ]);
};

// Static method to get recent bookings
BookingRequestSchema.statics.getRecentBookings = function (
  userId: string,
  userRole: string,
  limit: number = 10
) {
  const matchStage: any = {};

  if (userRole === 'seeker') {
    matchStage.seekerId = new mongoose.Types.ObjectId(userId);
  } else if (userRole === 'provider') {
    matchStage.providerId = new mongoose.Types.ObjectId(userId);
  }

  return this.find(matchStage)
    .populate('listingId', 'title images rent city')
    .populate('seekerId', 'name email avatar')
    .populate('providerId', 'name email avatar')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Pre-save middleware to update listing booking count
BookingRequestSchema.pre('save', async function (next) {
  if (this.isModified('status') && this.status === BOOKING_STATUS.APPROVED) {
    try {
      const Listing = mongoose.model('Listing');
      await Listing.findByIdAndUpdate(this.listingId, {
        $inc: { bookingCount: 1 },
      });
    } catch (error) {
      console.error('Error updating listing booking count:', error);
    }
  }
  next();
});

const BookingRequest =
  mongoose.models.BookingRequest ||
  mongoose.model<IBookingRequest>('BookingRequest', BookingRequestSchema);

export { BookingRequest };
