import { bedspaceApi } from './bedspaceApi';
import type { User, Listing, BookingRequest, ApiResponse, PaginatedResponse } from '@/types';

interface AdminStats {
  totalUsers: number;
  totalProviders: number;
  totalSeekers: number;
  pendingProviders: number;
  approvedProviders: number;
  rejectedProviders: number;
  totalListings: number;
  activeListings: number;
  totalBookings: number;
  revenue: number;
  pendingApprovals: number;
  monthlyGrowth: {
    users: number;
    listings: number;
    bookings: number;
  };
}

interface AdminAnalytics {
  userGrowth: Array<{ month: string; users: number }>;
  listingGrowth: Array<{ month: string; listings: number }>;
  bookingGrowth: Array<{ month: string; bookings: number }>;
  topCities: Array<{ city: string; count: number }>;
}

interface AdminUserFilters {
  role?: 'seeker' | 'provider' | 'admin';
  verified?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

interface AdminListingFilters {
  approved?: boolean;
  active?: boolean;
  city?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface AdminBookingFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface AdminUserAction {
  userId: string;
  action: 'activate' | 'deactivate' | 'verify' | 'unverify';
}

interface AdminListingAction {
  listingId: string;
  action: 'approve' | 'reject' | 'activate' | 'deactivate';
}

export const adminApi = bedspaceApi.injectEndpoints({
  endpoints: builder => ({
    getAdminStats: builder.query<ApiResponse<AdminStats>, void>({
      query: () => '/admin/stats',
      providesTags: ['AdminStats'],
    }),

    getAdminAnalytics: builder.query<ApiResponse<AdminAnalytics>, void>({
      query: () => '/admin/analytics',
      providesTags: ['AdminStats'],
    }),

    getAdminUsers: builder.query<PaginatedResponse<User>, AdminUserFilters>({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
        return `/admin/users?${params.toString()}`;
      },
      providesTags: result =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'AdminUser' as const, id: _id })),
              { type: 'AdminUser', id: 'LIST' },
            ]
          : [{ type: 'AdminUser', id: 'LIST' }],
    }),

    getAdminListings: builder.query<PaginatedResponse<Listing>, AdminListingFilters>({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
        return `/admin/listings?${params.toString()}`;
      },
      providesTags: result =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'AdminListing' as const, id: _id })),
              { type: 'AdminListing', id: 'LIST' },
            ]
          : [{ type: 'AdminListing', id: 'LIST' }],
    }),

    getAdminBookings: builder.query<PaginatedResponse<BookingRequest>, AdminBookingFilters>({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
        return `/admin/bookings?${params.toString()}`;
      },
      providesTags: result =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'AdminBooking' as const, id: _id })),
              { type: 'AdminBooking', id: 'LIST' },
            ]
          : [{ type: 'AdminBooking', id: 'LIST' }],
    }),

    adminUserAction: builder.mutation<ApiResponse, AdminUserAction>({
      query: ({ userId, action }) => ({
        url: `/admin/users/${userId}/${action}`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'AdminUser', id: 'LIST' }, 'AdminStats', 'User'],
    }),

    adminListingAction: builder.mutation<ApiResponse, AdminListingAction>({
      query: ({ listingId, action }) => ({
        url: `/admin/listings/${listingId}/${action}`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'AdminListing', id: 'LIST' }, 'AdminStats', 'Listing'],
    }),

    getAdminProviders: builder.query<
      PaginatedResponse<User>,
      { search?: string; page?: number; limit?: number; status?: string }
    >({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
        return `/admin/providers?${params.toString()}`;
      },
      providesTags: result =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'AdminUser' as const, id: _id })),
              { type: 'AdminUser', id: 'PROVIDERS' },
            ]
          : [{ type: 'AdminUser', id: 'PROVIDERS' }],
    }),

    getAdminReports: builder.query<
      ApiResponse<any>,
      { type: string; dateFrom?: string; dateTo?: string }
    >({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.append(key, value);
        });
        return `/admin/reports?${searchParams.toString()}`;
      },
      providesTags: ['AdminStats'],
    }),

    getAdminSettings: builder.query<ApiResponse<any>, void>({
      query: () => '/admin/settings',
    }),

    updateAdminSettings: builder.mutation<ApiResponse, any>({
      query: settings => ({
        url: '/admin/settings',
        method: 'PUT',
        body: settings,
      }),
    }),

    updateProviderVerification: builder.mutation<
      ApiResponse<{
        providerId: string;
        verificationStatus: string;
        verifiedAt?: string;
        rejectionReason?: string;
      }>,
      { providerId: string; status: 'approved' | 'rejected' | 'pending'; rejectionReason?: string }
    >({
      query: ({ providerId, status, rejectionReason }) => ({
        url: '/admin/providers',
        method: 'PUT',
        body: { providerId, status, rejectionReason },
      }),
      invalidatesTags: (result, error, { providerId }) => [
        { type: 'AdminUser', id: providerId },
        { type: 'AdminUser', id: 'LIST' },
        { type: 'AdminUser', id: 'PROVIDERS' },
        'AdminStats',
      ],
    }),
  }),
});

export const {
  useGetAdminStatsQuery,
  useGetAdminAnalyticsQuery,
  useGetAdminUsersQuery,
  useGetAdminListingsQuery,
  useGetAdminBookingsQuery,
  useAdminUserActionMutation,
  useAdminListingActionMutation,
  useGetAdminProvidersQuery,
  useGetAdminReportsQuery,
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
  useUpdateProviderVerificationMutation,
} = adminApi;
