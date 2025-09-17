export const USER_ROLES = {
  SEEKER: 'seeker',
  PROVIDER: 'provider',
  ADMIN: 'admin',
} as const;

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const BOOKING_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export const ROOM_TYPES = {
  SINGLE: 'single',
  SHARED: 'shared',
  PRIVATE: 'private',
} as const;

export const GENDER_PREFERENCES = {
  MALE: 'male',
  FEMALE: 'female',
  ANY: 'any',
} as const;

export const DOCUMENT_TYPES = {
  ID_CARD: 'id_card',
  BUSINESS_LICENSE: 'business_license',
  ADDRESS_PROOF: 'address_proof',
  OTHER: 'other',
} as const;

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
} as const;

export const FACILITIES = [
  'WiFi',
  'AC',
  'Parking',
  'Laundry',
  'Kitchen',
  'Gym',
  'Swimming Pool',
  'Security',
  'Power Backup',
  'Water Supply',
  'Furnished',
  'Semi-Furnished',
  'Balcony',
  'Garden',
  'Elevator',
] as const;

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Puducherry',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep',
  'Andaman and Nicobar Islands',
] as const;

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    VERIFY_OTP: '/api/auth/verify-otp',
    RESEND_OTP: '/api/auth/resend-otp',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  USERS: {
    BASE: '/api/users',
    PROFILE: '/api/users/profile',
    UPLOAD_AVATAR: '/api/users/upload-avatar',
  },
  PROVIDERS: {
    BASE: '/api/providers',
    VERIFICATION: '/api/providers/verification',
    UPLOAD_DOCUMENTS: '/api/providers/upload-documents',
  },
  LISTINGS: {
    BASE: '/api/listings',
    SEARCH: '/api/listings/search',
    UPLOAD_IMAGES: '/api/listings/upload-images',
  },
  BOOKINGS: {
    BASE: '/api/bookings',
    REQUEST: '/api/bookings/request',
    RESPOND: '/api/bookings/respond',
  },
  MESSAGES: {
    BASE: '/api/messages',
    CONVERSATIONS: '/api/messages/conversations',
  },
  ADMIN: {
    BASE: '/api/admin',
    PROVIDERS: '/api/admin/providers',
    LISTINGS: '/api/admin/listings',
    USERS: '/api/admin/users',
    STATS: '/api/admin/stats',
  },
} as const;
