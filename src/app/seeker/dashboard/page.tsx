'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import {
  Search,
  Heart,
  Calendar,
  MessageCircle,
  MapPin,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Building,
  Wifi,
  Car,
  Utensils,
} from 'lucide-react';

export default function SeekerDashboard() {
  const [stats, setStats] = useState({
    savedListings: 0,
    activeBookings: 0,
    messages: 0,
    searchAlerts: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [savedListings, setSavedListings] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch live data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch stats
        const statsResponse = await fetch('/api/seeker/stats', {
          credentials: 'include',
        });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.data);
        }

        // Fetch recent activities
        const activitiesResponse = await fetch('/api/seeker/activities', {
          credentials: 'include',
        });
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          setRecentActivities(activitiesData.data);
        }

        // Fetch saved listings
        const savedResponse = await fetch('/api/seeker/favorites', {
          credentials: 'include',
        });
        if (savedResponse.ok) {
          const savedData = await savedResponse.json();
          setSavedListings(savedData.data);
        }

        // Fetch active bookings
        const bookingsResponse = await fetch('/api/seeker/bookings', {
          credentials: 'include',
        });
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          setActiveBookings(bookingsData.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (loading) {
    return <PageSkeleton type='dashboard' />;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className='w-4 h-4 text-green-500' />;
      case 'rejected':
        return <XCircle className='w-4 h-4 text-red-500' />;
      case 'pending':
        return <Clock className='w-4 h-4 text-yellow-500' />;
      default:
        return <Clock className='w-4 h-4 text-gray-500' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi className='w-3 h-3' />;
      case 'parking':
        return <Car className='w-3 h-3' />;
      case 'kitchen':
        return <Utensils className='w-3 h-3' />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout title='Seeker Dashboard'>
      {/* Stats Cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        <Card className='hover:shadow-md transition-shadow'>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-red-100 rounded-lg'>
                <Heart className='w-5 h-5 text-red-600' />
              </div>
              <div>
                <p className='text-2xl font-bold text-gray-900'>{stats.savedListings}</p>
                <p className='text-sm text-gray-600'>Saved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='hover:shadow-md transition-shadow'>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-green-100 rounded-lg'>
                <Calendar className='w-5 h-5 text-green-600' />
              </div>
              <div>
                <p className='text-2xl font-bold text-gray-900'>{stats.activeBookings}</p>
                <p className='text-sm text-gray-600'>Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='hover:shadow-md transition-shadow'>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-purple-100 rounded-lg'>
                <MessageCircle className='w-5 h-5 text-purple-600' />
              </div>
              <div>
                <p className='text-2xl font-bold text-gray-900'>{stats.messages}</p>
                <p className='text-sm text-gray-600'>Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='hover:shadow-md transition-shadow'>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-blue-100 rounded-lg'>
                <Search className='w-5 h-5 text-blue-600' />
              </div>
              <div>
                <p className='text-2xl font-bold text-gray-900'>{stats.searchAlerts}</p>
                <p className='text-sm text-gray-600'>Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className='mb-8'>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with these common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <Button
              variant='outline'
              className='h-20 flex flex-col items-center space-y-2'
              onClick={() => router.push('/search')}
            >
              <Search className='w-6 h-6' />
              <span className='text-sm'>Search Spaces</span>
            </Button>

            <Button
              variant='outline'
              className='h-20 flex flex-col items-center space-y-2'
              onClick={() => router.push('/seeker/favorites')}
            >
              <Heart className='w-6 h-6' />
              <span className='text-sm'>My Favorites</span>
            </Button>

            <Button
              variant='outline'
              className='h-20 flex flex-col items-center space-y-2'
              onClick={() => router.push('/seeker/bookings')}
            >
              <Calendar className='w-6 h-6' />
              <span className='text-sm'>My Bookings</span>
            </Button>

            <Button
              variant='outline'
              className='h-20 flex flex-col items-center space-y-2'
              onClick={() => router.push('/messages')}
            >
              <MessageCircle className='w-6 h-6' />
              <span className='text-sm'>Messages</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {recentActivities.length > 0 ? (
                recentActivities.map((activity: any) => {
                  const getIcon = (iconName: string) => {
                    switch (iconName) {
                      case 'Search':
                        return Search;
                      case 'Heart':
                        return Heart;
                      case 'Calendar':
                        return Calendar;
                      case 'MessageCircle':
                        return MessageCircle;
                      default:
                        return Search;
                    }
                  };
                  const IconComponent = getIcon(activity.icon);
                  return (
                    <div
                      key={activity.id}
                      className='flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors'
                    >
                      <div className={`p-2 rounded-full bg-gray-100 ${activity.color}`}>
                        <IconComponent className='w-4 h-4' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-gray-900 truncate'>
                          {activity.title}
                        </p>
                        <p className='text-xs text-gray-500'>{activity.time}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className='text-center py-8 text-gray-500'>
                  <p>No recent activities</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Active Bookings</CardTitle>
            <CardDescription>Track your booking requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {activeBookings.length > 0 ? (
                <>
                  {activeBookings.slice(0, 3).map((booking: any) => (
                    <div
                      key={booking.id}
                      className='p-4 border rounded-lg hover:shadow-sm transition-shadow'
                    >
                      <div className='flex items-start justify-between mb-2'>
                        <h4 className='font-medium text-gray-900 truncate'>{booking.title}</h4>
                        <div className='flex items-center space-x-1'>
                          {getStatusIcon(booking.status)}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}
                          >
                            {booking.status}
                          </span>
                        </div>
                      </div>
                      <p className='text-sm text-gray-600 mb-2'>Provider: {booking.provider}</p>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-gray-500'>
                          Move-in: {new Date(booking.moveInDate).toLocaleDateString()}
                        </span>
                        <span className='font-medium'>₹{booking.price.toLocaleString()}/month</span>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={() => router.push('/seeker/bookings')}
                  >
                    View All Bookings
                  </Button>
                </>
              ) : (
                <div className='text-center py-8 text-gray-500'>
                  <p>No active bookings</p>
                  <Button className='mt-4' onClick={() => router.push('/search')}>
                    Start Searching
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Saved Listings */}
      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Saved Listings</CardTitle>
          <CardDescription>Your favorite bed spaces</CardDescription>
        </CardHeader>
        <CardContent>
          {savedListings.length > 0 ? (
            <>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {savedListings.slice(0, 3).map((listing: any) => (
                  <div
                    key={listing.id}
                    className='border rounded-lg p-4 hover:shadow-md transition-shadow'
                  >
                    <div className='aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-md mb-3 flex items-center justify-center'>
                      <Building className='w-8 h-8 text-gray-400' />
                    </div>
                    <div className='flex items-start justify-between mb-2'>
                      <h3 className='font-semibold text-gray-900 truncate'>{listing.title}</h3>
                      <div className='flex items-center space-x-1'>
                        <Star className='w-4 h-4 fill-yellow-400 text-yellow-400' />
                        <span className='text-sm'>{listing.rating}</span>
                      </div>
                    </div>
                    <p className='text-sm text-gray-600 mb-2 flex items-center'>
                      <MapPin className='w-4 h-4 mr-1' />
                      {listing.location}
                    </p>
                    <div className='flex flex-wrap gap-1 mb-3'>
                      {listing.amenities.slice(0, 3).map((amenity: string) => (
                        <span
                          key={amenity}
                          className='flex items-center space-x-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs'
                        >
                          {getAmenityIcon(amenity)}
                          <span className='capitalize'>{amenity}</span>
                        </span>
                      ))}
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='font-bold text-lg'>
                        ₹{listing.price.toLocaleString()}/month
                      </span>
                      <Button size='sm' variant='outline'>
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className='mt-6 text-center'>
                <Button variant='outline' onClick={() => router.push('/seeker/favorites')}>
                  View All Saved Listings
                </Button>
              </div>
            </>
          ) : (
            <div className='text-center py-12 text-gray-500'>
              <Heart className='w-12 h-12 mx-auto mb-4 text-gray-300' />
              <p className='text-lg font-medium mb-2'>No saved listings yet</p>
              <p className='mb-4'>Start exploring and save your favorite bed spaces</p>
              <Button onClick={() => router.push('/search')}>Browse Listings</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
