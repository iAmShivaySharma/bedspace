'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  User,
  Users,
  Building,
  Calendar,
} from 'lucide-react';

interface Provider {
  _id: string;
  name: string;
  email: string;
  businessName?: string;
  verificationStatus: string;
  verificationDocuments: any[];
  createdAt: string;
}

export default function AdminPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    totalSeekers: 0,
    pendingProviders: 0,
    approvedProviders: 0,
    rejectedProviders: 0,
    totalListings: 0,
    activeListings: 0,
    totalBookings: 0,
    revenue: 0,
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch admin stats
        const statsResponse = await fetch('/api/admin/stats', {
          credentials: 'include',
        });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.data);
        }

        // Fetch providers
        const response = await fetch(`/api/admin/providers?status=${filter}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          setProviders(result.data);
        } else if (response.status === 403) {
          setError('Admin access required');
        } else {
          const result = await response.json();
          setError(result.error || 'Failed to fetch providers');
        }

        // Fetch recent activities
        const activitiesResponse = await fetch('/api/activities/recent?limit=10', {
          credentials: 'include',
        });

        if (activitiesResponse.ok) {
          const activitiesResult = await activitiesResponse.json();
          setActivities(activitiesResult.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter]);

  const handleStatusUpdate = async (
    providerId: string,
    status: string,
    rejectionReason?: string
  ) => {
    try {
      const response = await fetch('/api/admin/providers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          providerId,
          status,
          rejectionReason,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`Provider ${status} successfully!`);
        setError('');
        // Remove provider from current list if status changed
        setProviders(prev => prev.filter(p => p._id !== providerId));
      } else {
        setError(result.error || `Failed to ${status} provider`);
        setMessage('');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      setMessage('');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className='w-4 h-4 text-green-500' />;
      case 'rejected':
        return <XCircle className='w-4 h-4 text-red-500' />;
      case 'pending':
      default:
        return <Clock className='w-4 h-4 text-yellow-500' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout title='Admin Dashboard'>
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-600'>Loading providers...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title='Admin Dashboard'>
      {/* Stats Overview */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Total Users</p>
                <p className='text-3xl font-bold text-gray-900'>{stats.totalUsers}</p>
              </div>
              <div className='p-3 bg-blue-100 rounded-full'>
                <Users className='w-6 h-6 text-blue-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Providers</p>
                <p className='text-3xl font-bold text-gray-900'>{stats.totalProviders}</p>
                <p className='text-xs text-green-600'>+{stats.pendingProviders} pending</p>
              </div>
              <div className='p-3 bg-green-100 rounded-full'>
                <Building className='w-6 h-6 text-green-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Active Listings</p>
                <p className='text-3xl font-bold text-gray-900'>{stats.activeListings}</p>
                <p className='text-xs text-gray-500'>of {stats.totalListings} total</p>
              </div>
              <div className='p-3 bg-purple-100 rounded-full'>
                <FileText className='w-6 h-6 text-purple-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Total Bookings</p>
                <p className='text-3xl font-bold text-gray-900'>{stats.totalBookings}</p>
                <p className='text-xs text-blue-600'>₹{stats.revenue.toLocaleString()} revenue</p>
              </div>
              <div className='p-3 bg-yellow-100 rounded-full'>
                <Calendar className='w-6 h-6 text-yellow-600' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Verification Section */}
      <div className='mb-6'>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>Provider Verification</h2>
        <p className='text-gray-600'>Review and approve provider applications</p>
      </div>

      {/* Messages */}
      {message && (
        <div className='mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md'>
          {message}
        </div>
      )}

      {error && (
        <div className='mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md'>
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className='mb-6'>
        <div className='flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit'>
          {['pending', 'approved', 'rejected', 'all'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Providers List */}
      <div className='grid grid-cols-1 gap-6'>
        {providers.length === 0 ? (
          <Card>
            <CardContent className='text-center py-12'>
              <p className='text-gray-500'>No providers found for the selected filter.</p>
            </CardContent>
          </Card>
        ) : (
          providers.map(provider => (
            <Card key={provider._id}>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle className='flex items-center space-x-2'>
                      <span>{provider.name}</span>
                      {getStatusIcon(provider.verificationStatus)}
                    </CardTitle>
                    <CardDescription>
                      {provider.email} • {provider.businessName || 'No business name'}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(provider.verificationStatus)}>
                    {provider.verificationStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <p className='text-sm text-gray-600'>
                        <strong>Applied:</strong>{' '}
                        {new Date(provider.createdAt).toLocaleDateString()}
                      </p>
                      <p className='text-sm text-gray-600'>
                        <strong>Documents:</strong> {provider.verificationDocuments.length} uploaded
                      </p>
                    </div>
                    <div>
                      <p className='text-sm text-gray-600'>
                        <strong>Business:</strong> {provider.businessName || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  {/* Documents */}
                  {provider.verificationDocuments.length > 0 && (
                    <div>
                      <h4 className='font-medium mb-2'>Uploaded Documents:</h4>
                      <div className='flex flex-wrap gap-2'>
                        {provider.verificationDocuments.map((doc, index) => (
                          <Badge key={index} variant='outline' className='text-xs'>
                            {doc.type.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {provider.verificationStatus === 'pending' && (
                    <div className='flex space-x-3 pt-4 border-t'>
                      <Button
                        size='sm'
                        onClick={() => handleStatusUpdate(provider._id, 'approved')}
                        className='bg-green-600 hover:bg-green-700'
                      >
                        <CheckCircle className='w-4 h-4 mr-1' />
                        Approve
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={() => {
                          const reason = prompt('Please provide a rejection reason:');
                          if (reason) {
                            handleStatusUpdate(provider._id, 'rejected', reason);
                          }
                        }}
                      >
                        <XCircle className='w-4 h-4 mr-1' />
                        Reject
                      </Button>
                      <Button size='sm' variant='outline'>
                        <Eye className='w-4 h-4 mr-1' />
                        View Details
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Recent Activities */}
      <div className='mt-8'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Clock className='h-5 w-5' />
              Recent Activities
            </CardTitle>
            <CardDescription>Latest user activities and system events</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className='text-gray-500 text-center py-4'>No recent activities</p>
            ) : (
              <div className='space-y-4'>
                {activities.map((activity, index) => (
                  <div key={index} className='flex items-start gap-3 p-3 bg-gray-50 rounded-lg'>
                    <div className='flex-shrink-0'>
                      {activity.action === 'login' && <User className='h-4 w-4 text-green-500' />}
                      {activity.action === 'logout' && <User className='h-4 w-4 text-gray-500' />}
                      {activity.action === 'register' && (
                        <Users className='h-4 w-4 text-blue-500' />
                      )}
                      {activity.action === 'listing_create' && (
                        <Building className='h-4 w-4 text-purple-500' />
                      )}
                      {activity.action === 'booking_create' && (
                        <Calendar className='h-4 w-4 text-orange-500' />
                      )}
                      {![
                        'login',
                        'logout',
                        'register',
                        'listing_create',
                        'booking_create',
                      ].includes(activity.action) && <FileText className='h-4 w-4 text-gray-500' />}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900'>{activity.description}</p>
                      <div className='flex items-center gap-2 mt-1'>
                        {activity.user && (
                          <span className='text-xs text-gray-500'>
                            by {activity.user.name} ({activity.user.role})
                          </span>
                        )}
                        <span className='text-xs text-gray-400'>•</span>
                        <span className='text-xs text-gray-500'>{activity.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
