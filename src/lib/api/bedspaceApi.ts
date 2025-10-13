import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ApiResponse, PaginatedResponse } from '@/types';

export const bedspaceApi = createApi({
  reducerPath: 'bedspaceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    credentials: 'include', // Include cookies for auth
    prepareHeaders: (headers, { getState }) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: [
    'User',
    'Auth',
    'Listing',
    'BookingRequest',
    'Message',
    'Conversation',
    'AdminStats',
    'AdminUser',
    'AdminListing',
    'AdminBooking',
    'SeekerStats',
    'SeekerBooking',
    'SeekerFavorite',
    'SeekerActivity',
    'ProviderStats',
    'ProviderListing',
    'ProviderVerification',
    'ProviderPayments',
    'Notification',
    'Activity',
    'Profile',
    'Favorite',
    'Visit',
    'PublicSettings',
  ],
  endpoints: () => ({}),
});

export const { util: apiUtil } = bedspaceApi;
