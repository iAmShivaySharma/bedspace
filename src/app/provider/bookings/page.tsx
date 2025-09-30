'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import VerificationRequired from '@/components/ui/verification-required';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetProviderBookingsQuery, useRespondToBookingMutation } from '@/lib/api/providerApi';
import { useGetCurrentUserQuery } from '@/lib/api/authApi';
import { Calendar, Clock, User, MessageSquare, Check, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Provider } from '@/types';

type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

interface BookingRequest {
  _id: string;
  listingId: {
    _id: string;
    title: string;
    rent: number;
    address: string;
  };
  seekerId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  status: BookingStatus;
  message: string;
  requestedDate: string;
  responseMessage?: string;
  respondedAt?: string;
  createdAt: string;
}

export default function ProviderBookingsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [respondToBooking] = useRespondToBookingMutation();

  const { data: userResponse } = useGetCurrentUserQuery();
  const {
    data: bookingsResponse,
    isLoading,
    error,
    refetch,
  } = useGetProviderBookingsQuery({
    page: 1,
    limit: 20,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const user = userResponse?.data as unknown as Provider;
  const bookings = bookingsResponse?.data || [];

  if (!user || user.role !== 'provider') {
    router.push('/dashboard');
    return null;
  }

  // Show verification required if not approved
  if (user.verificationStatus !== 'approved') {
    return (
      <DashboardLayout title='Booking Requests'>
        <VerificationRequired
          title='Provider Verification Required'
          description='You must be verified to manage bookings and accept requests.'
          verificationStatus={user.verificationStatus as any}
        />
      </DashboardLayout>
    );
  }

  const handleBookingResponse = async (
    bookingId: string,
    action: 'approve' | 'reject',
    responseMessage?: string
  ) => {
    try {
      await respondToBooking({
        bookingId,
        action,
        responseMessage,
      }).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to respond to booking:', error);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    const statusConfig = {
      pending: { variant: 'secondary', label: 'Pending' },
      approved: { variant: 'default', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
      cancelled: { variant: 'outline', label: 'Cancelled' },
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant as any} className='capitalize'>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return <PageSkeleton type='list' />;
  }

  return (
    <DashboardLayout title='Booking Requests'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Booking Requests</h1>
            <p className='text-gray-600'>Manage booking requests from potential tenants</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className='border-b border-gray-200'>
          <nav className='-mb-px flex space-x-8'>
            {[
              { key: 'all', label: 'All Requests' },
              { key: 'pending', label: 'Pending' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  statusFilter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {error && (
          <div className='p-4 bg-red-100 border border-red-400 text-red-700 rounded-md'>
            Failed to load bookings. Please try again.
          </div>
        )}

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <Card className='text-center py-12'>
            <CardContent>
              <Calendar className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <CardTitle className='text-xl mb-2'>No Booking Requests</CardTitle>
              <CardDescription className='mb-6'>
                {statusFilter === 'all'
                  ? "You haven't received any booking requests yet."
                  : `No ${statusFilter} booking requests found.`}
              </CardDescription>
              <Button onClick={() => router.push('/provider/listings')}>View My Listings</Button>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-4'>
            {bookings.map((booking: any) => (
              <Card key={booking._id} className='hover:shadow-md transition-shadow'>
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <CardTitle className='text-lg'>{booking.listingId.title}</CardTitle>
                      <CardDescription className='text-sm text-gray-500'>
                        {booking.listingId.address}
                      </CardDescription>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Seeker Info */}
                  <div className='flex items-center space-x-4 p-3 bg-gray-50 rounded-lg'>
                    <User className='w-5 h-5 text-gray-500' />
                    <div className='flex-1'>
                      <p className='font-medium text-gray-900'>{booking.seekerId.name}</p>
                      <p className='text-sm text-gray-500'>{booking.seekerId.email}</p>
                      {booking.seekerId.phone && (
                        <p className='text-sm text-gray-500'>{booking.seekerId.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='flex items-center space-x-2'>
                      <Calendar className='w-4 h-4 text-gray-500' />
                      <span className='text-sm text-gray-600'>
                        Requested: {format(new Date(booking.requestedDate), 'PPP')}
                      </span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Clock className='w-4 h-4 text-gray-500' />
                      <span className='text-sm text-gray-600'>
                        Applied: {format(new Date(booking.createdAt), 'PPP')}
                      </span>
                    </div>
                  </div>

                  {/* Rent Info */}
                  <div className='p-3 bg-blue-50 rounded-lg'>
                    <p className='text-lg font-bold text-blue-600'>
                      ₹{booking.listingId.rent.toLocaleString()}/month
                    </p>
                  </div>

                  {/* Message */}
                  {booking.message && (
                    <div className='p-3 border border-gray-200 rounded-lg'>
                      <div className='flex items-start space-x-2'>
                        <MessageSquare className='w-4 h-4 text-gray-500 mt-1' />
                        <div>
                          <p className='text-sm font-medium text-gray-700'>Message from seeker:</p>
                          <p className='text-sm text-gray-600 mt-1'>{booking.message}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Response Message */}
                  {booking.responseMessage && (
                    <div className='p-3 bg-gray-50 border border-gray-200 rounded-lg'>
                      <div className='flex items-start space-x-2'>
                        <MessageSquare className='w-4 h-4 text-gray-500 mt-1' />
                        <div>
                          <p className='text-sm font-medium text-gray-700'>Your response:</p>
                          <p className='text-sm text-gray-600 mt-1'>{booking.responseMessage}</p>
                          {booking.respondedAt && (
                            <p className='text-xs text-gray-500 mt-1'>
                              Responded on {format(new Date(booking.respondedAt), 'PPP')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {booking.status === 'pending' && (
                    <div className='flex items-center space-x-2 pt-2'>
                      <Button
                        onClick={() => handleBookingResponse(booking._id, 'approve')}
                        size='sm'
                        className='flex-1'
                      >
                        <Check className='w-4 h-4 mr-2' />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleBookingResponse(booking._id, 'reject')}
                        variant='outline'
                        size='sm'
                        className='flex-1'
                      >
                        <X className='w-4 h-4 mr-2' />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
