'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Calendar,
  User,
  Building,
  MapPin,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Booking {
  _id: string;
  seeker: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  provider: {
    _id: string;
    name: string;
    email: string;
  };
  listing: {
    _id: string;
    title: string;
    location: string;
    price: number;
  };
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  checkIn: string;
  checkOut?: string;
  duration: number; // in months
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, paymentFilter]);

  const fetchBookings = async () => {
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        paymentStatus: paymentFilter,
        search: searchTerm,
      });

      const response = await fetch(`/api/admin/bookings?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setBookings(result.data);
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = bookings.filter(
    booking =>
      booking.seeker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.listing.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <PageSkeleton type='list' />;
  }

  return (
    <DashboardLayout title='Bookings Management'>
      {message && (
        <div className='mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded'>
          {message}
        </div>
      )}

      {error && (
        <div className='mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded'>
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className='mb-6 flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <Input
            placeholder='Search bookings by seeker, provider, or listing...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>
        <div className='flex gap-2'>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value='all'>All Status</option>
            <option value='pending'>Pending</option>
            <option value='approved'>Approved</option>
            <option value='rejected'>Rejected</option>
            <option value='cancelled'>Cancelled</option>
            <option value='completed'>Completed</option>
          </select>
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value='all'>All Payments</option>
            <option value='pending'>Payment Pending</option>
            <option value='paid'>Paid</option>
            <option value='failed'>Failed</option>
            <option value='refunded'>Refunded</option>
          </select>
          <Button onClick={fetchBookings} variant='outline'>
            <Filter className='w-4 h-4 mr-2' />
            Refresh
          </Button>
        </div>
      </div>

      {/* Bookings List */}
      <div className='space-y-4'>
        {filteredBookings.map(booking => (
          <Card key={booking._id} className='hover:shadow-md transition-shadow'>
            <CardContent className='p-6'>
              <div className='flex items-start justify-between mb-4'>
                <div className='flex-1'>
                  <div className='flex items-center space-x-3 mb-2'>
                    <h3 className='text-lg font-semibold text-gray-900'>{booking.listing.title}</h3>
                    <Badge className={getStatusBadgeColor(booking.status)}>{booking.status}</Badge>
                    <Badge className={getPaymentBadgeColor(booking.paymentStatus)}>
                      {booking.paymentStatus}
                    </Badge>
                  </div>
                  <div className='flex items-center text-sm text-gray-500 mb-2'>
                    <MapPin className='w-4 h-4 mr-1' />
                    {booking.listing.location}
                  </div>
                </div>
                <div className='text-right'>
                  <div className='text-2xl font-bold text-gray-900'>
                    ₹{booking.totalAmount.toLocaleString()}
                  </div>
                  <div className='text-sm text-gray-500'>
                    {booking.duration} month{booking.duration > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-4'>
                {/* Seeker Info */}
                <div className='space-y-2'>
                  <div className='flex items-center text-sm font-medium text-gray-700'>
                    <User className='w-4 h-4 mr-2' />
                    Seeker
                  </div>
                  <div className='ml-6'>
                    <p className='font-medium'>{booking.seeker.name}</p>
                    <p className='text-sm text-gray-500'>{booking.seeker.email}</p>
                    {booking.seeker.phone && (
                      <p className='text-sm text-gray-500'>{booking.seeker.phone}</p>
                    )}
                  </div>
                </div>

                {/* Provider Info */}
                <div className='space-y-2'>
                  <div className='flex items-center text-sm font-medium text-gray-700'>
                    <Building className='w-4 h-4 mr-2' />
                    Provider
                  </div>
                  <div className='ml-6'>
                    <p className='font-medium'>{booking.provider.name}</p>
                    <p className='text-sm text-gray-500'>{booking.provider.email}</p>
                  </div>
                </div>
              </div>

              <div className='flex items-center justify-between pt-4 border-t'>
                <div className='flex items-center space-x-6 text-sm text-gray-500'>
                  <div className='flex items-center'>
                    <Calendar className='w-4 h-4 mr-1' />
                    Check-in: {new Date(booking.checkIn).toLocaleDateString()}
                  </div>
                  {booking.checkOut && (
                    <div className='flex items-center'>
                      <Calendar className='w-4 h-4 mr-1' />
                      Check-out: {new Date(booking.checkOut).toLocaleDateString()}
                    </div>
                  )}
                  <div className='flex items-center'>
                    <Clock className='w-4 h-4 mr-1' />
                    Created: {new Date(booking.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='sm'>
                      <MoreHorizontal className='w-4 h-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem>
                      <Eye className='w-4 h-4 mr-2' />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <User className='w-4 h-4 mr-2' />
                      Contact Seeker
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Building className='w-4 h-4 mr-2' />
                      Contact Provider
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {booking.notes && (
                <div className='mt-4 p-3 bg-gray-50 rounded-md'>
                  <p className='text-sm text-gray-600'>
                    <strong>Notes:</strong> {booking.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBookings.length === 0 && (
        <div className='text-center py-12 text-gray-500'>
          <Calendar className='w-12 h-12 mx-auto mb-4 text-gray-300' />
          <p className='text-lg font-medium mb-2'>No bookings found</p>
          <p>No bookings match your current filters</p>
        </div>
      )}
    </DashboardLayout>
  );
}
