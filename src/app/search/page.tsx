'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCurrency } from '@/hooks/useLocalization';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import HomeHeader from '@/components/layout/HomeHeader';
import FavoriteButton from '@/components/ui/FavoriteButton';
import { useCreateConversationMutation, useDetectLocationMutation } from '@/lib/api/commonApi';
import { useSearchListingsQuery } from '@/lib/api/seekerApi';
import { useGetCurrentUserQuery } from '@/lib/api/authApi';
import {
  Search,
  MapPin,
  Star,
  Heart,
  Filter,
  Grid,
  List,
  Navigation,
  Wifi,
  Car,
  Utensils,
  Dumbbell,
  MessageCircle,
} from 'lucide-react';
import type { Listing } from '@/types';

// Remove local Listing interface - use the one from types

function SearchPageContent() {
  const { formatCurrency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchFilters, setSearchFilters] = useState<any>({});

  const searchParams = useSearchParams();
  const router = useRouter();

  const [createConversation] = useCreateConversationMutation();
  const [detectLocation, { isLoading: isDetectingLocation }] = useDetectLocationMutation();

  // Get current user
  const { data: currentUser } = useGetCurrentUserQuery();
  const user = currentUser?.data?.user;

  // Search listings with RTK Query
  const {
    data: searchResults,
    isLoading: loading,
    refetch,
  } = useSearchListingsQuery(searchFilters, {
    skip: Object.keys(searchFilters).length === 0,
  });

  const listings = searchResults?.data || [];

  useEffect(() => {
    // Get search params
    const q = searchParams?.get('q') || '';
    const location = searchParams?.get('location') || '';
    setSearchQuery(q);
    setLocationQuery(location);

    // Set search filters for RTK Query
    const filters: any = {};
    if (q) filters.q = q;
    if (location) filters.location = location;

    if (Object.keys(filters).length > 0) {
      setSearchFilters(filters);
    }
  }, [searchParams]);

  const performSearch = (query: string = searchQuery, location: string = locationQuery) => {
    const filters: any = {};
    if (query) filters.q = query;
    if (location) filters.location = location;

    setSearchFilters(filters);
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
              const newLocation = (locationData as any).area + ', ' + (locationData as any).city;
              setLocationQuery(newLocation);
              performSearch(searchQuery, newLocation);
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

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi className='w-4 h-4' />;
      case 'parking':
        return <Car className='w-4 h-4' />;
      case 'kitchen':
        return <Utensils className='w-4 h-4' />;
      case 'gym':
        return <Dumbbell className='w-4 h-4' />;
      default:
        return null;
    }
  };

  const handleContactProvider = async (listing: Listing) => {
    if (!user) {
      router.push('/auth/login?redirect=' + encodeURIComponent('/search'));
      return;
    }

    if (user.role !== 'seeker') {
      alert('Only seekers can contact providers');
      return;
    }

    try {
      const result = await createConversation({
        participantId: listing.providerId,
        initialMessage: `Hi! I'm interested in your listing: ${listing.title}`,
        listingId: listing._id,
        listingTitle: listing.title,
      }).unwrap();

      // Navigate to messages page with the new conversation
      router.push(`/seeker/messages?conversation=${result.data?.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <HomeHeader user={user} />

      {/* Search Bar */}
      <div className='bg-white border-b sticky top-16 z-40'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <form onSubmit={handleSearch} className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1 relative'>
              <MapPin className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
              <Input
                type='text'
                placeholder='Enter city or area'
                value={locationQuery}
                onChange={e => setLocationQuery(e.target.value)}
                className='pl-10 pr-12 h-12'
              />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className='absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-8 w-8'
              >
                <Navigation className={`w-4 h-4 ${isDetectingLocation ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
              <Input
                type='text'
                placeholder='What are you looking for?'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-10 h-12'
              />
            </div>

            <div className='flex gap-2'>
              <Button type='submit' className='h-12 px-6'>
                <Search className='w-5 h-5 mr-2' />
                Search
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={() => setShowFilters(!showFilters)}
                className='h-12 px-4'
              >
                <Filter className='w-5 h-5' />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Results Header */}
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>{listings.length} bed spaces found</h1>
            {(searchQuery || locationQuery) && (
              <p className='text-gray-600 mt-1'>
                {searchQuery && `"${searchQuery}"`}
                {searchQuery && locationQuery && ' in '}
                {locationQuery && `${locationQuery}`}
              </p>
            )}
          </div>

          <div className='flex items-center space-x-2'>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setViewMode('grid')}
            >
              <Grid className='w-4 h-4' />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setViewMode('list')}
            >
              <List className='w-4 h-4' />
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading && <PageSkeleton />}

        {/* Results Grid */}
        {!loading && (
          <div
            className={`grid gap-6 ${
              viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            }`}
          >
            {listings?.map(listing => (
              <Card
                key={listing._id}
                className='overflow-hidden hover:shadow-lg transition-shadow cursor-pointer'
              >
                <div className='relative'>
                  {listing.images && listing.images.length > 0 ? (
                    <div className='aspect-video overflow-hidden'>
                      <img
                        src={listing.images[0]?.fileUrl || ''}
                        alt={listing.title}
                        className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
                      />
                    </div>
                  ) : (
                    <div className='aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center'>
                      <div className='text-center'>
                        <div className='w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg'>
                          <MapPin className='w-8 h-8 text-blue-600' />
                        </div>
                        <p className='text-sm text-gray-600'>No Image</p>
                      </div>
                    </div>
                  )}
                  {(!user || user.role === 'seeker') && (
                    <div className='absolute top-3 right-3'>
                      <FavoriteButton
                        listingId={listing._id}
                        isAuthenticated={!!user}
                        onAuthRequired={() =>
                          router.push('/auth?redirect=' + encodeURIComponent('/search'))
                        }
                      />
                    </div>
                  )}
                </div>

                <CardContent className='p-6'>
                  <div className='flex items-start justify-between mb-2'>
                    <h3 className='font-semibold text-lg hover:text-blue-600 transition-colors'>
                      {listing.title}
                    </h3>
                    <div className='flex items-center space-x-1'>
                      <Star className='w-4 h-4 fill-yellow-400 text-yellow-400' />
                      <span className='text-sm font-medium'>4.5</span>
                    </div>
                  </div>

                  <p className='text-gray-600 mb-2 flex items-center'>
                    <MapPin className='w-4 h-4 mr-1' />
                    {listing.city}, {listing.state}
                  </p>

                  <p className='text-gray-600 text-sm mb-4 line-clamp-2'>{listing.description}</p>

                  <div className='flex flex-wrap gap-2 mb-4'>
                    {listing.facilities.slice(0, 3).map((amenity: string) => (
                      <span
                        key={amenity}
                        className='flex items-center space-x-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs'
                      >
                        {getAmenityIcon(amenity)}
                        <span className='capitalize'>{amenity}</span>
                      </span>
                    ))}
                    {listing.facilities.length > 3 && (
                      <span className='bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs'>
                        +{listing.facilities.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <span className='text-2xl font-bold text-gray-900'>
                        {formatCurrency(listing.rent)}
                      </span>
                      <span className='text-gray-600'>/month</span>
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleContactProvider(listing)}
                      >
                        <MessageCircle className='w-4 h-4 mr-1' />
                        Contact
                      </Button>
                      <Button size='sm' onClick={() => router.push(`/listing/${listing._id}`)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && listings.length === 0 && (
          <div className='text-center py-12'>
            <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Search className='w-12 h-12 text-gray-400' />
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>No results found</h3>
            <p className='text-gray-600 mb-6'>Try adjusting your search criteria or location</p>
            <Button onClick={() => router.push('/')}>Back to Home</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-gray-50'>
          <HomeHeader />
          <PageSkeleton />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
