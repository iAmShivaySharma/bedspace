'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  Users,
  Home,
  Calendar,
  DollarSign,
  Activity,
  Filter,
} from 'lucide-react';

interface ReportData {
  userReports: {
    totalUsers: number;
    newUsersThisMonth: number;
    activeUsers: number;
    usersByRole: { role: string; count: number }[];
  };
  listingReports: {
    totalListings: number;
    activeListings: number;
    pendingApproval: number;
    averagePrice: number;
    listingsByLocation: { location: string; count: number }[];
  };
  bookingReports: {
    totalBookings: number;
    completedBookings: number;
    totalRevenue: number;
    averageBookingValue: number;
    bookingsByMonth: { month: string; count: number; revenue: number }[];
  };
  activityReports: {
    totalActivities: number;
    topActions: { action: string; count: number }[];
    dailyActivity: { date: string; count: number }[];
  };
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedReportType, setSelectedReportType] = useState('overview');

  useEffect(() => {
    fetchReportData();
  }, [selectedTimeRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/reports?timeRange=${selectedTimeRange}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setReportData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'csv') => {
    try {
      const response = await fetch(
        `/api/admin/reports/export?format=${format}&timeRange=${selectedTimeRange}&type=${selectedReportType}`,
        {
          credentials: 'include',
        }
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bedspace-report-${selectedTimeRange}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <DashboardLayout title='Reports & Analytics'>
      <div className='p-6 space-y-6'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Reports & Analytics</h1>
            <p className='text-gray-600 mt-1'>Comprehensive platform insights and data exports</p>
          </div>

          <div className='flex flex-col sm:flex-row gap-3'>
            <div className='flex gap-2'>
              <Button
                variant={selectedTimeRange === '7d' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setSelectedTimeRange('7d')}
              >
                7 Days
              </Button>
              <Button
                variant={selectedTimeRange === '30d' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setSelectedTimeRange('30d')}
              >
                30 Days
              </Button>
              <Button
                variant={selectedTimeRange === '90d' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setSelectedTimeRange('90d')}
              >
                90 Days
              </Button>
            </div>

            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => exportReport('csv')}
                className='flex items-center gap-2'
              >
                <Download className='h-4 w-4' />
                Export CSV
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => exportReport('pdf')}
                className='flex items-center gap-2'
              >
                <FileText className='h-4 w-4' />
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className='flex gap-2 flex-wrap'>
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'listings', label: 'Listings', icon: Home },
            { id: 'bookings', label: 'Bookings', icon: Calendar },
            { id: 'revenue', label: 'Revenue', icon: DollarSign },
            { id: 'activity', label: 'Activity', icon: Activity },
          ].map(type => {
            const Icon = type.icon;
            return (
              <Button
                key={type.id}
                variant={selectedReportType === type.id ? 'default' : 'outline'}
                size='sm'
                onClick={() => setSelectedReportType(type.id)}
                className='flex items-center gap-2'
              >
                <Icon className='h-4 w-4' />
                {type.label}
              </Button>
            );
          })}
        </div>

        {reportData && (
          <>
            {/* Overview Cards */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Total Users</CardTitle>
                  <Users className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {reportData.userReports.totalUsers.toLocaleString()}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    +{reportData.userReports.newUsersThisMonth} this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Active Listings</CardTitle>
                  <Home className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {reportData.listingReports.activeListings.toLocaleString()}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {reportData.listingReports.pendingApproval} pending approval
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Total Bookings</CardTitle>
                  <Calendar className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {reportData.bookingReports.totalBookings.toLocaleString()}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {reportData.bookingReports.completedBookings} completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
                  <DollarSign className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    ₹{reportData.bookingReports.totalRevenue.toLocaleString()}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Avg: ₹{reportData.bookingReports.averageBookingValue.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Reports */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* User Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Users className='h-5 w-5' />
                    User Distribution
                  </CardTitle>
                  <CardDescription>Users by role and status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {reportData.userReports.usersByRole.map((item, index) => (
                      <div key={index} className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <Badge variant='outline' className='capitalize'>
                            {item.role}
                          </Badge>
                        </div>
                        <div className='text-sm font-medium'>{item.count.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Locations */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Home className='h-5 w-5' />
                    Popular Locations
                  </CardTitle>
                  <CardDescription>Listings by location</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {reportData.listingReports.listingsByLocation.slice(0, 5).map((item, index) => (
                      <div key={index} className='flex items-center justify-between'>
                        <div className='text-sm'>{item.location}</div>
                        <div className='text-sm font-medium'>{item.count} listings</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Revenue */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <TrendingUp className='h-5 w-5' />
                    Monthly Performance
                  </CardTitle>
                  <CardDescription>Bookings and revenue by month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {reportData.bookingReports.bookingsByMonth.slice(0, 6).map((item, index) => (
                      <div key={index} className='flex items-center justify-between'>
                        <div className='text-sm'>{item.month}</div>
                        <div className='text-right'>
                          <div className='text-sm font-medium'>{item.count} bookings</div>
                          <div className='text-xs text-muted-foreground'>
                            ₹{item.revenue.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Activity Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Activity className='h-5 w-5' />
                    User Activity
                  </CardTitle>
                  <CardDescription>Most common user actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {reportData.activityReports.topActions.slice(0, 5).map((item, index) => (
                      <div key={index} className='flex items-center justify-between'>
                        <div className='text-sm capitalize'>{item.action.replace('_', ' ')}</div>
                        <div className='text-sm font-medium'>{item.count.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
