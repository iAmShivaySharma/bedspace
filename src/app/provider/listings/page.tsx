'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import VerificationRequired from '@/components/ui/verification-required';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building, Eye, Edit, Trash2 } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  verificationStatus?: string;
}

interface Listing {
  _id: string;
  title: string;
  description: string;
  rent: number;
  price?: number; // For backwards compatibility
  address: string;
  city: string;
  location?: string; // For backwards compatibility
  isActive: boolean;
  isApproved: boolean;
  status?: 'active' | 'inactive' | 'pending'; // For backwards compatibility
  roomType: string;
  genderPreference: string;
  facilities: string[];
  images: Array<{ fileUrl: string; isPrimary: boolean }>;
  createdAt: string;
  updatedAt: string;
}

export default function ProviderListingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndListings = async () => {
      try {
        // Get current user
        const userResponse = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (!userResponse.ok) {
          router.push('/auth');
          return;
        }

        const userData = await userResponse.json();
        if (userData.success && userData.data.user) {
          setUser(userData.data.user);

          // Only fetch listings if user is verified
          if (userData.data.user.verificationStatus === 'approved') {
            const listingsResponse = await fetch('/api/providers/listings', {
              credentials: 'include',
            });

            if (listingsResponse.ok) {
              const listingsData = await listingsResponse.json();
              setListings(listingsData.data || []);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndListings();
  }, [router]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (!user || user.role !== 'provider') {
    router.push('/dashboard');
    return null;
  }

  // Show verification required if not approved
  if (user.verificationStatus !== 'approved') {
    return (
      <DashboardLayout title='My Listings'>
        <VerificationRequired
          title='Provider Verification Required'
          description='You must be verified to manage listings and accept bookings.'
          verificationStatus={user.verificationStatus as any}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title='My Listings'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>My Listings</h1>
            <p className='text-gray-600'>Manage your bed space listings</p>
          </div>
          <Button onClick={() => router.push('/provider/listings/new')}>
            <Plus className='w-4 h-4 mr-2' />
            Add New Listing
          </Button>
        </div>

        {error && (
          <div className='p-4 bg-red-100 border border-red-400 text-red-700 rounded-md'>
            {error}
          </div>
        )}

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <Card className='text-center py-12'>
            <CardContent>
              <Building className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <CardTitle className='text-xl mb-2'>No Listings Yet</CardTitle>
              <CardDescription className='mb-6'>
                Start by creating your first bed space listing to attract renters.
              </CardDescription>
              <Button onClick={() => router.push('/provider/listings/new')}>
                <Plus className='w-4 h-4 mr-2' />
                Create Your First Listing
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {listings?.map(listing => (
              <Card key={listing._id} className='hover:shadow-md transition-shadow'>
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <CardTitle className='text-lg line-clamp-1'>{listing.title}</CardTitle>
                      <CardDescription className='text-sm text-gray-500'>
                        {listing.location || `${listing.address}, ${listing.city}`}
                      </CardDescription>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${(() => {
                        const status =
                          listing.status ||
                          (!listing.isApproved
                            ? 'pending'
                            : !listing.isActive
                              ? 'inactive'
                              : 'active');
                        return status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800';
                      })()}`}
                    >
                      {(() => {
                        const status =
                          listing.status ||
                          (!listing.isApproved
                            ? 'pending'
                            : !listing.isActive
                              ? 'inactive'
                              : 'active');
                        return status.charAt(0).toUpperCase() + status.slice(1);
                      })()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-gray-600 line-clamp-2 mb-4'>{listing.description}</p>

                  {/* Room type and gender preference */}
                  <div className='flex gap-2 mb-3'>
                    <span className='px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs'>
                      {listing.roomType === 'single'
                        ? 'Private'
                        : listing.roomType === 'shared'
                          ? 'Shared'
                          : listing.roomType}
                    </span>
                    <span className='px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs'>
                      {listing.genderPreference === 'any'
                        ? 'Any Gender'
                        : listing.genderPreference === 'male'
                          ? 'Male Only'
                          : listing.genderPreference === 'female'
                            ? 'Female Only'
                            : listing.genderPreference}
                    </span>
                  </div>

                  {/* Facilities */}
                  {listing.facilities && listing.facilities.length > 0 && (
                    <div className='flex flex-wrap gap-1 mb-3'>
                      {listing.facilities.slice(0, 3).map(facility => (
                        <span
                          key={facility}
                          className='px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs'
                        >
                          {facility}
                        </span>
                      ))}
                      {listing.facilities.length > 3 && (
                        <span className='px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs'>
                          +{listing.facilities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-lg font-bold text-blue-600'>
                        ₹{(listing?.rent || listing?.price)?.toLocaleString()}
                      </p>
                      <p className='text-xs text-gray-500'>per month</p>
                    </div>
                    <div className='flex items-center space-x-1'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => router.push(`/listing/${listing._id}`)}
                        title='View listing details'
                      >
                        <Eye className='w-4 h-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => router.push(`/provider/listings/${listing._id}/edit`)}
                        title='Edit listing'
                      >
                        <Edit className='w-4 h-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-red-600 hover:text-red-700'
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this listing?')) {
                            // TODO: Implement delete functionality
                            console.log('Delete listing:', listing._id);
                          }
                        }}
                        title='Delete listing'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
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
