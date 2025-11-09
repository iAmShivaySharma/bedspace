'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  Home as HomeIcon,
  Key,
  Bed,
  Coffee,
  Zap,
} from 'lucide-react';
import type { Listing } from '@/types';

// Using User type from @/types

export default function Home() {
  const { formatCurrency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [showFilters, setShowFilters] = useState(false);
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
    if (checkInDate) params.set('checkIn', checkInDate);
    if (checkOutDate) params.set('checkOut', checkOutDate);
    if (guests > 1) params.set('guests', guests.toString());
    if (priceRange[0] > 0 || priceRange[1] < 50000) {
      params.set('minPrice', priceRange[0].toString());
      params.set('maxPrice', priceRange[1].toString());
    }
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <PageSkeleton />
        </motion.div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      {/* Header */}
      <HomeHeader user={user} />

      {/* Hero Section */}
      <section className='relative min-h-[100vh] flex items-center overflow-hidden pt-20'>
        {/* Background Image with Overlay */}
        <div className='absolute inset-0 z-0'>
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className='absolute inset-0 bg-cover bg-center bg-no-repeat'
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2158&q=80')`,
            }}
          />
          {/* Gradient Overlay */}
          <div className='absolute inset-0 bg-gradient-to-br from-blue-900/55 via-purple-900/50 to-pink-900/55' />
          {/* Additional overlay for better text readability */}
          <div className='absolute inset-0 bg-black/25' />
        </div>

        {/* Optimized floating accommodation-themed elements */}
        <div className='absolute inset-0 overflow-hidden pointer-events-none z-10'>
          {/* Simplified floating icons */}
          {[
            { Icon: HomeIcon, position: 'top-20 left-1/6', color: 'white' },
            { Icon: Bed, position: 'top-1/3 right-1/6', color: 'blue-300' },
            { Icon: Key, position: 'bottom-1/3 left-1/3', color: 'purple-300' },
            { Icon: Wifi, position: 'top-1/2 right-1/3', color: 'pink-300' },
            { Icon: Coffee, position: 'bottom-20 right-1/5', color: 'green-300' },
          ].map((item, index) => (
            <div
              key={index}
              className={`absolute ${item.position} bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/20 animate-float opacity-80`}
              style={{ animationDelay: `${index * 0.5}s` }}
            >
              <item.Icon className={`w-6 h-6 text-${item.color}/80`} />
            </div>
          ))}

          {/* Simplified geometric accents with CSS animations */}
          <div className='absolute top-1/4 left-1/12 w-16 h-16 border-2 border-white/10 animate-spin-slow opacity-60' />
          <div className='absolute bottom-1/4 right-1/12 w-12 h-12 border-2 border-blue-300/20 rounded-full animate-pulse opacity-60' />
        </div>

        {/* Animated background particles */}
        <div className='absolute inset-0 overflow-hidden pointer-events-none z-10'>
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className='absolute w-1 h-1 bg-white/20 rounded-full animate-pulse'
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            ></div>
          ))}
        </div>

        {/* Feature highlight cards floating in background */}
        <div className='absolute inset-0 overflow-hidden pointer-events-none z-5'>
          <div className='absolute top-1/4 left-4 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 animate-float hidden lg:block'>
            <div className='flex items-center space-x-3'>
              <div className='w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center'>
                <CheckCircle className='w-5 h-5 text-green-400' />
              </div>
              <div className='text-white/80'>
                <div className='text-sm font-semibold'>Verified Safe</div>
                <div className='text-xs'>100% Secure</div>
              </div>
            </div>
          </div>

          <div
            className='absolute bottom-1/4 right-4 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 animate-float hidden lg:block'
            style={{ animationDelay: '2s' }}
          >
            <div className='flex items-center space-x-3'>
              <div className='w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center'>
                <Zap className='w-5 h-5 text-blue-400' />
              </div>
              <div className='text-white/80'>
                <div className='text-sm font-semibold'>Instant Booking</div>
                <div className='text-xs'>Quick & Easy</div>
              </div>
            </div>
          </div>
        </div>

        <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-20'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[80vh] pt-8 md:pt-16'>
            {/* Left Side - Text Content */}
            <div className='text-left order-2 lg:order-1'>
              {/* Welcome badge */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className='inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm md:text-base font-medium mb-8 hover:bg-white/20 transition-all duration-300 shadow-lg'
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className='w-3 h-3 bg-green-400 rounded-full mr-3'
                />
                <HomeIcon className='w-4 h-4 mr-2' />
                Welcome to BedSpace
              </motion.div>

              {/* Main Heading with Optimized Animation */}
              <motion.div
                className='text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight'
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
              >
                {/* "Find Your Perfect" - single animation */}
                <motion.div
                  className='mb-2'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0, duration: 0.6 }}
                >
                  Find Your Perfect
                </motion.div>

                {/* "Bed Space" with gradient - single animation */}
                <motion.div
                  className='mb-3'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3, duration: 0.6 }}
                >
                  <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400'>
                    Bed Space
                  </span>
                </motion.div>

                {/* "in Mumbai & Beyond" - single animation */}
                <motion.div
                  className='text-xl md:text-2xl lg:text-3xl font-normal text-blue-100 opacity-90'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.6, duration: 0.6 }}
                >
                  in Mumbai & Beyond
                </motion.div>
              </motion.div>

              {/* Description with single animation */}
              <motion.div
                className='text-lg md:text-xl text-blue-50 mb-8 leading-relaxed opacity-90 max-w-lg'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.9, duration: 0.6 }}
              >
                Discover comfortable, affordable, and verified bed spaces in your preferred
                location.
              </motion.div>

              {/* Visual stats banner - optimized animation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2, duration: 0.6 }}
                className='flex items-center space-x-6 mb-8'
              >
                {[
                  { number: '1000+', label: 'Verified Rooms' },
                  { number: '50+', label: 'Cities' },
                  { number: '24/7', label: 'Support' },
                ].map((stat, index) => (
                  <div key={index} className='text-center'>
                    <div className='text-2xl md:text-3xl font-bold text-white hover:scale-105 transition-transform duration-200'>
                      {stat.number}
                    </div>
                    <div className='text-white/70 text-xs uppercase tracking-wider'>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* CTA Buttons - optimized animation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5, duration: 0.6 }}
                className='flex flex-col sm:flex-row gap-4'
              >
                <Button
                  size='lg'
                  onClick={handleGetStarted}
                  className='px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200'
                >
                  Get Started Now
                  <ArrowRight className='w-5 h-5 ml-2' />
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  onClick={() => router.push('/search')}
                  className='px-8 py-4 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:border-white/50 text-white rounded-xl text-base font-semibold transition-all duration-200'
                >
                  Explore Listings
                </Button>
              </motion.div>
            </div>

            {/* Right Side - Search Interface */}
            <div className='order-1 lg:order-2'>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.5, duration: 0.8 }}
                className='w-full'
              >
                <motion.form
                  onSubmit={handleSearch}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                  className='bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20 hover:shadow-blue-500/10 transition-all duration-300'
                >
                  {/* Search Header */}
                  <div className='p-6 border-b border-gray-100'>
                    <h3 className='text-xl font-semibold text-gray-800 mb-2'>
                      Find Your Perfect Space
                    </h3>
                    <p className='text-gray-600 text-sm'>
                      Search from thousands of verified accommodations
                    </p>
                  </div>

                  {/* Main Search Form */}
                  <div className='p-6 space-y-6'>
                    {/* Location Input */}
                    <div className='relative group'>
                      <label className='block text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider'>
                        Where do you want to stay?
                      </label>
                      <div className='relative'>
                        <MapPin className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors' />
                        <Input
                          type='text'
                          placeholder='Enter location or area'
                          value={locationQuery}
                          onChange={e => setLocationQuery(e.target.value)}
                          className='pl-12 pr-12 h-14 text-base border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all'
                        />
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={handleDetectLocation}
                          disabled={isDetectingLocation}
                          className='absolute right-2 top-1/2 transform -translate-y-1/2 p-2 h-10 w-10 rounded-lg hover:bg-blue-50'
                        >
                          <Navigation
                            className={`w-4 h-4 ${isDetectingLocation ? 'animate-spin text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}
                          />
                        </Button>
                      </div>
                    </div>

                    {/* Date Inputs */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      {/* Check-in Date */}
                      <div className='relative group'>
                        <label className='block text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider'>
                          Check-in
                        </label>
                        <Input
                          type='date'
                          value={checkInDate}
                          onChange={e => setCheckInDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className='h-14 text-base border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all'
                        />
                      </div>

                      {/* Check-out Date */}
                      <div className='relative group'>
                        <label className='block text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider'>
                          Check-out
                        </label>
                        <Input
                          type='date'
                          value={checkOutDate}
                          onChange={e => setCheckOutDate(e.target.value)}
                          min={checkInDate || new Date().toISOString().split('T')[0]}
                          className='h-14 text-base border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all'
                        />
                      </div>
                    </div>

                    {/* Search Button */}
                    <div className='pt-4'>
                      <Button
                        type='submit'
                        size='lg'
                        className='w-full h-14 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200'
                      >
                        <Search className='w-5 h-5 mr-2' />
                        Search Available Rooms
                      </Button>
                    </div>

                    {/* Quick Filters - optimized animation */}
                    <div className='pt-4 border-t border-gray-100'>
                      <h4 className='text-sm font-semibold text-gray-700 mb-3'>Popular Filters</h4>
                      <motion.div
                        className='flex flex-wrap gap-2'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 3, duration: 0.4 }}
                      >
                        {['₹5000-₹10000', 'AC Available', 'WiFi', 'Female Only', 'Near Metro'].map(
                          (filter, index) => (
                            <button
                              key={index}
                              type='button'
                              className='px-3 py-2 text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-lg transition-all duration-200'
                            >
                              {filter}
                            </button>
                          )
                        )}
                      </motion.div>
                    </div>
                  </div>
                </motion.form>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className='py-16 md:py-24 bg-gradient-to-b from-white via-gray-50/50 to-slate-100/80 relative overflow-hidden'>
        {/* Subtle background pattern */}
        <div className='absolute inset-0 opacity-5'>
          <div
            className='absolute inset-0'
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234f46e5' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='53' cy='53' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
          <div className='text-center mb-12 md:mb-16'>
            <div className='inline-flex items-center px-4 py-2 bg-amber-100/80 backdrop-blur-sm border border-amber-200/50 text-amber-800 rounded-full text-sm font-medium mb-4'>
              <Star className='w-4 h-4 mr-2 fill-amber-500 text-amber-500' />
              Most Popular
            </div>
            <h2 className='text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 mb-4'>
              Featured Bed Spaces
            </h2>
            <p className='text-lg md:text-xl text-slate-600 max-w-3xl mx-auto'>
              Discover our most popular and highly-rated accommodations
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8'>
            {loadingListings ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <Card
                  key={index}
                  className='overflow-hidden animate-pulse rounded-2xl border-0 shadow-lg'
                >
                  <div className='aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300'></div>
                  <CardContent className='p-4 md:p-6'>
                    <div className='h-5 bg-gray-200 rounded-lg mb-3'></div>
                    <div className='h-4 bg-gray-200 rounded-lg mb-3 w-3/4'></div>
                    <div className='flex gap-2 mb-4'>
                      <div className='h-6 bg-gray-200 rounded-full w-16'></div>
                      <div className='h-6 bg-gray-200 rounded-full w-12'></div>
                    </div>
                    <div className='flex justify-between items-center'>
                      <div className='h-6 bg-gray-200 rounded-lg w-24'></div>
                      <div className='h-9 bg-gray-200 rounded-lg w-28'></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : featuredListings.length > 0 ? (
              featuredListings.map((listing: Listing, index: number) => (
                <Card
                  key={listing._id}
                  className='overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer group rounded-2xl border-0 bg-white shadow-lg hover:-translate-y-2 animate-scale-in'
                  style={{ animationDelay: `${0.2 * (index + 1)}s` }}
                  onClick={() => router.push(`/listing/${listing._id}`)}
                >
                  <div className='relative overflow-hidden'>
                    <div className='aspect-[4/3] bg-gray-200 overflow-hidden'>
                      {listing.images &&
                      listing.images.length > 0 &&
                      listing.images[0]?.fileUrl !== '/api/placeholder/400/300' ? (
                        <img
                          src={listing.images[0]?.fileUrl || ''}
                          alt={listing.title}
                          className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-700'
                        />
                      ) : (
                        <div className='w-full h-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center'>
                          <div className='text-center'>
                            <div className='w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg'>
                              <Shield className='w-8 h-8 text-blue-600' />
                            </div>
                            <p className='text-sm text-gray-600 font-medium'>Verified Listing</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Gradient Overlay */}
                    <div className='absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>

                    {/* Favorite Button */}
                    {(!user || user.role === 'seeker') && (
                      <div className='absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                        <div className='bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all'>
                          <FavoriteButton
                            listingId={listing._id}
                            isAuthenticated={!!user}
                            onAuthRequired={() => router.push('/auth')}
                          />
                        </div>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className='absolute bottom-3 left-3'>
                      <span className='bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm'>
                        ✓ Available Now
                      </span>
                    </div>

                    {/* Verified Badge */}
                    {true && (
                      <div className='absolute top-3 left-3'>
                        <span className='bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center shadow-lg backdrop-blur-sm'>
                          <Shield className='w-3 h-3 mr-1' />
                          Verified
                        </span>
                      </div>
                    )}
                  </div>

                  <CardContent className='p-4 md:p-6'>
                    {/* Header with Rating */}
                    <div className='flex items-start justify-between mb-3'>
                      <h3 className='font-bold text-lg md:text-xl group-hover:text-blue-600 transition-colors line-clamp-2 flex-1 mr-2'>
                        {listing.title}
                      </h3>
                      <div className='flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-lg'>
                        <Star className='w-4 h-4 fill-yellow-400 text-yellow-400' />
                        <span className='text-sm font-bold text-gray-900'>4.8</span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className='flex items-center text-gray-600 mb-4'>
                      <MapPin className='w-4 h-4 mr-2 text-gray-400' />
                      <span className='text-sm font-medium'>
                        {listing.city}, {listing.state}
                      </span>
                    </div>

                    {/* Amenities */}
                    <div className='flex flex-wrap gap-2 mb-4'>
                      {listing.facilities?.slice(0, 3).map((amenity: string) => {
                        const amenityIcons: { [key: string]: any } = {
                          wifi: Wifi,
                          parking: Car,
                          food: Utensils,
                          gym: Dumbbell,
                        };
                        const IconComponent = amenityIcons[amenity.toLowerCase()] || Building;

                        return (
                          <span
                            key={amenity}
                            className='bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors flex items-center'
                          >
                            <IconComponent className='w-3 h-3 mr-1' />
                            {amenity}
                          </span>
                        );
                      })}
                      {listing.facilities?.length > 3 && (
                        <span className='bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium'>
                          +{listing.facilities.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Price and CTA */}
                    <div className='flex items-center justify-between pt-4 border-t border-gray-100'>
                      <div>
                        <span className='text-2xl md:text-3xl font-bold text-gray-900'>
                          ₹{listing.rent || 0}
                        </span>
                        <span className='text-gray-600 text-sm'>/month</span>
                      </div>
                      <Button
                        size='sm'
                        className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl px-6 py-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200'
                        onClick={e => {
                          e.stopPropagation();
                          router.push(`/listing/${listing._id}`);
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // No listings fallback
              <div className='col-span-full text-center py-16'>
                <div className='text-gray-500 max-w-md mx-auto'>
                  <div className='w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                    <Building className='w-12 h-12 text-blue-500' />
                  </div>
                  <h3 className='text-2xl font-bold text-gray-900 mb-3'>No Listings Available</h3>
                  <p className='text-gray-600 mb-6'>
                    We're adding new bed spaces every day. Check back soon!
                  </p>
                  <Button
                    onClick={() => router.push('/search')}
                    className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                  >
                    Explore All Locations
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className='text-center mt-12'>
            <Button
              size='lg'
              variant='outline'
              onClick={() => router.push('/search')}
              className='px-8 py-4 border-slate-300 bg-white hover:bg-slate-50 hover:border-blue-500 text-slate-700 hover:text-blue-600 rounded-xl text-base font-semibold transition-all duration-200 group shadow-sm'
            >
              Explore All Listings
              <ArrowRight className='w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform' />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-16 md:py-24 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-800 relative overflow-hidden'>
        {/* Elegant background image */}
        <div className='absolute inset-0'>
          <div
            className='absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10'
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
            }}
          />
        </div>
        {/* Subtle geometric overlay */}
        <div className='absolute inset-0 opacity-10'>
          <div
            className='absolute inset-0'
            style={{
              backgroundImage: `linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%)`,
              backgroundSize: '20px 20px',
            }}
          />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
          <div className='text-center mb-12 md:mb-16'>
            <div className='inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full text-sm font-medium mb-4'>
              ✨ Features
            </div>
            <h2 className='text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4'>
              Why Choose BedSpace?
            </h2>
            <p className='text-lg md:text-xl text-slate-300 max-w-3xl mx-auto'>
              We make finding and listing bed spaces simple, secure, and reliable
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8'>
            <Card
              className='text-center p-6 md:p-8 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 border border-white/20 bg-white/10 backdrop-blur-sm rounded-2xl group animate-fade-in-up'
              style={{ animationDelay: '0.3s' }}
            >
              <CardHeader>
                <div className='w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300 animate-float'>
                  <Shield className='w-10 h-10 text-white' />
                </div>
                <CardTitle className='text-xl md:text-2xl mb-3 text-white group-hover:text-blue-300 transition-colors'>
                  Verified Providers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className='text-base text-slate-300 leading-relaxed'>
                  All providers go through a thorough verification process to ensure safety and
                  reliability for our community
                </CardDescription>
                <div className='mt-6 flex justify-center'>
                  <div className='flex items-center space-x-2 text-sm text-blue-300 font-medium'>
                    <CheckCircle className='w-4 h-4' />
                    <span>100% Verified</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className='text-center p-6 md:p-8 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 border border-white/20 bg-white/10 backdrop-blur-sm rounded-2xl group animate-fade-in-up'
              style={{ animationDelay: '0.5s' }}
            >
              <CardHeader>
                <div
                  className='w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300 animate-float'
                  style={{ animationDelay: '1s' }}
                >
                  <Search className='w-10 h-10 text-white' />
                </div>
                <CardTitle className='text-xl md:text-2xl mb-3 text-white group-hover:text-green-300 transition-colors'>
                  Smart Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className='text-base text-slate-300 leading-relaxed'>
                  Advanced filters and location-based search help you find exactly what you&apos;re
                  looking for in minutes
                </CardDescription>
                <div className='mt-6 flex justify-center'>
                  <div className='flex items-center space-x-2 text-sm text-green-300 font-medium'>
                    <Clock className='w-4 h-4' />
                    <span>Instant Results</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className='text-center p-6 md:p-8 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 border border-white/20 bg-white/10 backdrop-blur-sm rounded-2xl group animate-fade-in-up'
              style={{ animationDelay: '0.7s' }}
            >
              <CardHeader>
                <div
                  className='w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300 animate-float'
                  style={{ animationDelay: '2s' }}
                >
                  <Users className='w-10 h-10 text-white' />
                </div>
                <CardTitle className='text-xl md:text-2xl mb-3 text-white group-hover:text-purple-300 transition-colors'>
                  Easy Communication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className='text-base text-slate-300 leading-relaxed'>
                  Built-in messaging system to connect with providers and manage bookings seamlessly
                  and securely
                </CardDescription>
                <div className='mt-6 flex justify-center'>
                  <div className='flex items-center space-x-2 text-sm text-purple-300 font-medium'>
                    <Heart className='w-4 h-4' />
                    <span>24/7 Support</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className='py-16 md:py-24 bg-gradient-to-b from-amber-50/50 via-orange-50/30 to-yellow-50/50 relative overflow-hidden'>
        {/* Elegant background image */}
        <div className='absolute inset-0'>
          <div
            className='absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5'
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=2126&q=80')`,
            }}
          />
        </div>
        {/* Subtle decorative pattern */}
        <div className='absolute inset-0 opacity-5'>
          <div
            className='absolute inset-0'
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f59e0b' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
          <div className='text-center mb-12 md:mb-16'>
            <div className='inline-flex items-center px-4 py-2 bg-amber-100/80 backdrop-blur-sm border border-amber-200/50 text-amber-800 rounded-full text-sm font-medium mb-4'>
              ⭐ Reviews
            </div>
            <h2 className='text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 mb-4'>
              What Our Users Say
            </h2>
            <p className='text-lg md:text-xl text-slate-600 max-w-3xl mx-auto'>
              Join thousands of satisfied users who found their perfect accommodation
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8'>
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
                className='p-6 md:p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-amber-200/30 bg-white/90 backdrop-blur-sm rounded-2xl group relative overflow-hidden animate-fade-in-up'
                style={{ animationDelay: `${0.3 * (index + 1)}s` }}
              >
                {/* Decorative element */}
                <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full -mr-12 -mt-12 opacity-50 group-hover:opacity-100 transition-opacity animate-float'></div>

                <CardContent className='space-y-6 relative'>
                  <div className='flex items-center space-x-1'>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className='w-5 h-5 fill-amber-400 text-amber-400' />
                    ))}
                    <span className='ml-2 text-sm font-medium text-slate-600'>
                      ({testimonial.rating}.0)
                    </span>
                  </div>
                  <blockquote className='text-slate-700 leading-relaxed text-base md:text-lg font-medium'>
                    &quot;{testimonial.text}&quot;
                  </blockquote>
                  <div className='flex items-center space-x-4 pt-4 border-t border-amber-200/30'>
                    <div className='w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg'>
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className='font-bold text-slate-800 text-lg'>{testimonial.name}</div>
                      <div className='text-sm text-slate-600 font-medium'>
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
      <section className='py-16 md:py-24 bg-gradient-to-b from-indigo-900/95 via-blue-900/95 to-slate-900/95 relative overflow-hidden'>
        {/* Elegant background image */}
        <div className='absolute inset-0'>
          <div
            className='absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15'
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2159&q=80')`,
            }}
          />
        </div>
        {/* Minimal tech pattern */}
        <div className='absolute inset-0 opacity-5'>
          <div
            className='absolute inset-0'
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236366f1' fill-opacity='0.1'%3E%3Cpolygon points='50 0 60 40 100 50 60 60 50 100 40 60 0 50 40 40'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '100px 100px',
            }}
          />
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
          <div className='text-center mb-12 md:mb-16'>
            <div className='inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full text-sm font-medium mb-4'>
              🚀 How It Works
            </div>
            <h2 className='text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4'>
              How It Works
            </h2>
            <p className='text-lg md:text-xl text-slate-300'>
              Get started in just a few simple steps
            </p>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12'>
            {/* For Seekers */}
            <div
              className='bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 animate-fade-in-up'
              style={{ animationDelay: '0.3s' }}
            >
              <div className='text-center mb-8'>
                <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float'>
                  <Users className='w-8 h-8 text-white' />
                </div>
                <h3 className='text-2xl md:text-3xl font-bold text-white'>For Seekers</h3>
                <p className='text-slate-300 mt-2'>Find your perfect bed space</p>
              </div>
              <div className='space-y-6'>
                <div className='flex items-start group'>
                  <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center font-bold mr-4 mt-1 shadow-lg group-hover:scale-110 transition-transform duration-200'>
                    1
                  </div>
                  <div className='flex-1'>
                    <h4 className='font-bold text-white mb-2 text-lg'>Create Account</h4>
                    <p className='text-slate-300'>
                      Sign up with your email and verify your account securely
                    </p>
                  </div>
                </div>
                <div className='flex items-start group'>
                  <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center font-bold mr-4 mt-1 shadow-lg group-hover:scale-110 transition-transform duration-200'>
                    2
                  </div>
                  <div className='flex-1'>
                    <h4 className='font-bold text-white mb-2 text-lg'>Search & Filter</h4>
                    <p className='text-slate-300'>
                      Find bed spaces that match your preferences and budget
                    </p>
                  </div>
                </div>
                <div className='flex items-start group'>
                  <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center font-bold mr-4 mt-1 shadow-lg group-hover:scale-110 transition-transform duration-200'>
                    3
                  </div>
                  <div className='flex-1'>
                    <h4 className='font-bold text-white mb-2 text-lg'>Connect & Book</h4>
                    <p className='text-slate-300'>
                      Message providers and send booking requests instantly
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Providers */}
            <div
              className='bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 animate-fade-in-up'
              style={{ animationDelay: '0.5s' }}
            >
              <div className='text-center mb-8'>
                <div
                  className='w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float'
                  style={{ animationDelay: '1s' }}
                >
                  <Building className='w-8 h-8 text-white' />
                </div>
                <h3 className='text-2xl md:text-3xl font-bold text-white'>For Providers</h3>
                <p className='text-slate-300 mt-2'>List your space and earn</p>
              </div>
              <div className='space-y-6'>
                <div className='flex items-start group'>
                  <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl flex items-center justify-center font-bold mr-4 mt-1 shadow-lg group-hover:scale-110 transition-transform duration-200'>
                    1
                  </div>
                  <div className='flex-1'>
                    <h4 className='font-bold text-white mb-2 text-lg'>Register & Verify</h4>
                    <p className='text-slate-300'>
                      Create provider account and complete verification process
                    </p>
                  </div>
                </div>
                <div className='flex items-start group'>
                  <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl flex items-center justify-center font-bold mr-4 mt-1 shadow-lg group-hover:scale-110 transition-transform duration-200'>
                    2
                  </div>
                  <div className='flex-1'>
                    <h4 className='font-bold text-white mb-2 text-lg'>List Your Space</h4>
                    <p className='text-slate-300'>
                      Add photos, details, and pricing for your bed spaces
                    </p>
                  </div>
                </div>
                <div className='flex items-start group'>
                  <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl flex items-center justify-center font-bold mr-4 mt-1 shadow-lg group-hover:scale-110 transition-transform duration-200'>
                    3
                  </div>
                  <div className='flex-1'>
                    <h4 className='font-bold text-white mb-2 text-lg'>Manage Bookings</h4>
                    <p className='text-slate-300'>
                      Review requests and manage your bookings effortlessly
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className='py-16 md:py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden'>
        {/* Background Pattern */}
        <div className='absolute inset-0 opacity-10'>
          <div className='absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl'></div>
          <div className='absolute bottom-10 right-10 w-24 h-24 bg-white rounded-full blur-2xl'></div>
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative'>
          <div className='text-center mb-12'>
            <h2 className='text-2xl md:text-3xl font-bold text-white mb-4'>Trusted by Thousands</h2>
            <p className='text-blue-100 text-lg'>Join our growing community of satisfied users</p>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8'>
            <div className='text-center group'>
              <div className='text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-200'>
                1000+
              </div>
              <div className='text-blue-100 text-sm md:text-base font-medium'>
                Verified Listings
              </div>
            </div>
            <div className='text-center group'>
              <div className='text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-200'>
                500+
              </div>
              <div className='text-blue-100 text-sm md:text-base font-medium'>Happy Customers</div>
            </div>
            <div className='text-center group'>
              <div className='text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-200'>
                50+
              </div>
              <div className='text-blue-100 text-sm md:text-base font-medium'>Cities Covered</div>
            </div>
            <div className='text-center group'>
              <div className='text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-200'>
                24/7
              </div>
              <div className='text-blue-100 text-sm md:text-base font-medium'>Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-16 md:py-24 bg-gradient-to-b from-blue-50/50 via-indigo-50/30 to-purple-50/50 relative overflow-hidden'>
        {/* Elegant background image */}
        <div className='absolute inset-0'>
          <div
            className='absolute inset-0 bg-cover bg-center bg-no-repeat opacity-8'
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
            }}
          />
        </div>
        {/* Subtle floating elements */}
        <div className='absolute inset-0 overflow-hidden pointer-events-none z-5'>
          <div className='absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/10 rounded-full blur-3xl animate-float'></div>
          <div
            className='absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-200/10 rounded-full blur-3xl animate-float'
            style={{ animationDelay: '2s' }}
          ></div>
        </div>

        <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10'>
          <div className='bg-white/90 backdrop-blur-sm border border-blue-200/30 rounded-3xl p-8 md:p-12 shadow-2xl'>
            <div className='inline-flex items-center px-4 py-2 bg-blue-100/80 backdrop-blur-sm border border-blue-200/50 text-blue-800 rounded-full text-sm font-medium mb-6'>
              ⚡ Get Started Today
            </div>

            <h2 className='text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 mb-6'>
              Ready to Find Your Perfect Bed Space?
            </h2>
            <p className='text-lg md:text-xl text-slate-600 mb-8 max-w-3xl mx-auto'>
              Join thousands of satisfied users who found their ideal accommodation through BedSpace
            </p>

            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
              <Button
                size='lg'
                onClick={handleGetStarted}
                className='px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200'
              >
                Get Started Now
                <ArrowRight className='w-5 h-5 ml-2' />
              </Button>
              <Button
                size='lg'
                variant='outline'
                onClick={() => router.push('/contact')}
                className='px-8 py-4 border-slate-300 bg-white hover:bg-slate-50 hover:border-blue-500 text-slate-700 hover:text-blue-600 rounded-xl text-base font-semibold transition-all duration-200'
              >
                Contact Us
              </Button>
            </div>

            {/* Additional trust elements */}
            <div className='mt-8 pt-8 border-t border-slate-200'>
              <p className='text-sm text-slate-500 mb-4'>Trusted by leading companies</p>
              <div className='flex justify-center items-center space-x-8 opacity-60'>
                <div className='text-slate-600 font-semibold text-sm'>TechCorp</div>
                <div className='text-slate-600 font-semibold text-sm'>StartupXYZ</div>
                <div className='text-slate-600 font-semibold text-sm'>InnovateLab</div>
                <div className='text-slate-600 font-semibold text-sm'>FutureWorks</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16 md:py-20 relative overflow-hidden'>
        {/* Background Pattern */}
        <div className='absolute inset-0 opacity-5'>
          <div className='absolute top-10 left-1/4 w-32 h-32 bg-blue-500 rounded-full blur-3xl'></div>
          <div className='absolute bottom-10 right-1/4 w-24 h-24 bg-purple-500 rounded-full blur-2xl'></div>
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12'>
            <div className='md:col-span-1'>
              <div className='flex items-center space-x-3 mb-6'>
                <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center'>
                  <Building className='w-6 h-6 text-white' />
                </div>
                <h3 className='text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
                  BedSpace
                </h3>
              </div>
              <p className='text-gray-300 leading-relaxed mb-6'>
                Your trusted platform for finding and listing bed spaces across the country. Safe,
                secure, and reliable.
              </p>
              <div className='flex space-x-4'>
                <div className='w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center cursor-pointer transition-colors'>
                  <span className='text-sm font-bold'>f</span>
                </div>
                <div className='w-10 h-10 bg-gray-800 hover:bg-blue-400 rounded-full flex items-center justify-center cursor-pointer transition-colors'>
                  <span className='text-sm font-bold'>t</span>
                </div>
                <div className='w-10 h-10 bg-gray-800 hover:bg-pink-600 rounded-full flex items-center justify-center cursor-pointer transition-colors'>
                  <span className='text-sm font-bold'>i</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className='font-bold text-lg mb-6 text-blue-400'>For Seekers</h4>
              <ul className='space-y-3 text-gray-300'>
                <li>
                  <a
                    href='/search'
                    className='hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group'
                  >
                    <ArrowRight className='w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity' />
                    Search Listings
                  </a>
                </li>
                <li>
                  <a
                    href='/how-it-works'
                    className='hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group'
                  >
                    <ArrowRight className='w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity' />
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href='/safety'
                    className='hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group'
                  >
                    <ArrowRight className='w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity' />
                    Safety Tips
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className='font-bold text-lg mb-6 text-green-400'>For Providers</h4>
              <ul className='space-y-3 text-gray-300'>
                <li>
                  <a
                    href='/list-space'
                    className='hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group'
                  >
                    <ArrowRight className='w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity' />
                    List Your Space
                  </a>
                </li>
                <li>
                  <a
                    href='/provider-guide'
                    className='hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group'
                  >
                    <ArrowRight className='w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity' />
                    Provider Guide
                  </a>
                </li>
                <li>
                  <a
                    href='/verification'
                    className='hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group'
                  >
                    <ArrowRight className='w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity' />
                    Verification
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className='font-bold text-lg mb-6 text-purple-400'>Support</h4>
              <ul className='space-y-3 text-gray-300'>
                <li>
                  <a
                    href='/help'
                    className='hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group'
                  >
                    <ArrowRight className='w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity' />
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href='/contact'
                    className='hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group'
                  >
                    <ArrowRight className='w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity' />
                    Contact Us
                  </a>
                </li>
                <li>
                  <a
                    href='/privacy'
                    className='hover:text-white hover:translate-x-1 transition-all duration-200 flex items-center group'
                  >
                    <ArrowRight className='w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity' />
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className='border-t border-gray-700 mt-12 pt-8'>
            <div className='flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0'>
              <div className='text-gray-400 text-sm'>
                <p>&copy; 2024 BedSpace. All rights reserved.</p>
              </div>
              <div className='flex items-center space-x-6 text-sm text-gray-400'>
                <a href='/terms' className='hover:text-white transition-colors'>
                  Terms of Service
                </a>
                <a href='/privacy' className='hover:text-white transition-colors'>
                  Privacy Policy
                </a>
                <a href='/cookies' className='hover:text-white transition-colors'>
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
