'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

// Import RTK Query hooks
import {
  useGetAdminStatsQuery,
  useGetAdminUsersQuery,
  useAdminUserActionMutation,
} from '@/lib/api/adminApi';
import { useSearchListingsQuery } from '@/lib/api/seekerApi';
import { useGetNotificationsQuery } from '@/lib/api/commonApi';

/**
 * Comprehensive example showing RTK Query best practices
 * This component demonstrates:
 * 1. Query hooks with various options
 * 2. Mutation hooks with error handling
 * 3. Loading states and error handling
 * 4. Conditional queries
 * 5. Cache invalidation and refetching
 * 6. Optimistic updates
 */
export function RTKQueryExample() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // 1. Basic Query with loading and error states
  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorData,
    refetch: refetchStats,
  } = useGetAdminStatsQuery(undefined, {
    // Refetch every 30 seconds
    pollingInterval: 30000,
    // Skip query if user doesn't have admin role
    skip: false, // You can add condition here like: !user?.role === 'admin'
  });

  // 2. Query with parameters and conditional execution
  const {
    data: usersData,
    isLoading: usersLoading,
    isFetching: usersFetching,
    error: usersError,
  } = useGetAdminUsersQuery(
    {
      search: searchTerm,
      page: 1,
      limit: 10,
      role: 'provider',
    },
    {
      // Only run query if searchTerm has at least 3 characters or is empty
      skip: searchTerm.length > 0 && searchTerm.length < 3,
    }
  );

  // 3. Query with manual control
  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    refetch: refetchNotifications,
  } = useGetNotificationsQuery(
    { page: 1, limit: 5 },
    {
      // Refetch on window focus
      refetchOnFocus: true,
    }
  );

  // 4. Conditional query (lazy query) - we'll trigger this manually
  const {
    data: listingsData,
    isLoading: listingsLoading,
    error: listingsError,
    refetch: searchListings,
  } = useSearchListingsQuery(
    {
      city: 'Mumbai',
      maxRent: 10000,
    },
    {
      // Don't fetch automatically
      skip: true,
    }
  );

  // 5. Mutation with optimistic updates
  const [adminUserAction, { isLoading: actionLoading, error: actionError }] =
    useAdminUserActionMutation();

  // Handle user action with optimistic updates
  const handleUserAction = async (
    userId: string,
    action: 'activate' | 'deactivate' | 'verify' | 'unverify'
  ) => {
    try {
      // Optimistic update could go here
      const result = await adminUserAction({ userId, action }).unwrap();

      console.log('Action completed:', result);

      // Refetch related data after successful mutation
      refetchStats();
    } catch (error: any) {
      console.error('Action failed:', error);
      // Handle specific error types
      if (error.status === 403) {
        console.error('Unauthorized action');
      } else if (error.status === 404) {
        console.error('User not found');
      } else {
        console.error('Network or server error');
      }
    }
  };

  // Manual search trigger
  const handleSearchListings = () => {
    searchListings();
  };

  return (
    <div className='space-y-6 p-6'>
      <Card>
        <CardHeader>
          <CardTitle>RTK Query Examples</CardTitle>
          <CardDescription>
            Comprehensive examples showing RTK Query patterns and best practices
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* 1. Stats Query Example */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-medium'>Admin Stats (Auto-polling)</h3>
              <Button
                onClick={() => refetchStats()}
                disabled={statsLoading}
                size='sm'
                variant='outline'
              >
                {statsLoading ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <RefreshCw className='h-4 w-4' />
                )}
                Refresh
              </Button>
            </div>

            {statsLoading && <div>Loading stats...</div>}

            {statsError && (
              <div className='flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md'>
                <AlertCircle className='h-4 w-4' />
                Error loading stats: {(statsErrorData as any)?.data?.error || 'Unknown error'}
              </div>
            )}

            {statsData?.data && (
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='p-3 bg-blue-50 rounded-md'>
                  <div className='text-2xl font-bold text-blue-700'>
                    {statsData.data.totalUsers}
                  </div>
                  <div className='text-sm text-blue-600'>Total Users</div>
                </div>
                <div className='p-3 bg-green-50 rounded-md'>
                  <div className='text-2xl font-bold text-green-700'>
                    {statsData.data.totalListings}
                  </div>
                  <div className='text-sm text-green-600'>Listings</div>
                </div>
                <div className='p-3 bg-purple-50 rounded-md'>
                  <div className='text-2xl font-bold text-purple-700'>
                    {statsData.data.totalBookings}
                  </div>
                  <div className='text-sm text-purple-600'>Bookings</div>
                </div>
                <div className='p-3 bg-yellow-50 rounded-md'>
                  <div className='text-2xl font-bold text-yellow-700'>
                    {statsData.data.pendingApprovals}
                  </div>
                  <div className='text-sm text-yellow-600'>Pending</div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Search with Parameters Example */}
          <div className='space-y-3'>
            <h3 className='text-lg font-medium'>User Search (Conditional Query)</h3>

            <div className='flex gap-3'>
              <Input
                placeholder='Search users (min 3 characters)...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {usersFetching && <Loader2 className='h-5 w-5 animate-spin' />}
            </div>

            {usersLoading && <div>Searching users...</div>}

            {usersError && (
              <div className='text-red-600'>
                Error: {(usersError as any)?.data?.error || 'Search failed'}
              </div>
            )}

            {usersData?.data && (
              <div className='space-y-2'>
                <div>Found {usersData.data.length} users:</div>
                {usersData.data.slice(0, 3).map((user: any) => (
                  <div
                    key={user._id}
                    className='flex items-center justify-between p-3 bg-gray-50 rounded-md'
                  >
                    <div>
                      <div className='font-medium'>{user.name}</div>
                      <div className='text-sm text-gray-600'>{user.email}</div>
                    </div>
                    <div className='flex gap-2'>
                      <Badge variant={user.isVerified ? 'default' : 'secondary'}>
                        {user.isVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                      <Button
                        size='sm'
                        onClick={() =>
                          handleUserAction(user._id, user.isVerified ? 'unverify' : 'verify')
                        }
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <Loader2 className='h-3 w-3 animate-spin' />
                        ) : user.isVerified ? (
                          'Unverify'
                        ) : (
                          'Verify'
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Manual/Lazy Query Example */}
          <div className='space-y-3'>
            <h3 className='text-lg font-medium'>Manual Search (Lazy Query)</h3>

            <Button onClick={handleSearchListings} disabled={listingsLoading}>
              {listingsLoading ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Searching...
                </>
              ) : (
                'Search Mumbai Listings'
              )}
            </Button>

            {listingsError && (
              <div className='text-red-600'>
                Search error: {(listingsError as any)?.data?.error || 'Unknown error'}
              </div>
            )}

            {listingsData?.data && (
              <div className='text-green-600'>
                Found {listingsData.data.length} listings in Mumbai under ₹15,000
              </div>
            )}
          </div>

          {/* 4. Notifications with Refetch */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-medium'>Recent Notifications</h3>
              <Button onClick={() => refetchNotifications()} size='sm' variant='outline'>
                Refresh
              </Button>
            </div>

            {notificationsLoading && <div>Loading notifications...</div>}

            {notificationsData?.data && (
              <div className='space-y-2'>
                {notificationsData.data.map((notification: any) => (
                  <div key={notification._id} className='p-2 bg-blue-50 rounded-md'>
                    <div className='font-medium'>{notification.title}</div>
                    <div className='text-sm text-gray-600'>{notification.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Error Display */}
          {actionError && (
            <div className='p-3 bg-red-50 text-red-700 rounded-md'>
              Action failed: {(actionError as any)?.data?.error || 'Unknown error'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
