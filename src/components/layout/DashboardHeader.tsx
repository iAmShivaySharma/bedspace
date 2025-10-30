'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, User, Settings, LogOut, Shield } from 'lucide-react';
import NotificationDropdown from '@/components/ui/NotificationDropdown';
import { useGetUnreadNotificationCountQuery } from '@/lib/api/commonApi';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  verificationStatus?: string;
}

interface DashboardHeaderProps {
  user: User;
  onMenuToggle: () => void;
  title?: string;
}

export default function DashboardHeader({ user, onMenuToggle, title }: DashboardHeaderProps) {
  const router = useRouter();

  // Use RTK Query for notification count
  const { data: notificationCountData } = useGetUnreadNotificationCountQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds
  });

  const notificationCount = notificationCountData?.data?.count || 0;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    router.push('/');
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U'; // Return 'U' for User if name is undefined
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getDashboardRoute = () => {
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'provider':
        return '/dashboard';
      case 'seeker':
      default:
        return '/dashboard';
    }
  };

  const getVerificationBadge = () => {
    if (user.role === 'provider' && user.verificationStatus) {
      const status = user.verificationStatus;
      const colors = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
      };
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}
        >
          {status}
        </span>
      );
    }
    return null;
  };

  return (
    <header className='bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm'>
      {/* Left side - Menu button and Title */}
      <div className='flex items-center space-x-4'>
        <Button variant='ghost' size='sm' onClick={onMenuToggle} className='lg:hidden'>
          <Menu className='h-6 w-6' />
        </Button>

        <div className='flex items-center space-x-3'>
          <button
            onClick={() => router.push('/')}
            className='text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all'
          >
            BedSpace
          </button>
          {title && (
            <>
              <span className='text-gray-300 hidden sm:block'>|</span>
              <h1 className='text-lg font-semibold text-gray-900 hidden sm:block'>{title}</h1>
            </>
          )}
        </div>
      </div>

      {/* Right side - Notifications and User Menu */}
      <div className='flex items-center space-x-3'>
        {/* Notifications */}
        <NotificationDropdown notificationCount={notificationCount} />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='relative h-10 w-10 rounded-full'>
              <Avatar className='h-10 w-10'>
                <AvatarFallback className='bg-gradient-to-r from-blue-500 to-purple-500 text-white'>
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-64' align='end' forceMount>
            <DropdownMenuLabel className='font-normal'>
              <div className='flex flex-col space-y-2'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm font-medium leading-none'>{user.name}</p>
                  {getVerificationBadge()}
                </div>
                <p className='text-xs leading-none text-muted-foreground'>{user.email}</p>
                <div className='flex items-center space-x-2'>
                  <span className='text-xs text-muted-foreground capitalize'>{user.role}</span>
                  {user.isVerified && <Shield className='h-3 w-3 text-green-500' />}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(getDashboardRoute())}>
              <User className='mr-2 h-4 w-4' />
              <span>Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <Settings className='mr-2 h-4 w-4' />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            {user.role === 'provider' && user.verificationStatus !== 'approved' && (
              <DropdownMenuItem onClick={() => router.push('/provider/verification')}>
                <Shield className='mr-2 h-4 w-4' />
                <span>Complete Verification</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className='text-red-600'>
              <LogOut className='mr-2 h-4 w-4' />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
