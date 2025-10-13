'use client';

import React, { useEffect } from 'react';
import { useGetCurrentUserQuery } from '@/lib/api/authApi';
import { useAppSelector } from '@/lib/hooks';
import { setLoading } from '@/lib/slices/authSlice';
import { useDispatch } from 'react-redux';
import { PageSkeleton } from '../ui/page-skeleton';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);

  // Automatically fetch current user on app load
  const {
    isLoading: isUserLoading,
    isError,
    error,
  } = useGetCurrentUserQuery(undefined, {
    skip: false, // Always try to fetch user on app load
    // Don't show 401 errors in console - they're expected when not logged in
    retry: false,
  });

  useEffect(() => {
    // Update loading state based on query status
    dispatch(setLoading(isUserLoading));
  }, [isUserLoading, dispatch]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <PageSkeleton />;
  }

  return <>{children}</>;
}
