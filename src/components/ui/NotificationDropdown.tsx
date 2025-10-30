'use client';

import React, { useState } from 'react';
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
import { Bell, Eye, Clock, User, Home, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useGetNotificationsQuery, useMarkNotificationAsReadMutation } from '@/lib/api/commonApi';

interface Notification {
  _id: string;
  userId: string;
  type:
    | 'booking_request'
    | 'booking_response'
    | 'message'
    | 'listing_approved'
    | 'verification_status';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

interface NotificationDropdownProps {
  notificationCount: number;
}

export default function NotificationDropdown({ notificationCount }: NotificationDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // RTK Query hooks
  const {
    data: notificationsData,
    isLoading,
    refetch,
  } = useGetNotificationsQuery(
    { limit: 5, page: 1 },
    { skip: !isOpen } // Only fetch when dropdown is open
  );
  const [markAsRead] = useMarkNotificationAsReadMutation();

  const notifications = notificationsData?.data || [];

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    // RTK Query will automatically start the query when skip becomes false
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_request':
      case 'booking_response':
        return <Home className='w-4 h-4 text-blue-500' />;
      case 'message':
        return <MessageSquare className='w-4 h-4 text-green-500' />;
      case 'listing_approved':
        return <Home className='w-4 h-4 text-purple-500' />;
      case 'verification_status':
        return <User className='w-4 h-4 text-yellow-500' />;
      default:
        return <Bell className='w-4 h-4 text-gray-500' />;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id).unwrap();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'booking_request':
      case 'booking_response':
        router.push('/bookings');
        break;
      case 'message':
        router.push('/messages');
        break;
      case 'listing_approved':
        router.push('/listings');
        break;
      case 'verification_status':
        router.push('/profile');
        break;
      default:
        router.push('/notifications');
    }
    setIsOpen(false);
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='sm' className='relative'>
          <Bell className='h-5 w-5' />
          {notificationCount > 0 && (
            <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center'>
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-80' align='end' forceMount>
        <DropdownMenuLabel className='flex items-center justify-between'>
          <span className='font-semibold'>Notifications</span>
          {notificationCount > 0 && (
            <span className='text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full'>
              {notificationCount} new
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className='p-4 text-center'>
            <div className='flex items-center justify-center space-x-2 text-sm text-gray-500'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
              <span>Loading...</span>
            </div>
          </div>
        ) : notifications.length > 0 ? (
          <div className='max-h-96 overflow-y-auto'>
            {notifications.map(notification => (
              <DropdownMenuItem
                key={notification._id}
                className={`p-3 cursor-pointer border-l-4 ${
                  notification.isRead
                    ? 'border-l-transparent bg-white'
                    : 'border-l-blue-500 bg-blue-50/50'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className='flex items-start space-x-3 w-full'>
                  <div className='flex-shrink-0 mt-0.5'>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div
                      className={`text-sm ${notification.isRead ? 'font-normal' : 'font-semibold'}`}
                    >
                      {notification.title}
                    </div>
                    <div className='text-xs text-gray-600 line-clamp-2 mt-1'>
                      {notification.message}
                    </div>
                    <div className='flex items-center justify-between mt-2'>
                      <span className='text-xs text-gray-500'>
                        {formatTime(notification.createdAt)}
                      </span>
                      {!notification.isRead && (
                        <div className='w-2 h-2 bg-blue-500 rounded-full flex-shrink-0'></div>
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <div className='p-6 text-center'>
            <Bell className='w-8 h-8 text-gray-300 mx-auto mb-2' />
            <p className='text-sm text-gray-500 mb-1'>No notifications</p>
            <p className='text-xs text-gray-400'>You're all caught up!</p>
          </div>
        )}

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className='text-center text-blue-600 font-medium py-3'
              onClick={() => {
                router.push('/notifications');
                setIsOpen(false);
              }}
            >
              <Eye className='w-4 h-4 mr-2' />
              View All Notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
