'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Star, Wifi, Car, Coffee, Trash2 } from 'lucide-react';
import { useGetSeekerFavoritesQuery, useRemoveFromFavoritesMutation } from '@/lib/api/seekerApi';
import { toast } from 'sonner';
import { PageSkeleton } from '@/components/ui/page-skeleton';

interface FavoriteListing {
  id: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviewCount: number;
  provider: string;
  amenities: string[];
  image: string | null;
  savedDate: string;
  status: 'available' | 'unavailable';
}

export default function FavoritesPage() {
  const { data: favoritesResponse, isLoading, error } = useGetSeekerFavoritesQuery({});
  const [removeFromFavorites] = useRemoveFromFavoritesMutation();

  const favorites: FavoriteListing[] = (favoritesResponse?.data || []).map((listing: any) => ({
    id: listing.id,
    title: listing.title,
    location: listing.location,
    price: listing.price,
    rating: listing.rating,
    reviewCount: listing.reviewCount,
    provider: listing.provider,
    amenities: listing.amenities,
    image: listing.image ?? null,
    savedDate: listing.savedDate,
    status: listing.status,
  }));

  const removeFavorite = async (listingId: string) => {
    try {
      await removeFromFavorites(listingId).unwrap();
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove favorite');
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi className='h-4 w-4' />;
      case 'parking':
        return <Car className='h-4 w-4' />;
      case 'kitchen':
        return <Coffee className='h-4 w-4' />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <DashboardLayout title='Favorite Listings'>
      <div className='p-6 space-y-6'>
        {/* Header */}
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>My Favorites</h1>
            <p className='text-gray-600'>
              {favorites.length} saved listing{favorites.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Favorites Grid */}
        {favorites.length === 0 ? (
          <Card className='text-center py-12'>
            <CardContent>
              <Heart className='h-16 w-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>No favorites yet</h3>
              <p className='text-gray-600 mb-4'>
                Start exploring and save listings you love to see them here.
              </p>
              <Button>
                <a href='/search'>Browse Listings</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {favorites.map(listing => (
              <Card key={listing.id} className='overflow-hidden hover:shadow-lg transition-shadow'>
                <div className='relative'>
                  <img
                    src={listing.image || '/images/placeholder-room.jpg'}
                    alt={listing.title}
                    className='w-full h-48 object-cover'
                  />
                  <div className='absolute top-2 right-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => removeFavorite(listing.id)}
                      className='bg-white/80 hover:bg-white text-red-500 hover:text-red-600'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                  <div
                    className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                      listing.status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {listing.status === 'available' ? 'Available' : 'Unavailable'}
                  </div>
                </div>

                <CardContent className='p-4'>
                  <div className='flex justify-between items-start mb-2'>
                    <h3 className='font-semibold text-gray-900 line-clamp-1'>{listing.title}</h3>
                    <div className='flex items-center text-sm text-gray-600'>
                      <Star className='h-4 w-4 text-yellow-400 mr-1' />
                      {listing.rating} ({listing.reviewCount})
                    </div>
                  </div>

                  <div className='flex items-center text-gray-600 mb-2'>
                    <MapPin className='h-4 w-4 mr-1' />
                    <span className='text-sm line-clamp-1'>{listing.location}</span>
                  </div>

                  <div className='flex items-center justify-between mb-3'>
                    <div className='text-lg font-bold text-gray-900'>
                      ₹{listing.price.toLocaleString()}/month
                    </div>
                    <div className='text-sm text-gray-500'>
                      Saved {new Date(listing.savedDate).toLocaleDateString()}
                    </div>
                  </div>

                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex space-x-2'>
                      {listing.amenities?.slice(0, 3).map((amenity: string) => (
                        <div key={amenity} className='flex items-center text-gray-600'>
                          {getAmenityIcon(amenity)}
                        </div>
                      ))}
                      {listing.amenities && listing.amenities.length > 3 && (
                        <span className='text-sm text-gray-500'>
                          +{listing.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className='flex space-x-2'>
                    <Button className='flex-1' size='sm'>
                      View Details
                    </Button>
                    <Button variant='outline' size='sm'>
                      Contact
                    </Button>
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
