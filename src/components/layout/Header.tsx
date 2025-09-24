'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Menu,
  User,
  Settings,
  LogOut,
  Home,
  Search,
  Plus,
  MessageCircle,
  Bell,
} from 'lucide-react';

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
  notifications?: number;
}

export default function DashboardHeader({
  user,
  onMenuToggle,
  title,
  notifications = 0,
}: DashboardHeaderProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    router.push('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getDashboardRoute = () => {
    if (!user) return '/dashboard';
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

  if (!mounted) {
    return (
      <header className='bg-white shadow-sm border-b sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center'>
              <h1 className='text-2xl font-bold text-blue-600'>BedSpace</h1>
            </div>
            <div className='animate-pulse bg-gray-200 h-8 w-20 rounded'></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className='bg-white shadow-sm border-b sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Left side */}
          <div className='flex items-center space-x-4'>
            {/* Mobile menu button */}
            {user && (
              <Button variant='ghost' size='sm' className='md:hidden' onClick={onMenuToggle}>
                <Menu className='w-5 h-5' />
              </Button>
            )}

            {/* Logo */}
            <div className='flex items-center cursor-pointer' onClick={() => router.push('/')}>
              <h1 className='text-2xl font-bold text-blue-600'>BedSpace</h1>
            </div>
          </div>

          {/* Center - Navigation (Desktop) */}
          {user && (
            <nav className='hidden md:flex items-center space-x-6'>
              <Button
                variant='ghost'
                onClick={() => router.push('/')}
                className='flex items-center space-x-2'
              >
                <Home className='w-4 h-4' />
                <span>Home</span>
              </Button>

              <Button
                variant='ghost'
                onClick={() => router.push('/search')}
                className='flex items-center space-x-2'
              >
                <Search className='w-4 h-4' />
                <span>Search</span>
              </Button>

              {user.role === 'provider' && (
                <Button
                  variant='ghost'
                  onClick={() => router.push('/provider/listings/new')}
                  className='flex items-center space-x-2'
                >
                  <Plus className='w-4 h-4' />
                  <span>Add Listing</span>
                </Button>
              )}

              <Button
                variant='ghost'
                onClick={() => router.push('/messages')}
                className='flex items-center space-x-2 relative'
              >
                <MessageCircle className='w-4 h-4' />
                <span>Messages</span>
                {/* Message notification badge */}
                <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                  2
                </span>
              </Button>
            </nav>
          )}

          {/* Right side */}
          <div className='flex items-center space-x-4'>
            {user ? (
              <>
                {/* Notifications */}
                <Button variant='ghost' size='sm' className='relative'>
                  <Bell className='w-5 h-5' />
                  <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center'>
                    3
                  </span>
                </Button>

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' className='relative h-10 w-10 rounded-full'>
                      <Avatar className='h-10 w-10'>
                        <AvatarFallback className='bg-blue-100 text-blue-600 font-semibold'>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className='w-56' align='end' forceMount>
                    <DropdownMenuLabel className='font-normal'>
                      <div className='flex flex-col space-y-1'>
                        <p className='text-sm font-medium leading-none'>{user.name}</p>
                        <p className='text-xs leading-none text-muted-foreground'>{user.email}</p>
                        <div className='flex items-center space-x-2 mt-1'>
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              user.isVerified ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                          ></span>
                          <span className='text-xs text-muted-foreground capitalize'>
                            {user.role} {user.isVerified ? '(Verified)' : '(Pending)'}
                          </span>
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

                    {user.role === 'provider' && (
                      <DropdownMenuItem onClick={() => router.push('/provider/verification')}>
                        <Settings className='mr-2 h-4 w-4' />
                        <span>Verification</span>
                      </DropdownMenuItem>
                    )}

                    {user.role === 'admin' && (
                      <DropdownMenuItem onClick={() => router.push('/admin')}>
                        <Settings className='mr-2 h-4 w-4' />
                        <span>Admin Panel</span>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className='mr-2 h-4 w-4' />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className='flex items-center space-x-2'>
                <Button variant='ghost' onClick={() => router.push('/auth')}>
                  Sign In
                </Button>
                <Button onClick={() => router.push('/auth')}>Get Started</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {user && showMobileMenu && (
        <div className='md:hidden border-t bg-white'>
          <div className='px-4 py-2 space-y-1'>
            <Button
              variant='ghost'
              className='w-full justify-start'
              onClick={() => router.push('/')}
            >
              <Home className='w-4 h-4 mr-3' />
              Home
            </Button>

            <Button
              variant='ghost'
              className='w-full justify-start'
              onClick={() => router.push('/search')}
            >
              <Search className='w-4 h-4 mr-3' />
              Search
            </Button>

            {user.role === 'provider' && (
              <Button
                variant='ghost'
                className='w-full justify-start'
                onClick={() => router.push('/provider/listings/new')}
              >
                <Plus className='w-4 h-4 mr-3' />
                Add Listing
              </Button>
            )}

            <Button
              variant='ghost'
              className='w-full justify-start'
              onClick={() => router.push('/messages')}
            >
              <MessageCircle className='w-4 h-4 mr-3' />
              Messages
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
