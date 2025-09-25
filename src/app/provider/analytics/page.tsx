'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import VerificationRequired from '@/components/ui/verification-required';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGetProviderStatsQuery, useGetProviderListingsQuery } from '@/lib/api/providerApi';
import { useGetCurrentUserQuery } from '@/lib/api/authApi';
import type { Provider } from '@/types';
import {
  BarChart3,
  Building,
  Calendar,
  Eye,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Star,
  Activity,
} from 'lucide-react';

interface ProviderStats {
  totalListings: number;
  activeListings: number;
  totalBookings: number;
  pendingBookings: number;
  monthlyBookings: number;
  rating: number;
  totalReviews: number;
}

export default function ProviderAnalyticsPage() {
  const router = useRouter();

  const { data: userResponse } = useGetCurrentUserQuery();
  const { data: statsResponse, isLoading: statsLoading } = useGetProviderStatsQuery();
  const { data: listingsResponse, isLoading: listingsLoading } = useGetProviderListingsQuery({
    page: 1,
    limit: 5,
  });

  const user = userResponse?.data?.user as Provider | undefined;
  const stats: ProviderStats = statsResponse?.data || {
    totalListings: 0,
    activeListings: 0,
    totalBookings: 0,
    pendingBookings: 0,
    monthlyBookings: 0,
    rating: 0,
    totalReviews: 0,
  };
  const recentListings = listingsResponse?.data || [];

  if (!user || user.role !== 'provider') {
    router.push('/dashboard');
    return null;
  }

  // Show verification required if not approved
  if (user.verificationStatus !== 'approved') {
    return (
      <DashboardLayout title='Provider Analytics'>
        <VerificationRequired
          title='Provider Verification Required'
          description='You must be verified to view analytics and performance data.'
          verificationStatus={user.verificationStatus as any}
        />
      </DashboardLayout>
    );
  }

  if (statsLoading && listingsLoading) {
    return <PageSkeleton type='analytics' />;
  }

  return (
    <DashboardLayout title='Provider Analytics'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Analytics Dashboard</h1>
            <p className='text-gray-600'>Track your property performance and bookings</p>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {/* Total Listings */}
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Listings</CardTitle>
              <Building className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.totalListings}</div>
              <p className='text-xs text-muted-foreground'>{stats.activeListings} active</p>
            </CardContent>
          </Card>

          {/* Total Bookings */}
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Bookings</CardTitle>
              <Calendar className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.totalBookings}</div>
              <p className='text-xs text-muted-foreground'>{stats.pendingBookings} pending</p>
            </CardContent>
          </Card>

          {/* Monthly Bookings */}
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>This Month</CardTitle>
              <TrendingUp className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.monthlyBookings}</div>
              <p className='text-xs text-muted-foreground'>Bookings this month</p>
            </CardContent>
          </Card>

          {/* Average Rating */}
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Average Rating</CardTitle>
              <Star className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.rating.toFixed(1)}</div>
              <p className='text-xs text-muted-foreground'>From {stats.totalReviews} reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Booking Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Activity className='w-5 h-5 mr-2' />
                Booking Status
              </CardTitle>
              <CardDescription>Current status of your bookings</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-yellow-400 rounded-full'></div>
                  <span className='text-sm'>Pending</span>
                </div>
                <span className='font-semibold'>{stats.pendingBookings}</span>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                  <span className='text-sm'>Approved</span>
                </div>
                <span className='font-semibold'>{stats.totalBookings - stats.pendingBookings}</span>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                  <span className='text-sm'>Total</span>
                </div>
                <span className='font-semibold'>{stats.totalBookings}</span>
              </div>
            </CardContent>
          </Card>

          {/* Listing Status */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Building className='w-5 h-5 mr-2' />
                Listing Performance
              </CardTitle>
              <CardDescription>Status of your property listings</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                  <span className='text-sm'>Active Listings</span>
                </div>
                <span className='font-semibold'>{stats.activeListings}</span>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-gray-400 rounded-full'></div>
                  <span className='text-sm'>Inactive Listings</span>
                </div>
                <span className='font-semibold'>{stats.totalListings - stats.activeListings}</span>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                  <span className='text-sm'>Total Listings</span>
                </div>
                <span className='font-semibold'>{stats.totalListings}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Listings Performance */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <BarChart3 className='w-5 h-5 mr-2' />
              Recent Listings Performance
            </CardTitle>
            <CardDescription>View and booking statistics for your latest listings</CardDescription>
          </CardHeader>
          <CardContent>
            {recentListings.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                <Building className='w-12 h-12 mx-auto mb-4 text-gray-400' />
                <p>No listings found. Create your first listing to see performance data.</p>
              </div>
            ) : (
              <div className='space-y-4'>
                {recentListings.slice(0, 5).map((listing: any) => (
                  <div
                    key={listing._id}
                    className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                  >
                    <div className='flex-1'>
                      <h4 className='font-medium text-gray-900'>{listing.title}</h4>
                      <p className='text-sm text-gray-500'>{listing.address}</p>
                    </div>
                    <div className='flex items-center space-x-6 text-sm text-gray-600'>
                      <div className='flex items-center space-x-1'>
                        <Eye className='w-4 h-4' />
                        <span>{listing.viewCount || 0} views</span>
                      </div>
                      <div className='flex items-center space-x-1'>
                        <Calendar className='w-4 h-4' />
                        <span>{listing.bookingCount || 0} bookings</span>
                      </div>
                      <div className='flex items-center space-x-1'>
                        <DollarSign className='w-4 h-4' />
                        <span>₹{listing.rent?.toLocaleString()}</span>
                      </div>
                      <Badge variant={listing.isActive ? 'default' : 'secondary'}>
                        {listing.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your properties and bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <button
                onClick={() => router.push('/provider/listings/new')}
                className='p-4 border border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left'
              >
                <Building className='w-8 h-8 text-blue-600 mb-2' />
                <h4 className='font-medium text-gray-900 mb-1'>Add New Listing</h4>
                <p className='text-sm text-gray-500'>Create a new property listing</p>
              </button>

              <button
                onClick={() => router.push('/provider/bookings')}
                className='p-4 border border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left'
              >
                <Calendar className='w-8 h-8 text-green-600 mb-2' />
                <h4 className='font-medium text-gray-900 mb-1'>Manage Bookings</h4>
                <p className='text-sm text-gray-500'>Review and respond to booking requests</p>
              </button>

              <button
                onClick={() => router.push('/provider/listings')}
                className='p-4 border border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left'
              >
                <Eye className='w-8 h-8 text-purple-600 mb-2' />
                <h4 className='font-medium text-gray-900 mb-1'>View All Listings</h4>
                <p className='text-sm text-gray-500'>Manage your property listings</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
