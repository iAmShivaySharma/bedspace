'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from './DashboardHeader';
import Sidebar from './Sidebar';
import { PageSkeleton } from '@/components/ui/page-skeleton';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarOpen');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');

        if (response.ok) {
          const result = await response.json();
          setUser(result.data);
        } else {
          router.push('/auth');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleMenuToggle = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const handleSidebarToggle = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex'>
        {/* Sidebar Skeleton */}
        <div className='hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0'>
          <div className='flex flex-col bg-white border-r border-gray-200'>
            <div className='flex items-center h-16 px-6 border-b border-gray-200'>
              <div className='h-8 w-32 bg-gray-200 rounded animate-pulse'></div>
            </div>
            <div className='flex-1 px-4 py-4'>
              <div className='space-y-3'>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className='flex items-center px-4 py-2 space-x-3'>
                    <div className='w-5 h-5 bg-gray-200 rounded animate-pulse'></div>
                    <div className='h-4 bg-gray-200 rounded flex-1 animate-pulse'></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex-1 lg:pl-64'>
          {/* Header Skeleton */}
          <div className='bg-white shadow-sm border-b border-gray-200'>
            <div className='flex items-center justify-between h-16 px-4 sm:px-6'>
              <div className='h-6 w-48 bg-gray-200 rounded animate-pulse'></div>
              <div className='flex items-center space-x-4'>
                <div className='w-8 h-8 bg-gray-200 rounded-full animate-pulse'></div>
                <div className='w-8 h-8 bg-gray-200 rounded-full animate-pulse'></div>
                <div className='w-8 h-8 bg-gray-200 rounded-full animate-pulse'></div>
              </div>
            </div>
          </div>

          {/* Page Content Skeleton */}
          <main className='flex-1'>
            <PageSkeleton type='dashboard' />
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <DashboardHeader user={user} onMenuToggle={handleSidebarToggle} title={title} />

      <div className='flex'>
        {/* Sidebar */}
        <Sidebar
          user={user}
          isOpen={sidebarOpen}
          onToggle={handleSidebarToggle}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}
        >
          <div className='p-4 lg:p-8'>
            {title && (
              <div className='mb-8'>
                <h1 className='text-3xl font-bold text-gray-900'>{title}</h1>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
