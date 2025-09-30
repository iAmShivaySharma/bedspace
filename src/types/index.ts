import { ObjectId } from 'mongoose';

export interface User {
  _id: string;
  id: string;
  email: string;
  phone?: string;
  name: string;
  role: 'seeker' | 'provider' | 'admin';
  avatar?: string;
  isVerified: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Provider extends User {
  role: 'provider';
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verificationDocuments: VerificationDocument[];
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  rating: number;
  totalReviews: number;
}

export interface VerificationDocument {
  _id: string;
  type: 'id_card' | 'business_license' | 'address_proof' | 'other';
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface Listing {
  _id: string;
  providerId: string;
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
  images: ListingImage[];
  isActive: boolean;
  isApproved: boolean;
  availableFrom: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingImage {
  _id: string;
  fileName: string;
  fileUrl: string;
  isPrimary: boolean;
  uploadedAt: Date;
}

export interface BookingRequest {
  _id: string;
  listingId: string;
  seekerId: string;
  providerId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  message: string;
  requestedDate: Date;
  responseMessage?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: string;
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface ConversationParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: 'seeker' | 'provider' | 'admin';
  email: string;
}

export interface Conversation {
  _id: string;
  id: string;
  participants: string[];
  participant: ConversationParticipant;
  lastMessage?: Message;
  lastMessageAt: string;
  createdAt: string;
  unreadCount: number;
  listing?: {
    id: string;
    title: string;
  };
}

export interface SearchFilters {
  city?: string;
  minRent?: number;
  maxRent?: number;
  roomType?: string;
  genderPreference?: string;
  facilities?: string[];
  sortBy?: 'rent_asc' | 'rent_desc' | 'newest' | 'oldest';
  page?: number;
  limit?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
