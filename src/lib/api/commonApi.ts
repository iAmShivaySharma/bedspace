import { bedspaceApi } from './bedspaceApi';
import type { Message, Conversation, User, ApiResponse, PaginatedResponse } from '@/types';

interface NotificationData {
  _id: string;
  userId: string;
  type:
    | 'booking_request'
    | 'booking_response'
    | 'message'
    | 'listing_approved'
    | 'verification_status';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

interface MessagePayload {
  conversationId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file';
}

interface CreateConversationPayload {
  participantId: string;
  initialMessage?: string;
  listingId?: string;
  listingTitle?: string;
}

interface LocationData {
  city: string;
  state: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export const commonApi = bedspaceApi.injectEndpoints({
  endpoints: builder => ({
    getNotifications: builder.query<
      PaginatedResponse<NotificationData>,
      { page?: number; limit?: number }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.append(key, value.toString());
        });
        return `/notifications?${searchParams.toString()}`;
      },
      providesTags: result =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Notification' as const, id: _id })),
              { type: 'Notification', id: 'LIST' },
            ]
          : [{ type: 'Notification', id: 'LIST' }],
    }),

    getUnreadNotificationCount: builder.query<ApiResponse<{ count: number }>, void>({
      query: () => '/notifications/count',
      providesTags: ['Notification'],
    }),

    markNotificationAsRead: builder.mutation<ApiResponse, string>({
      query: notificationId => ({
        url: `/notifications/${notificationId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }, 'Notification'],
    }),

    markAllNotificationsAsRead: builder.mutation<ApiResponse, void>({
      query: () => ({
        url: '/notifications/mark-all-read',
        method: 'PATCH',
      }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }, 'Notification'],
    }),

    getConversations: builder.query<
      PaginatedResponse<Conversation>,
      { page?: number; limit?: number }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.append(key, value.toString());
        });
        return `/messages/conversations?${searchParams.toString()}`;
      },
      providesTags: result =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Conversation' as const, id: _id })),
              { type: 'Conversation', id: 'LIST' },
            ]
          : [{ type: 'Conversation', id: 'LIST' }],
    }),

    getMessages: builder.query<
      PaginatedResponse<Message>,
      { conversationId: string; page?: number; limit?: number }
    >({
      query: ({ conversationId, ...params }) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.append(key, value.toString());
        });
        return `/messages/${conversationId}?${searchParams.toString()}`;
      },
      providesTags: (result, error, { conversationId }) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Message' as const, id: _id })),
              { type: 'Message', id: conversationId },
            ]
          : [{ type: 'Message', id: conversationId }],
    }),

    sendMessage: builder.mutation<ApiResponse<Message>, MessagePayload>({
      query: messageData => ({
        url: '/messages',
        method: 'POST',
        body: messageData,
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: 'Message', id: conversationId },
        { type: 'Conversation', id: 'LIST' },
      ],
    }),

    createConversation: builder.mutation<ApiResponse<Conversation>, CreateConversationPayload>({
      query: data => ({
        url: '/messages/conversations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Conversation', id: 'LIST' }],
    }),

    getUnreadMessageCount: builder.query<ApiResponse<{ count: number }>, void>({
      query: () => '/messages/unread-count',
      providesTags: ['Message'],
    }),

    markMessagesAsRead: builder.mutation<ApiResponse, string>({
      query: conversationId => ({
        url: `/messages/${conversationId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, conversationId) => [
        { type: 'Message', id: conversationId },
        { type: 'Conversation', id: 'LIST' },
        'Message',
      ],
    }),

    getUserProfile: builder.query<ApiResponse<User>, void>({
      query: () => '/profile',
      providesTags: ['Profile'],
    }),

    updateProfile: builder.mutation<ApiResponse<User>, Partial<User>>({
      query: profileData => ({
        url: '/profile',
        method: 'PUT',
        body: profileData,
      }),
      invalidatesTags: ['Profile', 'User', 'Auth'],
    }),

    uploadProfileImage: builder.mutation<ApiResponse<{ avatarUrl: string }>, FormData>({
      query: formData => ({
        url: '/profile/avatar',
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['Profile', 'User', 'Auth'],
    }),

    detectLocation: builder.mutation<
      ApiResponse<LocationData>,
      { latitude: number; longitude: number }
    >({
      query: coordinates => ({
        url: '/location/detect',
        method: 'POST',
        body: coordinates,
      }),
    }),

    getRecentActivities: builder.query<ApiResponse<any[]>, { limit?: number }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.append(key, value.toString());
        });
        return `/activities/recent?${searchParams.toString()}`;
      },
      providesTags: ['Activity'],
    }),

    getPresignedUploadUrl: builder.mutation<
      ApiResponse<{ uploadUrl: string; fileKey: string }>,
      { fileName: string; fileType: string }
    >({
      query: data => ({
        url: '/upload/presigned-url',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useCreateConversationMutation,
  useGetUnreadMessageCountQuery,
  useMarkMessagesAsReadMutation,
  useGetUserProfileQuery,
  useUpdateProfileMutation,
  useUploadProfileImageMutation,
  useDetectLocationMutation,
  useGetRecentActivitiesQuery,
  useGetPresignedUploadUrlMutation,
} = commonApi;
