import { bedspaceApi } from './bedspaceApi';
import type {
  Listing,
  BookingRequest,
  VerificationDocument,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

interface ProviderStats {
  totalListings: number;
  activeListings: number;
  totalBookings: number;
  pendingBookings: number;
  monthlyBookings: number;
  rating: number;
  totalReviews: number;
}

interface CreateListingPayload {
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  rent: number;
  securityDeposit: number;
  roomType: 'single' | 'shared' | 'private';
  genderPreference: 'male' | 'female' | 'any';
  facilities: string[];
  availableFrom: string;
}

interface UpdateListingPayload extends Partial<CreateListingPayload> {
  listingId: string;
}

interface BookingResponsePayload {
  bookingId: string;
  action: 'approve' | 'reject';
  responseMessage?: string;
}

interface VerificationStatus {
  status: 'pending' | 'approved' | 'rejected';
  documents: VerificationDocument[];
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export const providerApi = bedspaceApi.injectEndpoints({
  endpoints: builder => ({
    getProviderStats: builder.query<ApiResponse<ProviderStats>, void>({
      query: () => '/providers/stats',
      providesTags: ['ProviderStats'],
    }),

    getProviderListings: builder.query<
      PaginatedResponse<Listing>,
      { page?: number; limit?: number; status?: string }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.append(key, value.toString());
        });
        return `/providers/listings?${searchParams.toString()}`;
      },
      providesTags: result =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'ProviderListing' as const, id: _id })),
              { type: 'ProviderListing', id: 'LIST' },
            ]
          : [{ type: 'ProviderListing', id: 'LIST' }],
    }),

    getProviderBookings: builder.query<
      PaginatedResponse<BookingRequest>,
      { page?: number; limit?: number; status?: string }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.append(key, value.toString());
        });
        return `/providers/bookings?${searchParams.toString()}`;
      },
      providesTags: result =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'BookingRequest' as const, id: _id })),
              { type: 'BookingRequest', id: 'LIST' },
            ]
          : [{ type: 'BookingRequest', id: 'LIST' }],
    }),

    createListing: builder.mutation<ApiResponse<Listing>, CreateListingPayload>({
      query: listingData => ({
        url: '/providers/listings',
        method: 'POST',
        body: listingData,
      }),
      invalidatesTags: [{ type: 'ProviderListing', id: 'LIST' }, 'ProviderStats', 'Listing'],
    }),

    updateListing: builder.mutation<ApiResponse<Listing>, UpdateListingPayload>({
      query: ({ listingId, ...listingData }) => ({
        url: `/providers/listings/${listingId}`,
        method: 'PUT',
        body: listingData,
      }),
      invalidatesTags: (result, error, { listingId }) => [
        { type: 'ProviderListing', id: listingId },
        { type: 'ProviderListing', id: 'LIST' },
        { type: 'Listing', id: listingId },
      ],
    }),

    deleteListing: builder.mutation<ApiResponse, string>({
      query: listingId => ({
        url: `/providers/listings/${listingId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, listingId) => [
        { type: 'ProviderListing', id: listingId },
        { type: 'ProviderListing', id: 'LIST' },
        { type: 'Listing', id: listingId },
        'ProviderStats',
      ],
    }),

    toggleListingStatus: builder.mutation<
      ApiResponse<Listing>,
      { listingId: string; isActive: boolean }
    >({
      query: ({ listingId, isActive }) => ({
        url: `/providers/listings/${listingId}/toggle`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: (result, error, { listingId }) => [
        { type: 'ProviderListing', id: listingId },
        { type: 'ProviderListing', id: 'LIST' },
        { type: 'Listing', id: listingId },
      ],
    }),

    respondToBooking: builder.mutation<ApiResponse<BookingRequest>, BookingResponsePayload>({
      query: ({ bookingId, action, responseMessage }) => ({
        url: `/providers/bookings/${bookingId}/${action}`,
        method: 'POST',
        body: { responseMessage },
      }),
      invalidatesTags: (result, error, { bookingId }) => [
        { type: 'BookingRequest', id: bookingId },
        { type: 'BookingRequest', id: 'LIST' },
        'ProviderStats',
      ],
    }),

    getVerificationStatus: builder.query<ApiResponse<VerificationStatus>, void>({
      query: () => '/providers/verification',
      providesTags: ['ProviderVerification'],
    }),

    getVerificationDocuments: builder.query<ApiResponse<VerificationDocument[]>, void>({
      query: () => '/providers/verification-documents',
      providesTags: ['ProviderVerification'],
    }),

    uploadVerificationDocuments: builder.mutation<ApiResponse<VerificationDocument[]>, FormData>({
      query: formData => ({
        url: '/providers/upload-documents',
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['ProviderVerification', 'User'],
    }),

    submitForVerification: builder.mutation<ApiResponse, void>({
      query: () => ({
        url: '/providers/verification',
        method: 'POST',
      }),
      invalidatesTags: ['ProviderVerification', 'User'],
    }),

    uploadListingImages: builder.mutation<
      ApiResponse<{ images: string[] }>,
      { listingId: string; formData: FormData }
    >({
      query: ({ listingId, formData }) => ({
        url: `/providers/listings/${listingId}/images`,
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: (result, error, { listingId }) => [
        { type: 'ProviderListing', id: listingId },
        { type: 'Listing', id: listingId },
      ],
    }),

    deleteListingImage: builder.mutation<ApiResponse, { listingId: string; imageId: string }>({
      query: ({ listingId, imageId }) => ({
        url: `/providers/listings/${listingId}/images/${imageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { listingId }) => [
        { type: 'ProviderListing', id: listingId },
        { type: 'Listing', id: listingId },
      ],
    }),

    setPrimaryImage: builder.mutation<ApiResponse, { listingId: string; imageId: string }>({
      query: ({ listingId, imageId }) => ({
        url: `/providers/listings/${listingId}/images/${imageId}/primary`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { listingId }) => [
        { type: 'ProviderListing', id: listingId },
        { type: 'Listing', id: listingId },
      ],
    }),

    // Stripe Payment APIs
    getPaymentData: builder.query<
      ApiResponse<any>,
      { type?: string; page?: number; limit?: number }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.append(key, value.toString());
        });
        return `/providers/payments?${searchParams.toString()}`;
      },
      providesTags: ['ProviderPayments'],
    }),

    setupStripeAccount: builder.mutation<
      ApiResponse<{ accountId: string; onboardingUrl: string }>,
      void
    >({
      query: () => ({
        url: '/providers/payments/setup',
        method: 'POST',
      }),
      invalidatesTags: ['ProviderPayments'],
    }),

    getStripeAccountStatus: builder.query<ApiResponse<any>, void>({
      query: () => '/providers/payments/setup',
      providesTags: ['ProviderPayments'],
    }),

    requestPayout: builder.mutation<
      ApiResponse<any>,
      { amount: number; method?: 'standard' | 'instant' }
    >({
      query: payoutData => ({
        url: '/providers/payments/payout',
        method: 'POST',
        body: payoutData,
      }),
      invalidatesTags: ['ProviderPayments'],
    }),

    getPayoutHistory: builder.query<PaginatedResponse<any>, { page?: number; limit?: number }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.append(key, value.toString());
        });
        return `/providers/payments/payout?${searchParams.toString()}`;
      },
      providesTags: ['ProviderPayments'],
    }),
  }),
});

export const {
  useGetProviderStatsQuery,
  useGetProviderListingsQuery,
  useGetProviderBookingsQuery,
  useCreateListingMutation,
  useUpdateListingMutation,
  useDeleteListingMutation,
  useToggleListingStatusMutation,
  useRespondToBookingMutation,
  useGetVerificationStatusQuery,
  useGetVerificationDocumentsQuery,
  useUploadVerificationDocumentsMutation,
  useSubmitForVerificationMutation,
  useUploadListingImagesMutation,
  useDeleteListingImageMutation,
  useSetPrimaryImageMutation,
  useGetPaymentDataQuery,
  useSetupStripeAccountMutation,
  useGetStripeAccountStatusQuery,
  useRequestPayoutMutation,
  useGetPayoutHistoryQuery,
} = providerApi;
