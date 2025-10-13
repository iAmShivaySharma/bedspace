import mongoose, { Schema, Document } from 'mongoose';
import { ROOM_TYPES, GENDER_PREFERENCES, FACILITIES } from '@/constants';

export interface IListingImage {
  _id: string;
  fileName: string;
  fileUrl: string;
  isPrimary: boolean;
  uploadedAt: Date;
}

export interface IListing extends Document {
  _id: string;
  providerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  rent: number;
  securityDeposit: number;
  roomType: 'single' | 'shared' | 'private';
  genderPreference: 'male' | 'female' | 'any';
  facilities: string[];
  images: IListingImage[];
  isActive: boolean;
  isApproved: boolean;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  availableFrom: Date;
  viewCount: number;
  bookingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ListingImageSchema = new Schema<IListingImage>({
  fileName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const ListingSchema = new Schema<IListing>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: 'text',
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
      index: 'text',
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{6}$/,
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180,
      },
    },
    rent: {
      type: Number,
      required: true,
      min: 0,
    },
    securityDeposit: {
      type: Number,
      required: true,
      min: 0,
    },
    roomType: {
      type: String,
      enum: Object.values(ROOM_TYPES),
      required: true,
    },
    genderPreference: {
      type: String,
      enum: Object.values(GENDER_PREFERENCES),
      required: true,
    },
    facilities: [
      {
        type: String,
        trim: true,
      },
    ],
    images: [ListingImageSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    rejectionReason: String,
    availableFrom: {
      type: Date,
      required: true,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    bookingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better query performance
ListingSchema.index({ city: 1, isActive: 1, isApproved: 1 });
ListingSchema.index({ rent: 1, city: 1 });
ListingSchema.index({ roomType: 1, genderPreference: 1 });
ListingSchema.index({ providerId: 1, isActive: 1 });
ListingSchema.index({ createdAt: -1 });
ListingSchema.index({ availableFrom: 1, isActive: 1 });

// Geospatial index for location-based queries
ListingSchema.index({ coordinates: '2dsphere' });

// Text index for search functionality
ListingSchema.index(
  {
    title: 'text',
    description: 'text',
    city: 'text',
    address: 'text',
  },
  {
    weights: {
      title: 10,
      city: 5,
      description: 2,
      address: 1,
    },
  }
);

// Virtual for primary image
ListingSchema.virtual('primaryImage').get(function () {
  const primaryImg = this.images.find(img => img.isPrimary);
  return primaryImg || this.images[0] || null;
});

// Virtual for formatted rent
ListingSchema.virtual('formattedRent').get(function () {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(this.rent);
});

// Method to increment view count
ListingSchema.methods.incrementViewCount = function () {
  this.viewCount += 1;
  return this.save();
};

// Method to increment booking count
ListingSchema.methods.incrementBookingCount = function () {
  this.bookingCount += 1;
  return this.save();
};

interface SearchFilters {
  city?: string;
  minRent?: number;
  maxRent?: number;
  roomType?: 'single' | 'shared' | 'private';
  genderPreference?: 'male' | 'female' | 'any';
  facilities?: string[];
  sortBy?: 'rent_asc' | 'rent_desc' | 'newest' | 'oldest';
  page?: number;
  limit?: number;
}

// Static method for search with filters
ListingSchema.statics.searchListings = function (filters: SearchFilters) {
  const {
    city,
    minRent,
    maxRent,
    roomType,
    genderPreference,
    facilities,
    sortBy = 'newest',
    page = 1,
    limit = 20,
  } = filters;

  const query: Record<string, unknown> = {
    isActive: true,
    isApproved: true,
    availableFrom: { $lte: new Date() },
  };

  // Add filters
  if (city) {
    query.city = new RegExp(city, 'i');
  }

  if (minRent || maxRent) {
    const rentQuery: { $gte?: number; $lte?: number } = {};
    if (minRent) rentQuery.$gte = minRent;
    if (maxRent) rentQuery.$lte = maxRent;
    query.rent = rentQuery;
  }

  if (roomType) {
    query.roomType = roomType;
  }

  if (genderPreference && genderPreference !== 'any') {
    query.genderPreference = { $in: [genderPreference, 'any'] };
  }

  if (facilities && facilities.length > 0) {
    query.facilities = { $in: facilities };
  }

  // Sort options
  let sort: Record<string, 1 | -1> = {};
  switch (sortBy) {
    case 'rent_asc':
      sort = { rent: 1 };
      break;
    case 'rent_desc':
      sort = { rent: -1 };
      break;
    case 'oldest':
      sort = { createdAt: 1 };
      break;
    case 'newest':
    default:
      sort = { createdAt: -1 };
      break;
  }

  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('providerId', 'name avatar rating totalReviews')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Pre-save middleware
ListingSchema.pre('save', function (next) {
  // Ensure only one primary image
  if (this.images && this.images.length > 0) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length === 0) {
      this.images[0].isPrimary = true;
    } else if (primaryImages.length > 1) {
      this.images.forEach((img, index) => {
        img.isPrimary = index === 0;
      });
    }
  }
  next();
});

// Clear existing model to force reload with new schema
if (mongoose.models.Listing) {
  delete mongoose.models.Listing;
}

const Listing = mongoose.model<IListing>('Listing', ListingSchema);

export { Listing };
