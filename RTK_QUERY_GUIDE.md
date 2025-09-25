# RTK Query Integration Guide

This guide explains how to use Redux Toolkit Query (RTK Query) in the BedSpace application for efficient API management, caching, and state management.

## 🏗️ Architecture Overview

The RTK Query setup consists of:

- **Base API**: `src/lib/api/bedspaceApi.ts` - Core configuration
- **API Slices**: Individual API endpoints organized by feature
- **Redux Store**: `src/lib/store.ts` - Configured with RTK Query middleware
- **Providers**: React components that wrap the app with Redux and Auth providers

## 📁 File Structure

```
src/lib/
├── api/
│   ├── bedspaceApi.ts      # Base API configuration
│   ├── authApi.ts          # Authentication endpoints
│   ├── adminApi.ts         # Admin endpoints
│   ├── seekerApi.ts        # Seeker endpoints
│   ├── providerApi.ts      # Provider endpoints
│   ├── commonApi.ts        # Common endpoints (notifications, messages, etc.)
│   └── index.ts            # Main exports
├── slices/
│   └── authSlice.ts        # Auth state management
├── store.ts                # Redux store configuration
└── hooks.ts                # Typed hooks
```

## 🚀 Quick Start

### 1. Using Query Hooks

Query hooks automatically fetch data and provide loading/error states:

```tsx
import { useGetAdminStatsQuery } from '@/lib/api/adminApi';

function AdminDashboard() {
  const {
    data, // API response data
    isLoading, // Loading state
    isError, // Error state
    error, // Error details
    refetch, // Manual refetch function
  } = useGetAdminStatsQuery();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return <div>Total Users: {data?.data?.totalUsers}</div>;
}
```

### 2. Using Mutation Hooks

Mutation hooks are for creating, updating, or deleting data:

```tsx
import { useLoginMutation } from '@/lib/api/authApi';

function LoginForm() {
  const [login, { isLoading, error }] = useLoginMutation();

  const handleSubmit = async formData => {
    try {
      const result = await login(formData).unwrap();
      console.log('Login successful:', result);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button disabled={isLoading}>{isLoading ? 'Logging in...' : 'Login'}</button>
      {error && <div>Error: {error.data?.error}</div>}
    </form>
  );
}
```

## 🎯 Available API Hooks

### Authentication APIs

```tsx
import {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
  useLogoutMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
} from '@/lib/api/authApi';
```

### Admin APIs

```tsx
import {
  useGetAdminStatsQuery,
  useGetAdminAnalyticsQuery,
  useGetAdminUsersQuery,
  useGetAdminListingsQuery,
  useGetAdminBookingsQuery,
  useAdminUserActionMutation,
  useAdminListingActionMutation,
} from '@/lib/api/adminApi';
```

### Seeker APIs

```tsx
import {
  useGetSeekerStatsQuery,
  useGetSeekerBookingsQuery,
  useGetSeekerFavoritesQuery,
  useSearchListingsQuery,
  useCreateBookingRequestMutation,
  useAddToFavoritesMutation,
} from '@/lib/api/seekerApi';
```

### Provider APIs

```tsx
import {
  useGetProviderStatsQuery,
  useGetProviderListingsQuery,
  useCreateListingMutation,
  useUpdateListingMutation,
  useUploadVerificationDocumentsMutation,
} from '@/lib/api/providerApi';
```

### Common APIs

```tsx
import {
  useGetNotificationsQuery,
  useGetConversationsQuery,
  useSendMessageMutation,
  useGetUserProfileQuery,
} from '@/lib/api/commonApi';
```

## 💡 Best Practices

### 1. Query Options

Use query options to control caching and fetching behavior:

```tsx
const { data } = useGetAdminStatsQuery(undefined, {
  pollingInterval: 30000, // Poll every 30 seconds
  refetchOnFocus: true, // Refetch when window regains focus
  staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
  skip: !isAdmin, // Skip query conditionally
});
```

### 2. Error Handling

Handle different types of errors appropriately:

```tsx
const [createListing, { error }] = useCreateListingMutation();

const handleSubmit = async data => {
  try {
    await createListing(data).unwrap();
  } catch (error) {
    if (error.status === 403) {
      // Handle authorization error
    } else if (error.status === 400) {
      // Handle validation error
    } else {
      // Handle network or server error
    }
  }
};
```

### 3. Optimistic Updates

For better UX, use optimistic updates:

```tsx
const [updateProfile] = useUpdateProfileMutation();

const handleUpdate = async newData => {
  // The mutation will automatically update the cache
  // and revert on error
  try {
    await updateProfile(newData).unwrap();
  } catch (error) {
    // Cache automatically reverted
    console.error('Update failed:', error);
  }
};
```

### 4. Conditional Queries

Skip queries when conditions aren't met:

```tsx
const { data: userProfile } = useGetUserProfileQuery(undefined, {
  skip: !isAuthenticated,
});

const { data: searchResults } = useSearchListingsQuery(filters, {
  skip: !filters.city || filters.city.length < 3,
});
```

### 5. Manual Refetching

Refetch data after mutations or user actions:

```tsx
const { refetch: refetchStats } = useGetAdminStatsQuery();
const [adminAction] = useAdminUserActionMutation();

const handleAction = async (userId, action) => {
  await adminAction({ userId, action });
  refetch(); // Refresh stats after action
};
```

## 🔄 Cache Management

RTK Query automatically manages caching. Key concepts:

### Tag-Based Invalidation

APIs use tags for intelligent cache invalidation:

```tsx
// When a user is updated, related caches are invalidated
providesTags: ['User', 'AdminStats'],
invalidatesTags: ['User', { type: 'AdminUser', id: 'LIST' }],
```

### Manual Cache Management

```tsx
import { useAppDispatch } from '@/lib/hooks';
import { apiUtil } from '@/lib/api';

const dispatch = useAppDispatch();

// Invalidate specific cache
dispatch(apiUtil.invalidateTags(['User']));

// Reset API state
dispatch(apiUtil.resetApiState());
```

## 🛠️ Advanced Usage

### Custom Base Query

The base query is configured in `bedspaceApi.ts`:

```tsx
const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include', // Include cookies for auth
  prepareHeaders: headers => {
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});
```

### Transforming Responses

Transform API responses before they reach components:

```tsx
getUsers: builder.query({
  query: () => '/admin/users',
  transformResponse: (response: ApiResponse<User[]>) => {
    return (
      response.data?.map(user => ({
        ...user,
        displayName: `${user.name} (${user.role})`,
      })) || []
    );
  },
});
```

### RTK Query DevTools

Enable Redux DevTools in development for debugging:

```tsx
// store.ts
export const store = configureStore({
  // ...
  devTools: process.env.NODE_ENV !== 'production',
});
```

## 🔧 Migration from Direct Fetch

### Before (Direct Fetch)

```tsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/stats');
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

### After (RTK Query)

```tsx
const { data, isLoading, error } = useGetAdminStatsQuery();
```

## 🐛 Troubleshooting

### Common Issues

1. **Hook not updating**: Ensure providers are properly configured in layout
2. **Cache not invalidating**: Check tag configuration in API definitions
3. **TypeScript errors**: Import types from `@/types` and use proper typing
4. **Network errors**: Check base URL and credentials configuration

### Debug Tools

- Use Redux DevTools to inspect cache state
- Check Network tab for actual API calls
- Use `refetch` function to manually trigger queries
- Log `error` objects to see detailed error information

## 📖 Additional Resources

- [RTK Query Documentation](https://redux-toolkit.js.org/rtk-query/overview)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)
- [TypeScript with RTK Query](https://redux-toolkit.js.org/rtk-query/usage/typescript)

---

This setup provides a robust, type-safe, and efficient way to handle API interactions in the BedSpace application with automatic caching, loading states, and error handling.
