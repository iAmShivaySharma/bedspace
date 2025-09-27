'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import {
  useCheckFavoriteStatusQuery,
  useAddToFavoritesMutation,
  useRemoveFromFavoritesMutation,
} from '@/lib/api/commonApi';

interface FavoriteButtonProps {
  listingId: string;
  isAuthenticated: boolean;
  className?: string;
  variant?: 'default' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  onAuthRequired?: () => void;
}

export default function FavoriteButton({
  listingId,
  isAuthenticated,
  className = '',
  variant = 'ghost',
  size = 'sm',
  onAuthRequired,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const {
    data: favoriteStatus,
    isLoading: isCheckingStatus,
    error,
    refetch,
  } = useCheckFavoriteStatusQuery(listingId, {
    skip: !isAuthenticated,
    // Force refetch when authentication status changes
    refetchOnMountOrArgChange: true,
  });

  const [addToFavorites, { isLoading: isAdding }] = useAddToFavoritesMutation();
  const [removeFromFavorites, { isLoading: isRemoving }] = useRemoveFromFavoritesMutation();

  useEffect(() => {
    if (favoriteStatus?.data?.isFavorite !== undefined) {
      setIsFavorite(favoriteStatus.data.isFavorite);
      console.log('Favorite status updated:', {
        listingId,
        isFavorite: favoriteStatus.data.isFavorite,
        isAuthenticated,
      });
    }
  }, [favoriteStatus, listingId, isAuthenticated]);

  // Handle authentication changes and refetch
  useEffect(() => {
    if (!isAuthenticated) {
      setIsFavorite(false);
    } else {
      // When user becomes authenticated, refetch the favorite status
      refetch();
    }
  }, [isAuthenticated, refetch]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      onAuthRequired?.();
      return;
    }

    try {
      if (isFavorite) {
        await removeFromFavorites(listingId).unwrap();
        setIsFavorite(false);
      } else {
        await addToFavorites({ listingId }).unwrap();
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const isLoading = isCheckingStatus || isAdding || isRemoving;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`transition-colors ${className} ${
        variant === 'ghost' ? 'bg-white/80 hover:bg-white p-2 rounded-full' : ''
      }`}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${
          isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'
        } ${isLoading ? 'opacity-50' : ''}`}
      />
    </Button>
  );
}
