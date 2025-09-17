'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building, 
  Calendar, 
  DollarSign,
  Eye,
  Heart,
  MessageCircle,
  Star
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    revenueGrowth: number;
    totalBookings: number;
    bookingsGrowth: number;
    activeUsers: number;
    userGrowth: number;
    averageRating: number;
    ratingChange: number;
  };
  userMetrics: {
    newUsers: number;
    activeUsers: number;
    retentionRate: number;
    conversionRate: number;
  };
  listingMetrics: {
    totalListings: number;
    activeListings: number;
    averagePrice: number;
    occupancyRate: number;
  };
  bookingMetrics: {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    averageBookingValue: number;
  };
  topPerformers: {
    topProviders: Array<{
      name: string;
      bookings: number;
      revenue: number;
      rating: number;
    }>;
    topListings: Array<{
      title: string;
      location: string;
      bookings: number;
      revenue: number;
    }>;
  };
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`/api/admin/analytics?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setAnalytics(result.data);
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <DashboardLayout title="Analytics">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !analytics) {
    return (
      <DashboardLayout title="Analytics">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || 'Failed to load analytics'}</p>
          <Button onClick={fetchAnalytics}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Analytics">
      {/* Time Range Selector */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Analytics</h2>
          <p className="text-gray-600">Track key metrics and performance indicators</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(analytics.overview.totalRevenue)}
                </p>
                <div className={`flex items-center mt-2 ${getGrowthColor(analytics.overview.revenueGrowth)}`}>
                  {getGrowthIcon(analytics.overview.revenueGrowth)}
                  <span className="text-sm ml-1">
                    {formatPercentage(analytics.overview.revenueGrowth)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.overview.totalBookings}</p>
                <div className={`flex items-center mt-2 ${getGrowthColor(analytics.overview.bookingsGrowth)}`}>
                  {getGrowthIcon(analytics.overview.bookingsGrowth)}
                  <span className="text-sm ml-1">
                    {formatPercentage(analytics.overview.bookingsGrowth)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.overview.activeUsers}</p>
                <div className={`flex items-center mt-2 ${getGrowthColor(analytics.overview.userGrowth)}`}>
                  {getGrowthIcon(analytics.overview.userGrowth)}
                  <span className="text-sm ml-1">
                    {formatPercentage(analytics.overview.userGrowth)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.overview.averageRating.toFixed(1)}</p>
                <div className={`flex items-center mt-2 ${getGrowthColor(analytics.overview.ratingChange)}`}>
                  {getGrowthIcon(analytics.overview.ratingChange)}
                  <span className="text-sm ml-1">
                    {formatPercentage(analytics.overview.ratingChange)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* User Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              User Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">New Users</span>
              <span className="font-semibold">{analytics.userMetrics.newUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Users</span>
              <span className="font-semibold">{analytics.userMetrics.activeUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Retention Rate</span>
              <span className="font-semibold">{analytics.userMetrics.retentionRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Conversion Rate</span>
              <span className="font-semibold">{analytics.userMetrics.conversionRate}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Listing Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Listing Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Listings</span>
              <span className="font-semibold">{analytics.listingMetrics.totalListings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Listings</span>
              <span className="font-semibold">{analytics.listingMetrics.activeListings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average Price</span>
              <span className="font-semibold">{formatCurrency(analytics.listingMetrics.averagePrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Occupancy Rate</span>
              <span className="font-semibold">{analytics.listingMetrics.occupancyRate}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Booking Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Booking Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Bookings</span>
              <span className="font-semibold">{analytics.bookingMetrics.totalBookings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed</span>
              <span className="font-semibold">{analytics.bookingMetrics.completedBookings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cancelled</span>
              <span className="font-semibold">{analytics.bookingMetrics.cancelledBookings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg. Value</span>
              <span className="font-semibold">{formatCurrency(analytics.bookingMetrics.averageBookingValue)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Providers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Providers</CardTitle>
            <CardDescription>Highest performing providers by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topPerformers.topProviders.map((provider, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{provider.name}</p>
                    <p className="text-sm text-gray-500">{provider.bookings} bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(provider.revenue)}</p>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-sm">{provider.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Listings */}
        <Card>
          <CardHeader>
            <CardTitle>Top Listings</CardTitle>
            <CardDescription>Most booked listings by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topPerformers.topListings.map((listing, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{listing.title}</p>
                    <p className="text-sm text-gray-500">{listing.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(listing.revenue)}</p>
                    <p className="text-sm text-gray-500">{listing.bookings} bookings</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
