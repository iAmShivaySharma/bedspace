import { bedspaceApi } from './bedspaceApi';
import { setUser, clearUser } from '../slices/authSlice';
import type { User, ApiResponse } from '@/types';

interface LoginRequest {
  identifier: string;
  password: string;
}

interface LoginResponse {
  user: User;
}

interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'seeker' | 'provider';
}

interface VerifyOtpRequest {
  type: 'email' | 'phone';
  otp: string;
}

interface ResendOtpRequest {
  type: 'email' | 'phone';
}

export const authApi = bedspaceApi.injectEndpoints({
  endpoints: builder => ({
    login: builder.mutation<ApiResponse<LoginResponse>, LoginRequest>({
      query: credentials => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth', 'User'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data?.user) {
            dispatch(setUser(data.data.user));
          }
        } catch (error) {
          console.error('Login failed:', error);
        }
      },
    }),

    register: builder.mutation<ApiResponse<LoginResponse>, RegisterRequest>({
      query: userData => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['Auth'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data?.user) {
            dispatch(setUser(data.data.user));
          }
        } catch (error) {
          console.error('Registration failed:', error);
        }
      },
    }),

    getCurrentUser: builder.query<ApiResponse<{ user: User }>, void>({
      query: () => '/auth/me',
      providesTags: ['Auth', 'User'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data?.user) {
            dispatch(setUser(data.data.user));
          } else {
            dispatch(clearUser());
          }
        } catch (error) {
          dispatch(clearUser());
        }
      },
    }),

    logout: builder.mutation<ApiResponse, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'User'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        dispatch(clearUser());
        try {
          await queryFulfilled;
        } catch (error) {
          console.error('Logout failed:', error);
        }
      },
    }),

    verifyOtp: builder.mutation<ApiResponse<LoginResponse>, VerifyOtpRequest>({
      query: otpData => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body: otpData,
      }),
      invalidatesTags: ['Auth', 'User'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data?.user) {
            dispatch(setUser(data.data.user));
          }
        } catch (error) {
          console.error('OTP verification failed:', error);
        }
      },
    }),

    resendOtp: builder.mutation<ApiResponse, ResendOtpRequest>({
      query: data => ({
        url: '/auth/resend-otp',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
  useLogoutMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
} = authApi;
