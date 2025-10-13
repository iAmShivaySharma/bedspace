'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} from '@/lib/api/commonApi';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Calendar,
  User,
  Home,
  MessageCircle,
  Shield,
  DollarSign,
} from 'lucide-react';

// Using NotificationData from commonApi types
interface NotificationDisplay {
  _id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'booking' | 'message' | 'listing' | 'verification' | 'payment' | 'system';
  actionUrl?: string;
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // RTK Query hooks
  const {
    data: notificationsData,
    isLoading: loading,
    refetch,
  } = useGetNotificationsQuery({
    page: 1,
    limit: 50,
  });
  const [markAsReadMutation] = useMarkNotificationAsReadMutation();
  const [markAllAsReadMutation] = useMarkAllNotificationsAsReadMutation();

  const notifications = notificationsData?.data || [];

  // Removed fetchNotifications - handled by RTK Query

  const markAsRead = async (notificationId: string) => {
    try {
      await markAsReadMutation(notificationId).unwrap();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllAsReadMutation().unwrap();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    // Note: No delete mutation available in commonApi yet
    // This would need to be added to the RTK Query API
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        refetch(); // Refetch notifications after delete
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (category: string) => {
    switch (category) {
      case 'booking':
        return Calendar;
      case 'message':
        return MessageCircle;
      case 'listing':
        return Home;
      case 'verification':
        return Shield;
      case 'payment':
        return DollarSign;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'read' && !notif.isRead) return false;
    if (filter === 'unread' && notif.isRead) return false;
    if (categoryFilter !== 'all' && (notif as any).category !== categoryFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return <PageSkeleton type='list' />;
  }

  return (
    <DashboardLayout title='Notifications'>
      <div className='p-6 space-y-6'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-2'>
              <Bell className='h-8 w-8' />
              Notifications
            </h1>
            <p className='text-gray-600 mt-1'>
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>

          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} className='flex items-center gap-2'>
              <CheckCheck className='h-4 w-4' />
              Mark All Read
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className='flex flex-col sm:flex-row gap-4 mb-6'>
          <div className='flex gap-2'>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </Button>
            <Button
              variant={filter === 'read' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilter('read')}
            >
              Read ({notifications.length - unreadCount})
            </Button>
          </div>

          <div className='flex gap-2'>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className='px-3 py-1 border border-gray-300 rounded-md text-sm'
            >
              <option value='all'>All Categories</option>
              <option value='booking'>Bookings</option>
              <option value='message'>Messages</option>
              <option value='listing'>Listings</option>
              <option value='verification'>Verification</option>
              <option value='payment'>Payments</option>
              <option value='system'>System</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <div className='space-y-4'>
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className='flex flex-col items-center justify-center py-12'>
                <Bell className='h-12 w-12 text-gray-400 mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>No notifications</h3>
                <p className='text-gray-500 text-center'>
                  {filter === 'all'
                    ? "You don't have any notifications yet."
                    : `No ${filter} notifications found.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map(notification => {
              // For display, treat notification data as having category and type
              const notificationDisplay = notification as any;
              const Icon = getNotificationIcon(notificationDisplay.category || 'system');
              const colorClass = getNotificationColor(notificationDisplay.type || 'info');

              return (
                <Card
                  key={notification._id}
                  className={`transition-all hover:shadow-md ${
                    !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                  }`}
                >
                  <CardContent className='p-4'>
                    <div className='flex items-start gap-4'>
                      <div className={`p-2 rounded-full ${colorClass}`}>
                        <Icon className='h-5 w-5' />
                      </div>

                      <div className='flex-1 min-w-0'>
                        <div className='flex items-start justify-between gap-2'>
                          <div className='flex-1'>
                            <h3
                              className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}
                            >
                              {notification.title}
                            </h3>
                            <p className='text-gray-600 text-sm mt-1'>{notification.message}</p>
                            <div className='flex items-center gap-2 mt-2'>
                              <Badge variant='outline' className='text-xs capitalize'>
                                {notificationDisplay.category || 'general'}
                              </Badge>
                              <span className='text-xs text-gray-500'>
                                {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          <div className='flex items-center gap-1'>
                            {!notification.isRead && (
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => markAsRead(notification._id)}
                                className='h-8 w-8 p-0'
                              >
                                <Check className='h-4 w-4' />
                              </Button>
                            )}
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => deleteNotification(notification._id)}
                              className='h-8 w-8 p-0 text-red-500 hover:text-red-700'
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
