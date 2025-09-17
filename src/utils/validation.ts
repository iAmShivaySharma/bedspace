import { z } from 'zod';
import { ROOM_TYPES, GENDER_PREFERENCES, USER_ROLES, FACILITIES } from '@/constants';

// Auth validation schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  role: z.enum([USER_ROLES.SEEKER, USER_ROLES.PROVIDER]),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
});

export const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
  identifier: z.string().min(1, 'Email or phone is required'),
});

// User profile validation
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number').optional(),
});

// Provider verification validation
export const providerVerificationSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').optional(),
  businessAddress: z.string().min(10, 'Business address must be at least 10 characters').optional(),
  businessPhone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid business phone number').optional(),
});

// Listing validation schemas
export const createListingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000, 'Description must be less than 1000 characters'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  rent: z.number().min(1000, 'Rent must be at least ₹1000').max(100000, 'Rent must be less than ₹1,00,000'),
  securityDeposit: z.number().min(0, 'Security deposit cannot be negative').max(500000, 'Security deposit must be less than ₹5,00,000'),
  roomType: z.enum([ROOM_TYPES.SINGLE, ROOM_TYPES.SHARED, ROOM_TYPES.PRIVATE]),
  genderPreference: z.enum([GENDER_PREFERENCES.MALE, GENDER_PREFERENCES.FEMALE, GENDER_PREFERENCES.ANY]),
  facilities: z.array(z.string()).max(10, 'Maximum 10 facilities allowed'),
  availableFrom: z.string().refine((date) => new Date(date) >= new Date(), 'Available from date must be in the future'),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
});

export const updateListingSchema = createListingSchema.partial();

// Search validation
export const searchSchema = z.object({
  city: z.string().optional(),
  minRent: z.number().min(0).optional(),
  maxRent: z.number().min(0).optional(),
  roomType: z.enum([ROOM_TYPES.SINGLE, ROOM_TYPES.SHARED, ROOM_TYPES.PRIVATE]).optional(),
  genderPreference: z.enum([GENDER_PREFERENCES.MALE, GENDER_PREFERENCES.FEMALE, GENDER_PREFERENCES.ANY]).optional(),
  facilities: z.array(z.string()).optional(),
  sortBy: z.enum(['rent_asc', 'rent_desc', 'newest', 'oldest']).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(50).optional(),
});

// Booking validation
export const bookingRequestSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(500, 'Message must be less than 500 characters'),
  requestedDate: z.string().refine((date) => new Date(date) >= new Date(), 'Requested date must be in the future'),
});

export const bookingResponseSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  status: z.enum(['approved', 'rejected']),
  responseMessage: z.string().max(500, 'Response message must be less than 500 characters').optional(),
});

// Message validation
export const sendMessageSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  content: z.string().min(1, 'Message content is required').max(1000, 'Message must be less than 1000 characters'),
  messageType: z.enum(['text', 'image', 'file']).default('text'),
});

// File upload validation
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file: File, maxSize: number): boolean => {
  return file.size <= maxSize;
};

// Utility functions
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const validateIndianPhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

export const validatePincode = (pincode: string): boolean => {
  const pincodeRegex = /^\d{6}$/;
  return pincodeRegex.test(pincode);
};
