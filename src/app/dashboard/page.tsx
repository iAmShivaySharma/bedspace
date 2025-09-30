'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Search,
  MessageCircle,
  Calendar,
  Heart,
  Plus,
  Building,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  return (
    <DashboardLayout title='Dashboard'>
      {/* Stats Overview */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Searches</CardTitle>
            <Search className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>24</div>
            <p className='text-xs text-muted-foreground'>+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Favorites</CardTitle>
            <Heart className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>8</div>
            <p className='text-xs text-muted-foreground'>+3 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Messages</CardTitle>
            <MessageCircle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>12</div>
            <p className='text-xs text-muted-foreground'>3 unread</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Bookings</CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>2</div>
            <p className='text-xs text-muted-foreground'>1 pending approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with these common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-4'>
              <Button
                variant='outline'
                className='h-20 flex flex-col items-center space-y-2'
                onClick={() => router.push('/search')}
              >
                <Search className='w-6 h-6' />
                <span>Search Spaces</span>
              </Button>

              <Button
                variant='outline'
                className='h-20 flex flex-col items-center space-y-2'
                onClick={() => router.push('/messages')}
              >
                <MessageCircle className='w-6 h-6' />
                <span>Messages</span>
              </Button>

              <Button
                variant='outline'
                className='h-20 flex flex-col items-center space-y-2'
                onClick={() => router.push('/favorites')}
              >
                <Heart className='w-6 h-6' />
                <span>Favorites</span>
              </Button>

              <Button
                variant='outline'
                className='h-20 flex flex-col items-center space-y-2'
                onClick={() => router.push('/bookings')}
              >
                <Calendar className='w-6 h-6' />
                <span>My Bookings</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex items-center space-x-3'>
                <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>Searched for &quot;Downtown bed space&quot;</p>
                  <p className='text-xs text-muted-foreground'>2 hours ago</p>
                </div>
              </div>

              <div className='flex items-center space-x-3'>
                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>Added listing to favorites</p>
                  <p className='text-xs text-muted-foreground'>1 day ago</p>
                </div>
              </div>

              <div className='flex items-center space-x-3'>
                <div className='w-2 h-2 bg-yellow-500 rounded-full'></div>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>Received message from provider</p>
                  <p className='text-xs text-muted-foreground'>2 days ago</p>
                </div>
              </div>

              <div className='flex items-center space-x-3'>
                <div className='w-2 h-2 bg-purple-500 rounded-full'></div>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>Booking request submitted</p>
                  <p className='text-xs text-muted-foreground'>3 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Listings */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended for You</CardTitle>
          <CardDescription>Based on your search history and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {/* Sample listings */}
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className='border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer'
              >
                <div className='aspect-video bg-gray-200 rounded-md mb-3 flex items-center justify-center'>
                  <Building className='w-8 h-8 text-gray-400' />
                </div>
                <h3 className='font-semibold mb-1'>Cozy Bed Space in Downtown</h3>
                <p className='text-sm text-muted-foreground mb-2'>
                  Shared room • 2 beds • WiFi • AC
                </p>
                <div className='flex items-center justify-between'>
                  <span className='font-bold text-lg'>₹8,000/month</span>
                  <Button size='sm' variant='outline'>
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
