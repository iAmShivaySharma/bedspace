import { bedspaceApi } from './bedspaceApi';
import type {
  Listing,
  BookingRequest,
  User,
  SearchFilters,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

interface SeekerStats {
  totalBookings: number;
  activeBookings: number;
  favorites: number;
  recentActivities: number;
}

interface SeekerActivity {
  _id: string;
  type: 'booking_request' | 'favorite_added' | 'message_sent' | 'profile_updated';
  description: string;
  metadata: any;
  createdAt: string;
}

interface BookingRequestPayload {
  listingId: string;
  message: string;
  requestedDate: string;
}

interface CreatePaymentIntentPayload {
  listingId: string;
  checkInDate: string;
  duration: number;
  notes?: string;
}

interface ConfirmPaymentPayload {
  paymentIntentId: string;
}

interface FavoritePayload {
  listingId: string;
}

export const seekerApi = bedspaceApi.injectEndpoints({
  endpoints: builder => ({
    getSeekerStats: builder.query<ApiResponse<SeekerStats>, void>({
      query: () => '/seeker/stats',
      providesTags: ['SeekerStats'],
    }),

    getSeekerBookings: builder.query<
      PaginatedResponse<BookingRequest>,
      { page?: number; limit?: number; status?: string }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.append(key, value.toString());
        });
        return `/seeker/bookings?${searchParams.toString()}`;
      },
      providesTags: result =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'SeekerBooking' as const, id: _id })),
              { type: 'SeekerBooking', id: 'LIST' },
            ]
          : [{ type: 'SeekerBooking', id: 'LIST' }],
    }),

    getSeekerFavorites: builder.query<
      PaginatedResponse<Listing>,
      { page?: number; limit?: number }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.append(key, value.toString());
        });
        return `/seeker/favorites?${searchParams.toString()}`;
      },
      providesTags: result =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'SeekerFavorite' as const, id: _id })),
              { type: 'SeekerFavorite', id: 'LIST' },
            ]
          : [{ type: 'SeekerFavorite', id: 'LIST' }],
    }),

    getSeekerActivities: builder.query<
      PaginatedResponse<SeekerActivity>,
      { page?: number; limit?: number }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.append(key, value.toString());
        });
        return `/seeker/activities?${searchParams.toString()}`;
      },
      providesTags: result =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'SeekerActivity' as const, id: _id })),
              { type: 'SeekerActivity', id: 'LIST' },
            ]
          : [{ type: 'SeekerActivity', id: 'LIST' }],
    }),

    createBookingRequest: builder.mutation<ApiResponse<BookingRequest>, BookingRequestPayload>({
      query: bookingData => ({
        url: '/seeker/bookings',
        method: 'POST',
        body: bookingData,
      }),
      invalidatesTags: [
        { type: 'SeekerBooking', id: 'LIST' },
        'SeekerStats',
        { type: 'SeekerActivity', id: 'LIST' },
      ],
    }),

    cancelBookingRequest: builder.mutation<ApiResponse, string>({
      query: bookingId => ({
        url: `/seeker/bookings/${bookingId}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'SeekerBooking', id: 'LIST' },
        'SeekerStats',
        { type: 'SeekerActivity', id: 'LIST' },
      ],
    }),

    addToFavorites: builder.mutation<ApiResponse, FavoritePayload>({
      query: data => ({
        url: '/seeker/favorites',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'SeekerFavorite', id: 'LIST' },
        'SeekerStats',
        { type: 'SeekerActivity', id: 'LIST' },
      ],
    }),

    removeFromFavorites: builder.mutation<ApiResponse, string>({
      query: listingId => ({
        url: `/seeker/favorites/${listingId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'SeekerFavorite', id: 'LIST' },
        'SeekerStats',
        { type: 'SeekerActivity', id: 'LIST' },
      ],
    }),

    searchListings: builder.query<PaginatedResponse<Listing>, SearchFilters>({
      query: filters => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(key, v));
            } else {
              params.append(key, value.toString());
            }
          }
        });
        return `/search?${params.toString()}`;
      },
      providesTags: result =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Listing' as const, id: _id })),
              { type: 'Listing', id: 'SEARCH' },
            ]
          : [{ type: 'Listing', id: 'SEARCH' }],
    }),

    getListingById: builder.query<ApiResponse<Listing>, string>({
      query: listingId => `/listings/${listingId}`,
      providesTags: (result, error, id) => [{ type: 'Listing', id }],
    }),

    createPaymentIntent: builder.mutation<ApiResponse<any>, CreatePaymentIntentPayload>({
      query: paymentData => ({
        url: '/payments/create-intent',
        method: 'POST',
        body: paymentData,
      }),
    }),

    confirmPayment: builder.mutation<ApiResponse<any>, ConfirmPaymentPayload>({
      query: data => ({
        url: '/payments/confirm',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'SeekerBooking', id: 'LIST' }, 'SeekerStats'],
    }),
  }),
});

export const {
  useGetSeekerStatsQuery,
  useGetSeekerBookingsQuery,
  useGetSeekerFavoritesQuery,
  useGetSeekerActivitiesQuery,
  useCreateBookingRequestMutation,
  useCancelBookingRequestMutation,
  useSearchListingsQuery,
  useGetListingByIdQuery,
  useCreatePaymentIntentMutation,
  useConfirmPaymentMutation,
} = seekerApi;
