'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogIn, Home } from 'lucide-react';

interface HomeHeaderProps {
  user?: any;
}

export default function HomeHeader({ user }: HomeHeaderProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const router = useRouter();

  const handleAuthAction = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/auth');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    window.location.href = '/';
  };

  return (
    <header className='relative bg-white shadow-lg border-b border-gray-200/50 sticky top-0 z-50 overflow-hidden'>
      {/* Background Image */}
      <div className='absolute inset-0'>
        <div
          className='absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5'
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
          }}
        />
        {/* Subtle pattern overlay */}
        <div
          className='absolute inset-0 opacity-3'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234f46e5' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='53' cy='53' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-20'>
          {/* Logo */}
          <div className='flex items-center relative z-10'>
            <button
              onClick={() => router.push('/')}
              className='flex items-center space-x-3 group transition-none'
            >
              <div className='relative w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-none'>
                <Home className='w-6 h-6 text-white' />
              </div>
              <div>
                <span className='text-2xl font-bold text-slate-800'>BedSpace</span>
                <div className='flex items-center space-x-1 mt-0.5'>
                  <span className='text-xs text-blue-600 font-semibold tracking-wider'>
                    PREMIUM
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className='hidden lg:flex items-center space-x-4'>
            {[
              { label: 'Search Rooms', path: '/search' },
              { label: 'How It Works', path: '/about' },
              { label: 'Help Center', path: '/help' },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className='relative text-slate-600 hover:text-slate-800 hover:bg-blue-50 transition-all duration-200 font-semibold py-2 px-4 rounded-lg'
              >
                <span className='relative z-10'>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className='hidden lg:flex items-center space-x-4'>
            {user ? (
              <div className='flex items-center space-x-4'>
                <div className='flex items-center space-x-3 bg-blue-50 rounded-xl px-4 py-2 border border-blue-200'>
                  <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm'>
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className='text-sm text-slate-700 font-medium'>Welcome, {user.name}</span>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => router.push('/dashboard')}
                  className='flex items-center space-x-2 border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-400 transition-all duration-200'
                >
                  <User className='w-4 h-4' />
                  <span>Dashboard</span>
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleLogout}
                  className='text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200'
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className='flex items-center space-x-3'>
                <Button
                  variant='ghost'
                  onClick={() => router.push('/auth')}
                  className='flex items-center space-x-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all duration-200'
                >
                  <LogIn className='w-4 h-4' />
                  <span>Sign In</span>
                </Button>
                <Button
                  onClick={() => router.push('/auth')}
                  className='bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 hover:from-blue-600 hover:via-purple-600 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200'
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className='lg:hidden'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className='p-3 rounded-xl hover:bg-slate-100 text-slate-700 transition-all duration-200'
            >
              {showMobileMenu ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className='lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm'>
            <div className='px-4 pt-4 pb-6 space-y-3'>
              {[
                { label: 'Search Rooms', path: '/search' },
                { label: 'How It Works', path: '/about' },
                { label: 'Help Center', path: '/help' },
              ].map(item => (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setShowMobileMenu(false);
                  }}
                  className='block w-full text-left px-4 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all duration-200 font-medium'
                >
                  {item.label}
                </button>
              ))}

              <div className='border-t border-gray-200 pt-4 mt-4'>
                {user ? (
                  <div className='space-y-3'>
                    <div className='flex items-center space-x-3 px-4 py-3 bg-blue-50 rounded-xl border border-blue-200'>
                      <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm'>
                        {user.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className='text-sm text-slate-700 font-medium'>
                        Welcome, {user.name}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        router.push('/dashboard');
                        setShowMobileMenu(false);
                      }}
                      className='block w-full text-left px-4 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all duration-200 font-medium'
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMobileMenu(false);
                      }}
                      className='block w-full text-left px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 font-medium'
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    <button
                      onClick={() => {
                        router.push('/auth');
                        setShowMobileMenu(false);
                      }}
                      className='block w-full text-left px-4 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all duration-200 font-medium'
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        router.push('/auth');
                        setShowMobileMenu(false);
                      }}
                      className='block w-full px-4 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 hover:from-blue-600 hover:via-purple-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-semibold text-center'
                    >
                      Get Started
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
