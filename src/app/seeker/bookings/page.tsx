'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User, Clock, CreditCard, MessageCircle } from 'lucide-react';

interface Booking {
  id: string;
  listing: {
    id: string;
    title: string;
    location: string;
    price: number;
    images: string[];
  };
  provider: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  checkIn: string;
  checkOut?: string;
  duration: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  requestDate: string;
  moveInDate: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  completed: 'bg-blue-100 text-blue-800',
};

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/seeker/bookings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/seeker/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        fetchBookings(); // Refresh bookings
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const filteredBookings = bookings.filter(booking => 
    filter === 'all' || booking.status === filter
  );

  if (loading) {
    return (
      <DashboardLayout title="My Bookings">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Bookings">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600">
              {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {['all', 'pending', 'approved', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
              </h3>
              <p className="text-gray-600 mb-4">
                {filter === 'all' 
                  ? 'Start exploring and book your perfect space.'
                  : `You don't have any ${filter} bookings at the moment.`
                }
              </p>
              {filter === 'all' && (
                <Button onClick={() => window.location.href = '/search'}>
                  Browse Listings
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Listing Info */}
                    <div className="flex gap-4">
                      <img
                        src={booking.listing.images[0] || '/images/placeholder-room.jpg'}
                        alt={booking.listing.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {booking.listing.title}
                        </h3>
                        <div className="flex items-center text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="text-sm">{booking.listing.location}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <User className="h-4 w-4 mr-1" />
                          <span className="text-sm">Provider: {booking.provider.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="flex flex-col lg:items-end gap-2">
                      <div className="flex gap-2">
                        <Badge className={statusColors[booking.status]}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                        <Badge className={paymentStatusColors[booking.paymentStatus]}>
                          {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center text-gray-600 text-sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Move-in: {new Date(booking.moveInDate).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600 text-sm">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Duration: {booking.duration} months</span>
                      </div>
                      
                      <div className="flex items-center text-gray-900 font-semibold">
                        <CreditCard className="h-4 w-4 mr-1" />
                        <span>₹{booking.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 lg:min-w-[120px]">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = `/messages?provider=${booking.provider.id}`}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                      
                      {booking.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => cancelBooking(booking.id)}
                        >
                          Cancel
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.location.href = `/bookings/${booking.id}`}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>

                  {/* Request Date */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      Requested on {new Date(booking.requestDate).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
