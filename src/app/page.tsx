'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/hooks/useLocalization';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import HomeHeader from '@/components/layout/HomeHeader';
import FavoriteButton from '@/components/ui/FavoriteButton';
import { useGetCurrentUserQuery } from '@/lib/api/authApi';
import { useSearchListingsQuery } from '@/lib/api/seekerApi';
import { useDetectLocationMutation } from '@/lib/api/commonApi';
import {
  Search,
  MapPin,
  Star,
  Users,
  Shield,
  Clock,
  ArrowRight,
  CheckCircle,
  Navigation,
  Heart,
  Wifi,
  Car,
  Utensils,
  Dumbbell,
  Building,
} from 'lucide-react';
import type { Listing } from '@/types';

// Using User type from @/types

export default function Home() {
  const { formatCurrency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const router = useRouter();

  // Get current user with RTK Query
  const { data: currentUser, isLoading } = useGetCurrentUserQuery();
  const user = currentUser?.data?.user;

  // Get featured listings with RTK Query
  const { data: featuredListingsData, isLoading: loadingListings } = useSearchListingsQuery({
    limit: 3,
    page: 1,
  });
  const featuredListings = featuredListingsData?.data || [];

  // Location detection mutation
  const [detectLocation, { isLoading: isDetectingLocation }] = useDetectLocationMutation();

  // No useEffect needed - RTK Query handles data fetching automatically

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/auth');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (locationQuery) params.set('location', locationQuery);
    router.push(`/search?${params.toString()}`);
  };

  const handleDetectLocation = async () => {
    try {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async position => {
          try {
            const result = await detectLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }).unwrap();

            const locationData = result.data;
            if (locationData) {
              setLocationQuery((locationData as any).area + ', ' + (locationData as any).city);
            }
          } catch (error) {
            console.error('Error detecting location:', error);
          }
        },
        error => {
          console.error('Geolocation error:', error);
          alert('Unable to detect your location. Please enter manually.');
        }
      );
    } catch (error) {
      console.error('Location detection error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
        <HomeHeader />
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      {/* Header */}
      <HomeHeader user={user} />

      {/* Hero Section */}
      <section className='relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 overflow-hidden'>
        {/* Background Pattern */}
        <div className='absolute inset-0 opacity-10'>
          <div className='absolute top-10 left-10 w-20 h-20 bg-blue-500 rounded-full'></div>
          <div className='absolute top-40 right-20 w-16 h-16 bg-purple-500 rounded-full'></div>
          <div className='absolute bottom-20 left-1/4 w-12 h-12 bg-indigo-500 rounded-full'></div>
        </div>

        <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <h1 className='text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight'>
              Find Your Perfect
              <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 block'>
                Bed Space
              </span>
            </h1>
            <p className='text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed'>
              Discover comfortable, affordable, and verified bed spaces in your preferred location.
              Connect with trusted providers and find your home away from home.
            </p>

            {/* Enhanced Search Bar */}
            <form onSubmit={handleSearch} className='max-w-4xl mx-auto mb-12'>
              <div className='bg-white rounded-2xl shadow-xl p-6 border border-gray-100'>
                <div className='grid grid-cols-1 md:grid-cols-12 gap-4 items-center'>
                  {/* Location Input */}
                  <div className='md:col-span-5 relative'>
                    <label className='block text-sm font-medium text-gray-700 mb-2 text-left'>
                      Where do you want to stay?
                    </label>
                    <div className='relative'>
                      <MapPin className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                      <Input
                        type='text'
                        placeholder='Enter city or area'
                        value={locationQuery}
                        onChange={e => setLocationQuery(e.target.value)}
                        className='pl-10 pr-12 h-12 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={handleDetectLocation}
                        disabled={isDetectingLocation}
                        className='absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-8 w-8'
                      >
                        <Navigation
                          className={`w-4 h-4 ${isDetectingLocation ? 'animate-spin' : ''}`}
                        />
                      </Button>
                    </div>
                  </div>

                  {/* Search Input */}
                  <div className='md:col-span-5'>
                    <label className='block text-sm font-medium text-gray-700 mb-2 text-left'>
                      What are you looking for?
                    </label>
                    <div className='relative'>
                      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                      <Input
                        type='text'
                        placeholder='Private room, shared space...'
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className='pl-10 h-12 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                      />
                    </div>
                  </div>

                  {/* Search Button */}
                  <div className='md:col-span-2'>
                    <label className='block text-sm font-medium text-transparent mb-2'>
                      Search
                    </label>
                    <Button
                      type='submit'
                      size='lg'
                      className='w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                    >
                      <Search className='w-5 h-5 mr-2' />
                      Search
                    </Button>
                  </div>
                </div>

                {/* Quick Filters */}
                <div className='flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-100'>
                  <span className='text-sm text-gray-600 mr-2'>Popular:</span>
                  {['Private Room', 'Shared Space', 'Near Metro', 'With AC', 'Female Only'].map(
                    filter => (
                      <Button
                        key={filter}
                        variant='outline'
                        size='sm'
                        className='text-xs h-8 rounded-full border-gray-200 hover:border-blue-500 hover:text-blue-600'
                        onClick={() => setSearchQuery(filter)}
                      >
                        {filter}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </form>

            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Button
                size='lg'
                onClick={handleGetStarted}
                className='px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              >
                Get Started
                <ArrowRight className='w-5 h-5 ml-2' />
              </Button>
              <Button
                size='lg'
                variant='outline'
                className='px-8 border-gray-300 hover:border-blue-500 hover:text-blue-600'
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className='py-20 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
              Featured Bed Spaces
            </h2>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
              Discover our most popular and highly-rated accommodations
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {loadingListings ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className='overflow-hidden animate-pulse'>
                  <div className='aspect-[4/3] bg-gray-200'></div>
                  <CardContent className='p-6'>
                    <div className='h-4 bg-gray-200 rounded mb-2'></div>
                    <div className='h-3 bg-gray-200 rounded mb-3 w-3/4'></div>
                    <div className='flex gap-1 mb-4'>
                      <div className='h-6 bg-gray-200 rounded-full w-12'></div>
                      <div className='h-6 bg-gray-200 rounded-full w-12'></div>
                    </div>
                    <div className='flex justify-between items-center'>
                      <div className='h-6 bg-gray-200 rounded w-20'></div>
                      <div className='h-8 bg-gray-200 rounded w-24'></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : featuredListings.length > 0 ? (
              featuredListings.map((listing: Listing) => (
                <Card
                  key={listing._id}
                  className='overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group'
                  onClick={() => router.push(`/listing/${listing._id}`)}
                >
                  <div className='relative'>
                    <div className='aspect-[4/3] bg-gray-200 overflow-hidden'>
                      {listing.images &&
                      listing.images.length > 0 &&
                      listing.images[0]?.fileUrl !== '/api/placeholder/400/300' ? (
                        <img
                          src={listing.images[0]?.fileUrl || ''}
                          alt={listing.title}
                          className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                        />
                      ) : (
                        <div className='w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center'>
                          <div className='text-center'>
                            <div className='w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg'>
                              <Shield className='w-8 h-8 text-blue-600' />
                            </div>
                            <p className='text-sm text-gray-600'>Verified Listing</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {(!user || user.role === 'seeker') && (
                      <div className='absolute top-3 right-3'>
                        <FavoriteButton
                          listingId={listing._id}
                          isAuthenticated={!!user}
                          onAuthRequired={() => router.push('/auth')}
                        />
                      </div>
                    )}
                    <div className='absolute bottom-3 left-3'>
                      <span className='bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium'>
                        Available Now
                      </span>
                    </div>
                    {true && (
                      <div className='absolute top-3 left-3'>
                        <span className='bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center'>
                          <Shield className='w-3 h-3 mr-1' />
                          Verified
                        </span>
                      </div>
                    )}
                  </div>
                  <CardContent className='p-6'>
                    <div className='flex items-start justify-between mb-2'>
                      <h3 className='font-semibold text-lg group-hover:text-blue-600 transition-colors line-clamp-2'>
                        {listing.title}
                      </h3>
                      <div className='flex items-center space-x-1'>
                        <Star className='w-4 h-4 fill-yellow-400 text-yellow-400' />
                        <span className='text-sm font-medium'>4.5</span>
                        <span className='text-sm text-gray-500'>(12)</span>
                      </div>
                    </div>
                    <p className='text-gray-600 mb-3 flex items-center'>
                      <MapPin className='w-4 h-4 mr-1' />
                      {listing.city}, {listing.state}
                    </p>
                    <div className='flex flex-wrap gap-1 mb-4'>
                      {listing.facilities?.slice(0, 3).map((amenity: string) => (
                        <span
                          key={amenity}
                          className='bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs capitalize'
                        >
                          {amenity}
                        </span>
                      ))}
                      {listing.facilities?.length > 3 && (
                        <span className='bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs'>
                          +{listing.facilities.length - 3} more
                        </span>
                      )}
                    </div>
                    <div className='flex items-center justify-between'>
                      <div>
                        <span className='text-2xl font-bold text-gray-900'>
                          {formatCurrency(listing.rent || 0)}
                        </span>
                        <span className='text-gray-600'>/month</span>
                      </div>
                      <Button
                        size='sm'
                        className='bg-blue-600 hover:bg-blue-700'
                        onClick={e => {
                          e.stopPropagation();
                          router.push(`/listing/${listing._id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // No listings fallback
              <div className='col-span-full text-center py-12'>
                <div className='text-gray-500'>
                  <Building className='w-16 h-16 mx-auto mb-4 opacity-50' />
                  <h3 className='text-xl font-semibold mb-2'>No Listings Available</h3>
                  <p className='text-gray-400'>Check back later for new bed space listings!</p>
                </div>
              </div>
            )}
          </div>

          <div className='text-center mt-12'>
            <Button
              size='lg'
              variant='outline'
              onClick={() => router.push('/search')}
              className='px-8'
            >
              View All Listings
              <ArrowRight className='w-5 h-5 ml-2' />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-20 bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
              Why Choose BedSpace?
            </h2>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
              We make finding and listing bed spaces simple, secure, and reliable
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <Card className='text-center p-8 hover:shadow-xl transition-all duration-300 border-0 bg-white'>
              <CardHeader>
                <div className='w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg'>
                  <Shield className='w-10 h-10 text-white' />
                </div>
                <CardTitle className='text-xl mb-3'>Verified Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className='text-base text-gray-600 leading-relaxed'>
                  All providers go through a thorough verification process to ensure safety and
                  reliability for our community
                </CardDescription>
              </CardContent>
            </Card>

            <Card className='text-center p-8 hover:shadow-xl transition-all duration-300 border-0 bg-white'>
              <CardHeader>
                <div className='w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg'>
                  <Search className='w-10 h-10 text-white' />
                </div>
                <CardTitle className='text-xl mb-3'>Smart Search</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className='text-base text-gray-600 leading-relaxed'>
                  Advanced filters and location-based search help you find exactly what you&apos;re
                  looking for in minutes
                </CardDescription>
              </CardContent>
            </Card>

            <Card className='text-center p-8 hover:shadow-xl transition-all duration-300 border-0 bg-white'>
              <CardHeader>
                <div className='w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg'>
                  <Users className='w-10 h-10 text-white' />
                </div>
                <CardTitle className='text-xl mb-3'>Easy Communication</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className='text-base text-gray-600 leading-relaxed'>
                  Built-in messaging system to connect with providers and manage bookings seamlessly
                  and securely
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className='py-20 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
              What Our Users Say
            </h2>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
              Join thousands of satisfied users who found their perfect accommodation
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {[
              {
                name: 'Priya Sharma',
                role: 'Software Engineer',
                location: 'Mumbai',
                rating: 5,
                text: 'Found my perfect bed space within a week! The verification process made me feel safe, and the location was exactly what I needed near my office.',
                avatar: 'PS',
              },
              {
                name: 'Rahul Patel',
                role: 'Student',
                location: 'Pune',
                rating: 5,
                text: 'As a student, budget was my main concern. BedSpace helped me find an affordable place with great amenities. The provider was very helpful too!',
                avatar: 'RP',
              },
              {
                name: 'Anjali Gupta',
                role: 'Marketing Manager',
                location: 'Bangalore',
                rating: 5,
                text: 'The search filters are amazing! I could specify exactly what I wanted - female-only accommodation with AC and WiFi. Found it in 2 days!',
                avatar: 'AG',
              },
            ].map((testimonial, index) => (
              <Card
                key={index}
                className='p-8 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-gray-50 to-white'
              >
                <CardContent className='space-y-6'>
                  <div className='flex items-center space-x-1'>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className='w-5 h-5 fill-yellow-400 text-yellow-400' />
                    ))}
                  </div>
                  <blockquote className='text-gray-700 leading-relaxed italic'>
                    &quot;{testimonial.text}&quot;
                  </blockquote>
                  <div className='flex items-center space-x-4'>
                    <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold'>
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className='font-semibold text-gray-900'>{testimonial.name}</div>
                      <div className='text-sm text-gray-600'>
                        {testimonial.role} • {testimonial.location}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className='py-20 bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>How It Works</h2>
            <p className='text-xl text-gray-600'>Get started in just a few simple steps</p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-12'>
            {/* For Seekers */}
            <div>
              <h3 className='text-2xl font-bold text-gray-900 mb-8 text-center'>For Seekers</h3>
              <div className='space-y-6'>
                <div className='flex items-start'>
                  <div className='w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1'>
                    1
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-2'>Create Account</h4>
                    <p className='text-gray-600'>Sign up with your email and verify your account</p>
                  </div>
                </div>
                <div className='flex items-start'>
                  <div className='w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1'>
                    2
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-2'>Search & Filter</h4>
                    <p className='text-gray-600'>
                      Find bed spaces that match your preferences and budget
                    </p>
                  </div>
                </div>
                <div className='flex items-start'>
                  <div className='w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1'>
                    3
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-2'>Connect & Book</h4>
                    <p className='text-gray-600'>Message providers and send booking requests</p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Providers */}
            <div>
              <h3 className='text-2xl font-bold text-gray-900 mb-8 text-center'>For Providers</h3>
              <div className='space-y-6'>
                <div className='flex items-start'>
                  <div className='w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1'>
                    1
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-2'>Register & Verify</h4>
                    <p className='text-gray-600'>
                      Create provider account and complete verification
                    </p>
                  </div>
                </div>
                <div className='flex items-start'>
                  <div className='w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1'>
                    2
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-2'>List Your Space</h4>
                    <p className='text-gray-600'>
                      Add photos, details, and pricing for your bed spaces
                    </p>
                  </div>
                </div>
                <div className='flex items-start'>
                  <div className='w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1'>
                    3
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-2'>Manage Bookings</h4>
                    <p className='text-gray-600'>Review requests and manage your bookings</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className='py-20 bg-blue-600'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-8 text-center'>
            <div>
              <div className='text-4xl font-bold text-white mb-2'>1000+</div>
              <div className='text-blue-100'>Verified Listings</div>
            </div>
            <div>
              <div className='text-4xl font-bold text-white mb-2'>500+</div>
              <div className='text-blue-100'>Happy Customers</div>
            </div>
            <div>
              <div className='text-4xl font-bold text-white mb-2'>50+</div>
              <div className='text-blue-100'>Cities Covered</div>
            </div>
            <div>
              <div className='text-4xl font-bold text-white mb-2'>24/7</div>
              <div className='text-blue-100'>Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20 bg-white'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
            Ready to Find Your Perfect Bed Space?
          </h2>
          <p className='text-xl text-gray-600 mb-8'>
            Join thousands of satisfied users who found their ideal accommodation through BedSpace
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button size='lg' onClick={handleGetStarted} className='px-8'>
              Get Started Now
              <ArrowRight className='w-5 h-5 ml-2' />
            </Button>
            <Button size='lg' variant='outline' onClick={() => router.push('/contact')}>
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-gray-900 text-white py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
            <div>
              <h3 className='text-2xl font-bold text-blue-400 mb-4'>BedSpace</h3>
              <p className='text-gray-300'>
                Your trusted platform for finding and listing bed spaces across the country.
              </p>
            </div>
            <div>
              <h4 className='font-semibold mb-4'>For Seekers</h4>
              <ul className='space-y-2 text-gray-300'>
                <li>
                  <a href='/search' className='hover:text-white'>
                    Search Listings
                  </a>
                </li>
                <li>
                  <a href='/how-it-works' className='hover:text-white'>
                    How It Works
                  </a>
                </li>
                <li>
                  <a href='/safety' className='hover:text-white'>
                    Safety Tips
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className='font-semibold mb-4'>For Providers</h4>
              <ul className='space-y-2 text-gray-300'>
                <li>
                  <a href='/list-space' className='hover:text-white'>
                    List Your Space
                  </a>
                </li>
                <li>
                  <a href='/provider-guide' className='hover:text-white'>
                    Provider Guide
                  </a>
                </li>
                <li>
                  <a href='/verification' className='hover:text-white'>
                    Verification
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className='font-semibold mb-4'>Support</h4>
              <ul className='space-y-2 text-gray-300'>
                <li>
                  <a href='/help' className='hover:text-white'>
                    Help Center
                  </a>
                </li>
                <li>
                  <a href='/contact' className='hover:text-white'>
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href='/privacy' className='hover:text-white'>
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className='border-t border-gray-800 mt-8 pt-8 text-center text-gray-400'>
            <p>&copy; 2024 BedSpace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
