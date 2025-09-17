import Activity from '@/models/Activity';
import { logActivity } from './logger';
import { NextRequest } from 'next/server';

// Activity types
export const ACTIVITY_TYPES = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  PASSWORD_CHANGE: 'password_change',
  
  // Profile
  PROFILE_UPDATE: 'profile_update',
  PROFILE_VIEW: 'profile_view',
  
  // Listings
  LISTING_CREATE: 'listing_create',
  LISTING_UPDATE: 'listing_update',
  LISTING_DELETE: 'listing_delete',
  LISTING_VIEW: 'listing_view',
  LISTING_APPROVE: 'listing_approve',
  LISTING_REJECT: 'listing_reject',
  
  // Bookings
  BOOKING_CREATE: 'booking_create',
  BOOKING_UPDATE: 'booking_update',
  BOOKING_CANCEL: 'booking_cancel',
  BOOKING_APPROVE: 'booking_approve',
  BOOKING_REJECT: 'booking_reject',
  
  // Search
  SEARCH_PERFORM: 'search_perform',
  SEARCH_FILTER: 'search_filter',
  
  // Admin
  USER_ACTIVATE: 'user_activate',
  USER_DEACTIVATE: 'user_deactivate',
  USER_VERIFY: 'user_verify',
  PROVIDER_APPROVE: 'provider_approve',
  PROVIDER_REJECT: 'provider_reject',
  
  // Messages
  MESSAGE_SEND: 'message_send',
  MESSAGE_READ: 'message_read',
  
  // Favorites
  FAVORITE_ADD: 'favorite_add',
  FAVORITE_REMOVE: 'favorite_remove',
  
  // System
  API_ACCESS: 'api_access',
  ERROR_OCCURRED: 'error_occurred'
};

// Activity descriptions
export const ACTIVITY_DESCRIPTIONS = {
  [ACTIVITY_TYPES.LOGIN]: 'User logged in',
  [ACTIVITY_TYPES.LOGOUT]: 'User logged out',
  [ACTIVITY_TYPES.REGISTER]: 'User registered',
  [ACTIVITY_TYPES.PASSWORD_CHANGE]: 'User changed password',
  
  [ACTIVITY_TYPES.PROFILE_UPDATE]: 'User updated profile',
  [ACTIVITY_TYPES.PROFILE_VIEW]: 'User viewed profile',
  
  [ACTIVITY_TYPES.LISTING_CREATE]: 'User created a listing',
  [ACTIVITY_TYPES.LISTING_UPDATE]: 'User updated a listing',
  [ACTIVITY_TYPES.LISTING_DELETE]: 'User deleted a listing',
  [ACTIVITY_TYPES.LISTING_VIEW]: 'User viewed a listing',
  [ACTIVITY_TYPES.LISTING_APPROVE]: 'Admin approved a listing',
  [ACTIVITY_TYPES.LISTING_REJECT]: 'Admin rejected a listing',
  
  [ACTIVITY_TYPES.BOOKING_CREATE]: 'User created a booking',
  [ACTIVITY_TYPES.BOOKING_UPDATE]: 'User updated a booking',
  [ACTIVITY_TYPES.BOOKING_CANCEL]: 'User cancelled a booking',
  [ACTIVITY_TYPES.BOOKING_APPROVE]: 'Provider approved a booking',
  [ACTIVITY_TYPES.BOOKING_REJECT]: 'Provider rejected a booking',
  
  [ACTIVITY_TYPES.SEARCH_PERFORM]: 'User performed a search',
  [ACTIVITY_TYPES.SEARCH_FILTER]: 'User applied search filters',
  
  [ACTIVITY_TYPES.USER_ACTIVATE]: 'Admin activated a user',
  [ACTIVITY_TYPES.USER_DEACTIVATE]: 'Admin deactivated a user',
  [ACTIVITY_TYPES.USER_VERIFY]: 'Admin verified a user',
  [ACTIVITY_TYPES.PROVIDER_APPROVE]: 'Admin approved a provider',
  [ACTIVITY_TYPES.PROVIDER_REJECT]: 'Admin rejected a provider',
  
  [ACTIVITY_TYPES.MESSAGE_SEND]: 'User sent a message',
  [ACTIVITY_TYPES.MESSAGE_READ]: 'User read a message',
  
  [ACTIVITY_TYPES.FAVORITE_ADD]: 'User added to favorites',
  [ACTIVITY_TYPES.FAVORITE_REMOVE]: 'User removed from favorites',
  
  [ACTIVITY_TYPES.API_ACCESS]: 'API endpoint accessed',
  [ACTIVITY_TYPES.ERROR_OCCURRED]: 'Error occurred'
};

// Helper function to extract IP and User Agent from request
export const getRequestInfo = (request: NextRequest) => {
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   request.ip || 
                   'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
};

// Main activity logging function
export const logUserActivity = async (
  userId: string,
  userRole: 'seeker' | 'provider' | 'admin',
  action: string,
  details?: any,
  request?: NextRequest,
  customDescription?: string
) => {
  try {
    const description = customDescription || ACTIVITY_DESCRIPTIONS[action] || `User performed ${action}`;
    
    let ipAddress, userAgent;
    if (request) {
      const requestInfo = getRequestInfo(request);
      ipAddress = requestInfo.ipAddress;
      userAgent = requestInfo.userAgent;
    }
    
    // Log to database
    await Activity.logActivity(
      userId,
      userRole,
      action,
      description,
      details,
      ipAddress,
      userAgent
    );
    
    // Log to Winston
    logActivity(userId, action, { userRole, details, ipAddress });
    
  } catch (error) {
    console.error('Failed to log user activity:', error);
  }
};

// Specific activity logging functions
export const logAuthActivity = async (
  userId: string,
  userRole: 'seeker' | 'provider' | 'admin',
  action: 'login' | 'logout' | 'register',
  request?: NextRequest
) => {
  await logUserActivity(userId, userRole, action, {}, request);
};

export const logListingActivity = async (
  userId: string,
  userRole: 'seeker' | 'provider' | 'admin',
  action: string,
  listingId?: string,
  listingTitle?: string,
  request?: NextRequest
) => {
  await logUserActivity(userId, userRole, action, {
    listingId,
    listingTitle
  }, request);
};

export const logBookingActivity = async (
  userId: string,
  userRole: 'seeker' | 'provider' | 'admin',
  action: string,
  bookingId?: string,
  listingId?: string,
  request?: NextRequest
) => {
  await logUserActivity(userId, userRole, action, {
    bookingId,
    listingId
  }, request);
};

export const logAdminActivity = async (
  adminId: string,
  action: string,
  targetUserId?: string,
  targetUserRole?: string,
  request?: NextRequest
) => {
  await logUserActivity(adminId, 'admin', action, {
    targetUserId,
    targetUserRole
  }, request);
};

export const logSearchActivity = async (
  userId: string,
  userRole: 'seeker' | 'provider' | 'admin',
  searchQuery?: string,
  filters?: any,
  resultsCount?: number,
  request?: NextRequest
) => {
  await logUserActivity(userId, userRole, ACTIVITY_TYPES.SEARCH_PERFORM, {
    searchQuery,
    filters,
    resultsCount
  }, request);
};

// Get recent activities for dashboard
export const getRecentActivities = async (
  userId?: string,
  userRole?: string,
  limit: number = 10
) => {
  try {
    return await Activity.getRecentActivities(userId, userRole, limit);
  } catch (error) {
    console.error('Failed to get recent activities:', error);
    return [];
  }
};

// Get activity statistics
export const getActivityStats = async (timeRange: 'today' | '7d' | '30d' = '7d') => {
  try {
    return await Activity.getActivityStats(timeRange);
  } catch (error) {
    console.error('Failed to get activity stats:', error);
    return [];
  }
};
