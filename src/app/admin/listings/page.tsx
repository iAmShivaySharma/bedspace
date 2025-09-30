'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Search, Filter, MoreHorizontal, Eye, Ban, CheckCircle, MapPin, Star } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGetAdminListingsQuery, useAdminListingActionMutation } from '@/lib/api/adminApi';

interface AdminListing {
  _id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  provider: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  type: 'private_room' | 'shared_room' | 'entire_place';
  amenities: string[];
  images: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminListingsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [message, setMessage] = useState('');

  // Build filters object for the query
  const filters = {
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(typeFilter !== 'all' && { type: typeFilter }),
    ...(searchTerm && { search: searchTerm }),
  };

  const {
    data: listingsResponse,
    isLoading: loading,
    error,
    refetch: fetchListings,
  } = useGetAdminListingsQuery(filters);

  const [adminListingAction] = useAdminListingActionMutation();

  const listings: AdminListing[] = (listingsResponse?.data as unknown as AdminListing[]) || [];

  const handleListingAction = async (
    listingId: string,
    action: 'approve' | 'reject' | 'deactivate' | 'activate'
  ) => {
    try {
      const result = await adminListingAction({ listingId, action }).unwrap();
      setMessage(result.message || `Listing ${action}d successfully`);
      setTimeout(() => setMessage(''), 3000);
      // Force refresh of listings data
      fetchListings();
    } catch (error: any) {
      console.error(`Error ${action}ing listing:`, error);
      const errorMessage = error?.data?.error || error?.message || `Failed to ${action} listing`;
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'private_room':
        return 'bg-blue-100 text-blue-800';
      case 'shared_room':
        return 'bg-purple-100 text-purple-800';
      case 'entire_place':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <DashboardLayout title='Listings Management'>
      {message && (
        <div className='mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded'>
          {message}
        </div>
      )}

      {error && (
        <div className='mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded'>
          {'data' in error
            ? (error.data as any)?.error
            : 'message' in error
              ? error.message
              : 'Failed to load listings'}
        </div>
      )}

      {/* Search and Filters */}
      <div className='mb-6 flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <Input
            placeholder='Search listings by title, location, or provider...'
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
            <option value='active'>Active</option>
            <option value='pending'>Pending</option>
            <option value='inactive'>Inactive</option>
            <option value='rejected'>Rejected</option>
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value='all'>All Types</option>
            <option value='private_room'>Private Room</option>
            <option value='shared_room'>Shared Room</option>
            <option value='entire_place'>Entire Place</option>
          </select>
          <Button onClick={() => fetchListings()} variant='outline'>
            <Filter className='w-4 h-4 mr-2' />
            Refresh
          </Button>
          <Button
            onClick={() => {
              // Trigger search by updating the filters
              fetchListings();
            }}
            className='bg-blue-600 hover:bg-blue-700'
          >
            <Search className='w-4 h-4 mr-2' />
            Search
          </Button>
        </div>
      </div>

      {/* Listings Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {listings.map(listing => (
          <Card key={listing._id} className='hover:shadow-md transition-shadow'>
            <CardHeader className='pb-3'>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <CardTitle className='text-lg line-clamp-2'>{listing.title}</CardTitle>
                  <div className='flex items-center text-sm text-gray-500 mt-1'>
                    <MapPin className='w-3 h-3 mr-1' />
                    {listing.location}
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
                    {listing.status === 'pending' && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleListingAction(listing._id, 'approve')}
                          className='text-green-600'
                        >
                          <CheckCircle className='w-4 h-4 mr-2' />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleListingAction(listing._id, 'reject')}
                          className='text-red-600'
                        >
                          <Ban className='w-4 h-4 mr-2' />
                          Reject
                        </DropdownMenuItem>
                      </>
                    )}
                    {listing.status === 'active' && (
                      <DropdownMenuItem
                        onClick={() => handleListingAction(listing._id, 'deactivate')}
                        className='text-red-600'
                      >
                        <Ban className='w-4 h-4 mr-2' />
                        Deactivate
                      </DropdownMenuItem>
                    )}
                    {listing.status === 'inactive' && (
                      <DropdownMenuItem
                        onClick={() => handleListingAction(listing._id, 'activate')}
                        className='text-green-600'
                      >
                        <CheckCircle className='w-4 h-4 mr-2' />
                        Activate
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <Badge className={getStatusBadgeColor(listing.status)}>{listing.status}</Badge>
                  <Badge className={getTypeBadgeColor(listing.type)}>
                    {listing.type.replace('_', ' ')}
                  </Badge>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-2xl font-bold text-gray-900'>
                    ₹{listing.price.toLocaleString()}/month
                  </span>
                  <div className='flex items-center'>
                    <Star className='w-4 h-4 fill-yellow-400 text-yellow-400' />
                    <span className='text-sm ml-1'>
                      {listing.rating} ({listing.reviewCount})
                    </span>
                  </div>
                </div>

                <div>
                  <p className='text-sm text-gray-600 mb-2'>Provider:</p>
                  <p className='text-sm font-medium'>{listing.provider.name}</p>
                  <p className='text-xs text-gray-500'>{listing.provider.email}</p>
                </div>

                <div className='flex flex-wrap gap-1'>
                  {listing.amenities.slice(0, 3).map((amenity: string) => (
                    <span
                      key={amenity}
                      className='px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs'
                    >
                      {amenity}
                    </span>
                  ))}
                  {listing.amenities.length > 3 && (
                    <span className='px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs'>
                      +{listing.amenities.length - 3} more
                    </span>
                  )}
                </div>

                <div className='text-xs text-gray-500'>
                  Created: {new Date(listing.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {listings.length === 0 && !loading && (
        <div className='text-center py-12 text-gray-500'>
          <p>No listings found matching your criteria</p>
        </div>
      )}
    </DashboardLayout>
  );
}
