'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrency } from '@/hooks/useLocalization';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import HomeHeader from '@/components/layout/HomeHeader';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FavoriteButton from '@/components/ui/FavoriteButton';
import ScheduleVisitModal from '@/components/chat/ScheduleVisitModal';
import BookingModal from '@/components/booking/BookingModal';
import { useCreateConversationMutation } from '@/lib/api/commonApi';
import {
  MapPin,
  Star,
  Heart,
  MessageCircle,
  ArrowLeft,
  Wifi,
  Car,
  Utensils,
  Dumbbell,
  Users,
  Calendar,
  IndianRupee,
  Home,
} from 'lucide-react';

interface Listing {
  _id: string;
  title: string;
  description: string;
  rent: number;
  securityDeposit: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  roomType: 'single' | 'shared' | 'private';
  genderPreference: 'male' | 'female' | 'any';
  facilities: string[];
  images: Array<{ fileUrl: string; isPrimary: boolean }>;
  availableFrom: string;
  isActive: boolean;
  isApproved: boolean;
  providerId: string;
  provider: {
    _id: string;
    name: string;
    avatar?: string;
    rating?: number;
    totalReviews?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  role: 'seeker' | 'provider' | 'admin';
  name: string;
  email: string;
}

export default function ListingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const listingId = params?.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const [createConversation] = useCreateConversationMutation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check authentication (optional for listing view)
        try {
          const userResponse = await fetch('/api/auth/me', {
            credentials: 'include',
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUser(userData.data.user);
          }
        } catch {
          // User not authenticated, continue without user data
        }

        // Fetch listing details
        const listingResponse = await fetch(`/api/listings/${listingId}`);
        if (listingResponse.ok) {
          const listingData = await listingResponse.json();
          setListing(listingData.data);
        } else {
          setError('Listing not found');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load listing details');
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      fetchData();
    }
  }, [listingId]);

  const handleContactProvider = async () => {
    if (!user) {
      router.push('/auth?redirect=' + encodeURIComponent(`/listing/${listingId}`));
      return;
    }

    if (user.role !== 'seeker') {
      alert('Only seekers can contact providers');
      return;
    }

    if (!listing) return;

    try {
      const result = await createConversation({
        participantId: listing.provider._id,
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

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
      case 'wi-fi':
      case 'internet':
        return <Wifi className='w-4 h-4' />;
      case 'parking':
        return <Car className='w-4 h-4' />;
      case 'kitchen':
      case 'cooking':
        return <Utensils className='w-4 h-4' />;
      case 'gym':
      case 'fitness':
        return <Dumbbell className='w-4 h-4' />;
      default:
        return null;
    }
  };

  const renderContent = (content: React.ReactNode) => {
    if (user) {
      return (
        <DashboardLayout title={listing ? listing.title : 'Listing Details'}>
          {content}
        </DashboardLayout>
      );
    }
    return (
      <div className='min-h-screen bg-gray-50'>
        <HomeHeader user={user} />
        {content}
      </div>
    );
  };

  if (loading) {
    return renderContent(<PageSkeleton />);
  }

  if (error || !listing) {
    return renderContent(
      <div className='max-w-4xl mx-auto px-4 py-8'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>Listing Not Found</h1>
          <p className='text-gray-600 mb-6'>
            {error || 'The listing you are looking for does not exist.'}
          </p>
          <Button onClick={() => router.push('/search')}>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  return renderContent(
    <div className='max-w-6xl mx-auto px-4 py-8'>
      {/* Back Button */}
      <Button variant='ghost' onClick={() => router.back()} className='mb-6'>
        <ArrowLeft className='w-4 h-4 mr-2' />
        Back
      </Button>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Main Content */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Images */}
          <Card>
            <CardContent className='p-0'>
              {listing.images && listing.images.length > 0 ? (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                  {listing.images.map((image, index) => (
                    <div
                      key={index}
                      className={`${
                        index === 0 ? 'md:col-span-2' : ''
                      } aspect-video overflow-hidden rounded-lg`}
                    >
                      <img
                        src={image.fileUrl}
                        alt={`${listing.title} - Image ${index + 1}`}
                        className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className='aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center rounded-t-lg'>
                  <div className='text-center'>
                    <div className='w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg'>
                      <MapPin className='w-8 h-8 text-blue-600' />
                    </div>
                    <p className='text-sm text-gray-600'>No images available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Title and Description */}
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-start justify-between mb-4'>
                <div className='flex-1'>
                  <h1 className='text-3xl font-bold text-gray-900 mb-2'>{listing.title}</h1>
                  <div className='flex items-center text-gray-600 mb-4'>
                    <MapPin className='w-5 h-5 mr-2' />
                    <span>
                      {listing.address}, {listing.city}, {listing.state} {listing.pincode}
                    </span>
                  </div>
                </div>
                {(!user || user.role === 'seeker') && (
                  <FavoriteButton
                    listingId={listing._id}
                    isAuthenticated={!!user}
                    onAuthRequired={() =>
                      router.push('/auth?redirect=' + encodeURIComponent(`/listing/${listingId}`))
                    }
                  />
                )}
              </div>

              <div className='flex gap-3 mb-6'>
                <span className='px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium'>
                  {listing.roomType === 'single'
                    ? 'Private Room'
                    : listing.roomType === 'shared'
                      ? 'Shared Room'
                      : listing.roomType}
                </span>
                <span className='px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium'>
                  {listing.genderPreference === 'any'
                    ? 'Any Gender'
                    : listing.genderPreference === 'male'
                      ? 'Male Only'
                      : listing.genderPreference === 'female'
                        ? 'Female Only'
                        : listing.genderPreference}
                </span>
                <span className='px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium'>
                  Available from {new Date(listing.availableFrom).toLocaleDateString()}
                </span>
              </div>

              <div className='prose max-w-none'>
                <h3 className='text-lg font-semibold mb-3'>Description</h3>
                <p className='text-gray-600 leading-relaxed'>{listing.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Amenities & Facilities */}
          <Card>
            <CardContent className='p-6'>
              <h3 className='text-lg font-semibold mb-4'>Amenities & Facilities</h3>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                {listing.facilities.map(facility => (
                  <div
                    key={facility}
                    className='flex items-center space-x-2 p-3 bg-gray-50 rounded-lg'
                  >
                    {getAmenityIcon(facility)}
                    <span className='text-sm text-gray-700 capitalize'>{facility}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Pricing Card */}
          <Card>
            <CardContent className='p-6'>
              <div className='mb-6'>
                <div className='flex items-center mb-2'>
                  <IndianRupee className='w-6 h-6 text-blue-600 mr-1' />
                  <span className='text-3xl font-bold text-gray-900'>
                    {formatCurrency(listing.rent)}
                  </span>
                  <span className='text-gray-600 ml-2'>per month</span>
                </div>
                <p className='text-sm text-gray-600'>
                  Security Deposit: {formatCurrency(listing.securityDeposit)}
                </p>
              </div>

              {user?.role === 'seeker' && (
                <div className='space-y-3'>
                  <Button
                    onClick={() => setShowBookingModal(true)}
                    className='w-full bg-green-600 hover:bg-green-700'
                    size='lg'
                  >
                    <Home className='w-5 h-5 mr-2' />
                    Book Now
                  </Button>
                  <div className='grid grid-cols-2 gap-3'>
                    <Button variant='outline' onClick={() => setShowScheduleModal(true)} size='lg'>
                      <Calendar className='w-5 h-5 mr-2' />
                      Schedule Visit
                    </Button>
                    <Button onClick={handleContactProvider} variant='outline' size='lg'>
                      <MessageCircle className='w-5 h-5 mr-2' />
                      Message
                    </Button>
                  </div>
                </div>
              )}

              {!user && (
                <div className='space-y-3'>
                  <Button
                    onClick={() =>
                      router.push('/auth?redirect=' + encodeURIComponent(`/listing/${listingId}`))
                    }
                    className='w-full'
                    size='lg'
                  >
                    <MessageCircle className='w-5 h-5 mr-2' />
                    Login to Contact
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Provider Info */}
          <Card>
            <CardContent className='p-6'>
              <h3 className='text-lg font-semibold mb-4'>Property Owner</h3>
              <div className='flex items-center space-x-3 mb-4'>
                <img
                  src={listing.provider.avatar || '/images/default-avatar.png'}
                  alt={listing.provider.name}
                  className='w-12 h-12 rounded-full object-cover'
                />
                <div>
                  <p className='font-semibold text-gray-900'>{listing.provider.name}</p>
                  {listing.provider.rating && (
                    <div className='flex items-center space-x-1'>
                      <Star className='w-4 h-4 fill-yellow-400 text-yellow-400' />
                      <span className='text-sm text-gray-600'>
                        {listing.provider.rating} ({listing.provider.totalReviews} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Button variant='outline' className='w-full'>
                <Users className='w-4 h-4 mr-2' />
                View Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedule Visit Modal */}
      {user?.role === 'seeker' && listing && (
        <ScheduleVisitModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          listingId={listing._id}
          providerId={listing.provider._id}
          listingTitle={listing.title}
        />
      )}

      {/* Booking Modal */}
      {user?.role === 'seeker' && listing && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          listing={{
            id: listing._id,
            title: listing.title,
            rent: listing.rent,
            securityDeposit: listing.securityDeposit,
            address: listing.address,
            city: listing.city,
          }}
          providerId={listing.provider._id}
        />
      )}
    </div>
  );
}
