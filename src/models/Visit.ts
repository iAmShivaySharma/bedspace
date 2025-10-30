import mongoose, { Schema, Document } from 'mongoose';

export interface IVisit extends Document {
  _id: string;
  listingId: mongoose.Types.ObjectId;
  seekerId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  scheduledDate: Date;
  timeSlot: string; // e.g., "09:00-10:00", "14:00-15:00"
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string; // Seeker's initial notes
  seekerNotes?: string; // Seeker's additional notes
  providerNotes?: string; // Provider's notes
  cancelledBy?: mongoose.Types.ObjectId;
  cancellationReason?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VisitSchema = new Schema<IVisit>(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    seekerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
      enum: [
        '09:00-10:00',
        '10:00-11:00',
        '11:00-12:00',
        '12:00-13:00',
        '13:00-14:00',
        '14:00-15:00',
        '15:00-16:00',
        '16:00-17:00',
        '17:00-18:00',
        '18:00-19:00',
        '19:00-20:00',
      ],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
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
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
VisitSchema.index({ seekerId: 1, status: 1 });
VisitSchema.index({ providerId: 1, status: 1 });
VisitSchema.index({ listingId: 1, status: 1 });
VisitSchema.index({ scheduledDate: 1, status: 1 });
VisitSchema.index({ createdAt: -1 });

// Compound index for preventing duplicate pending/confirmed visits
VisitSchema.index(
  { seekerId: 1, listingId: 1, status: 1 },
  {
    partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } },
  }
);

// Virtual for formatted date
VisitSchema.virtual('formattedDate').get(function () {
  return this.scheduledDate.toLocaleDateString();
});

// Virtual for formatted time
VisitSchema.virtual('formattedTime').get(function () {
  return this.timeSlot;
});

// Method to confirm visit
VisitSchema.methods.confirm = function () {
  this.status = 'confirmed';
  return this.save();
};

// Method to cancel visit
VisitSchema.methods.cancel = function (cancelledBy: string, reason?: string) {
  this.status = 'cancelled';
  this.cancelledBy = cancelledBy;
  this.cancellationReason = reason;
  return this.save();
};

// Method to complete visit
VisitSchema.methods.complete = function () {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Static method to get available time slots for a date
VisitSchema.statics.getAvailableTimeSlots = async function (providerId: string, date: Date) {
  const allSlots = [
    '09:00-10:00',
    '10:00-11:00',
    '11:00-12:00',
    '12:00-13:00',
    '13:00-14:00',
    '14:00-15:00',
    '15:00-16:00',
    '16:00-17:00',
    '17:00-18:00',
    '18:00-19:00',
    '19:00-20:00',
  ];

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const bookedSlots = await this.find({
    providerId,
    scheduledDate: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
    status: { $in: ['pending', 'confirmed'] },
  }).select('timeSlot');

  const bookedTimeSlots = bookedSlots.map((visit: any) => visit.timeSlot);

  return allSlots.filter(slot => !bookedTimeSlots.includes(slot));
};

// Static method to get visits for a user
VisitSchema.statics.getUserVisits = function (userId: string, userRole: string, filters: any = {}) {
  let query: any = {};

  if (userRole === 'seeker') {
    query.seekerId = userId;
  } else if (userRole === 'provider') {
    query.providerId = userId;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.dateFrom) {
    query.scheduledDate = { $gte: new Date(filters.dateFrom) };
  }

  if (filters.dateTo) {
    query.scheduledDate = { ...query.scheduledDate, $lte: new Date(filters.dateTo) };
  }

  return this.find(query)
    .populate('seekerId', 'name email phone')
    .populate('providerId', 'name email phone')
    .populate('listingId', 'title address city')
    .sort({ scheduledDate: -1 });
};

const Visit = mongoose.models.Visit || mongoose.model<IVisit>('Visit', VisitSchema);

export { Visit };
export default Visit;
