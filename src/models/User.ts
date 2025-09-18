import mongoose, { Schema, Document } from 'mongoose';
import { USER_ROLES, VERIFICATION_STATUS } from '@/constants';

export interface IUser extends Document {
  _id: string;
  email: string;
  phone?: string;
  password: string;
  name: string;
  role: 'seeker' | 'provider' | 'admin';
  avatar?: string;
  isVerified: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  emailVerificationToken?: string;
  phoneVerificationToken?: string;
  otpExpiry?: Date;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProvider extends IUser {
  role: 'provider';
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verificationDocuments: IVerificationDocument[];
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  rating: number;
  totalReviews: number;
  totalListings: number;
  verifiedAt?: Date;
  rejectionReason?: string;
}

export interface IVerificationDocument {
  _id: string;
  type: 'id_card' | 'business_license' | 'address_proof' | 'other';
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
}

const VerificationDocumentSchema = new Schema<IVerificationDocument>({
  type: {
    type: String,
    enum: ['id_card', 'business_license', 'address_proof', 'other'],
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
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: Object.values(VERIFICATION_STATUS),
    default: VERIFICATION_STATUS.PENDING,
  },
  rejectionReason: String,
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: Date,
});

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  phone: {
    type: String,
    sparse: true,
    unique: true,
    trim: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    required: true,
    index: true,
  },
  avatar: String,
  isVerified: {
    type: Boolean,
    default: false,
    index: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  phoneVerificationToken: String,
  otpExpiry: Date,
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
  lastLogin: Date,
}, {
  timestamps: true,
  discriminatorKey: 'role',
});

// Provider-specific schema
const ProviderSchema = new Schema<IProvider>({
  verificationStatus: {
    type: String,
    enum: Object.values(VERIFICATION_STATUS),
    default: VERIFICATION_STATUS.PENDING,
    index: true,
  },
  verificationDocuments: [VerificationDocumentSchema],
  businessName: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  businessAddress: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  businessPhone: {
    type: String,
    trim: true,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalListings: {
    type: Number,
    default: 0,
    min: 0,
  },
  verifiedAt: Date,
  rejectionReason: String,
});

// Indexes for better query performance
UserSchema.index({ email: 1, role: 1 });
UserSchema.index({ phone: 1, role: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ isVerified: 1, role: 1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return this.name;
});

// Method to check if user is verified
UserSchema.methods.isFullyVerified = function() {
  return this.isEmailVerified && (this.role !== 'provider' || this.verificationStatus === 'approved');
};

// Static method to find by email or phone
UserSchema.statics.findByIdentifier = function(identifier: string) {
  const isEmail = identifier.includes('@');
  return this.findOne(isEmail ? { email: identifier } : { phone: identifier });
};

// Pre-save middleware to update verification status
UserSchema.pre('save', function(next) {
  if (this.isModified('isEmailVerified') || this.isModified('isPhoneVerified')) {
    const userData = this as any; // Type assertion for verificationStatus
    this.isVerified = this.isEmailVerified && (this.role !== 'provider' || userData.verificationStatus === 'approved');
  }
  next();
});

// Create models with proper caching to prevent discriminator errors
let User: mongoose.Model<IUser>;
let Provider: mongoose.Model<IProvider>;

if (mongoose.models.User) {
  User = mongoose.models.User as mongoose.Model<IUser>;
  // Check if discriminator already exists
  if (mongoose.models.provider) {
    Provider = mongoose.models.provider as mongoose.Model<IProvider>;
  } else {
    Provider = User.discriminator<IProvider>('provider', ProviderSchema);
  }
} else {
  User = mongoose.model<IUser>('User', UserSchema);
  Provider = User.discriminator<IProvider>('provider', ProviderSchema);
}

export { User, Provider };
export default User;
