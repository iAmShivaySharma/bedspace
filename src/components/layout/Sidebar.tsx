'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import {
  Home,
  Search,
  Plus,
  MessageCircle,
  User,
  Settings,
  Shield,
  BarChart3,
  Building,
  Calendar,
  Heart,
  CreditCard,
  HelpCircle,
  ChevronLeft,
  Eye,
  ChevronRight,
  Users,
  FileText,
  Bell,
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
}

interface SidebarProps {
  user: User;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  requiresVerification?: boolean;
}

export default function Sidebar({ user, isOpen, onToggle, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useUnreadMessages();

  // Navigation items based on user role
  const getNavItems = (): NavItem[] => {
    const commonItems: NavItem[] = [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Search', href: '/search', icon: Search },
      { name: 'Profile', href: '/profile', icon: User },
    ];

    if (user.role === 'seeker') {
      return [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Seeker Hub', href: '/seeker/dashboard', icon: User },
        { name: 'Search', href: '/search', icon: Search },
        { name: 'Favorites', href: '/seeker/favorites', icon: Heart },
        { name: 'Bookings', href: '/seeker/bookings', icon: Calendar },
        {
          name: 'Messages',
          href: '/seeker/messages',
          icon: MessageCircle,
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
        { name: 'Payments', href: '/payments', icon: CreditCard },
        { name: 'Profile', href: '/profile', icon: User },
      ];
    }

    if (user.role === 'provider') {
      const isVerified = user.verificationStatus === 'approved';
      return [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        {
          name: 'My Listings',
          href: '/provider/listings',
          icon: Building,
          requiresVerification: true,
        },
        {
          name: 'Add Listing',
          href: '/provider/listings/new',
          icon: Plus,
          requiresVerification: true,
        },
        {
          name: 'Bookings',
          href: '/provider/bookings',
          icon: Calendar,
          requiresVerification: true,
        },
        {
          name: 'Visits',
          href: '/provider/visits',
          icon: Eye,
          requiresVerification: true,
        },
        {
          name: 'Messages',
          href: '/provider/messages',
          icon: MessageCircle,
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
        {
          name: 'Analytics',
          href: '/provider/analytics',
          icon: BarChart3,
          requiresVerification: true,
        },
        { name: 'Verification', href: '/provider/verification', icon: Shield },
        { name: 'Profile', href: '/profile', icon: User },
        {
          name: 'Payments',
          href: '/provider/payments',
          icon: CreditCard,
          requiresVerification: true,
        },
      ];
    }

    if (user.role === 'admin') {
      return [
        { name: 'Dashboard', href: '/admin', icon: Home },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Listings', href: '/admin/listings', icon: Building },
        { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
        { name: 'Visits', href: '/admin/visits', icon: Eye },
        {
          name: 'Messages',
          href: '/admin/messages',
          icon: MessageCircle,
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Reports', href: '/admin/reports', icon: FileText },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
      ];
    }

    return commonItems;
  };

  const navItems = getNavItems();

  const handleNavClick = (href: string, requiresVerification?: boolean) => {
    if (
      requiresVerification &&
      user.role === 'provider' &&
      user.verificationStatus !== 'approved'
    ) {
      router.push('/provider/verification');
      return;
    }
    router.push(href);
    onClose(); // Close mobile sidebar
  };

  const isActive = (href: string) => {
    // Exact match first
    if (pathname === href) {
      return true;
    }

    // Exact match for root paths - no children should match
    if (href === '/dashboard' || href === '/admin' || href === '/search') {
      return pathname === href;
    }

    // Special handling for provider listings to avoid conflicts
    if (href === '/provider/listings' && pathname?.startsWith('/provider/listings/')) {
      return false; // Don't highlight "My Listings" when on sub-pages like /provider/listings/new
    }

    // For other nested paths, check if pathname starts with href but ensure exact segment matching
    if (pathname?.startsWith(href + '/')) {
      const pathSegments = pathname.split('/');
      const hrefSegments = href.split('/');

      // If href has more segments than current path, it can't be active
      if (hrefSegments.length > pathSegments.length) {
        return false;
      }

      // Check if all href segments match the beginning of path segments
      for (let i = 0; i < hrefSegments.length; i++) {
        if (hrefSegments[i] !== pathSegments[i]) {
          return false;
        }
      }

      return true;
    }

    return false;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 z-30 ${
          isOpen ? 'w-64' : 'w-16'
        } hidden lg:block`}
      >
        {/* Toggle Button */}
        <div className='absolute -right-3 top-6 z-40'>
          <Button
            variant='outline'
            size='sm'
            onClick={onToggle}
            className='h-6 w-6 rounded-full p-0 bg-white border-gray-300 shadow-sm'
          >
            {isOpen ? <ChevronLeft className='h-3 w-3' /> : <ChevronRight className='h-3 w-3' />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className='p-4 space-y-2'>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const disabled =
              item.requiresVerification &&
              user.role === 'provider' &&
              user.verificationStatus !== 'approved';

            return (
              <Button
                key={item.name}
                variant={active ? 'default' : 'ghost'}
                className={`w-full justify-start relative ${
                  isOpen ? 'px-3' : 'px-2'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => handleNavClick(item.href, item.requiresVerification)}
                disabled={disabled}
                title={!isOpen ? item.name : undefined}
              >
                <Icon className={`h-5 w-5 ${isOpen ? 'mr-3' : ''}`} />
                {isOpen && (
                  <>
                    <span className='truncate'>{item.name}</span>
                    {item.badge && (
                      <span className='ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center'>
                        {item.badge}
                      </span>
                    )}
                    {disabled && <Shield className='ml-auto h-4 w-4 text-yellow-500' />}
                  </>
                )}
              </Button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        {isOpen && (
          <div className='absolute bottom-4 left-4 right-4 space-y-2'>
            <Button
              variant='ghost'
              className='w-full justify-start'
              onClick={() => router.push('/help')}
            >
              <HelpCircle className='h-5 w-5 mr-3' />
              Help & Support
            </Button>

            {/* User Status */}
            <div className='p-3 bg-gray-50 rounded-lg'>
              <div className='flex items-center space-x-2'>
                <div
                  className={`w-2 h-2 rounded-full ${
                    user.isVerified ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                />
                <span className='text-xs text-gray-600 capitalize'>
                  {user.role} {user.isVerified ? '(Verified)' : '(Pending)'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-transform duration-300 z-50 w-64 lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation */}
        <nav className='p-4 space-y-2'>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const disabled =
              item.requiresVerification &&
              user.role === 'provider' &&
              user.verificationStatus !== 'approved';

            return (
              <Button
                key={item.name}
                variant={active ? 'default' : 'ghost'}
                className={`w-full justify-start relative ${
                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => handleNavClick(item.href, item.requiresVerification)}
                disabled={disabled}
              >
                <Icon className='h-5 w-5 mr-3' />
                <span className='truncate'>{item.name}</span>
                {item.badge && (
                  <span className='ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center'>
                    {item.badge}
                  </span>
                )}
                {disabled && <Shield className='ml-auto h-4 w-4 text-yellow-500' />}
              </Button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className='absolute bottom-4 left-4 right-4 space-y-2'>
          <Button
            variant='ghost'
            className='w-full justify-start'
            onClick={() => router.push('/help')}
          >
            <HelpCircle className='h-5 w-5 mr-3' />
            Help & Support
          </Button>

          {/* User Status */}
          <div className='p-3 bg-gray-50 rounded-lg'>
            <div className='flex items-center space-x-2'>
              <div
                className={`w-2 h-2 rounded-full ${
                  user.isVerified ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              />
              <span className='text-xs text-gray-600 capitalize'>
                {user.role} {user.isVerified ? '(Verified)' : '(Pending)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
