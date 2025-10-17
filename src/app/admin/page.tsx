'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageSkeleton } from '@/components/ui/page-skeleton';
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
  Phone,
  Mail,
  MapPin,
  Download,
  Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useGetAdminStatsQuery,
  useGetAdminProvidersQuery,
  useUpdateProviderVerificationMutation,
} from '@/lib/api/adminApi';
import { useGetRecentActivitiesQuery } from '@/lib/api/commonApi';
import type { Provider } from '@/types';

export default function AdminPage() {
  const [filter, setFilter] = useState('pending');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // RTK Query hooks
  const { data: statsData, isLoading: statsLoading } = useGetAdminStatsQuery();
  const {
    data: providersData,
    isLoading: providersLoading,
    refetch: refetchProviders,
  } = useGetAdminProvidersQuery({
    status: filter === 'all' ? undefined : filter,
  });
  const { data: activitiesData, isLoading: activitiesLoading } = useGetRecentActivitiesQuery({
    limit: 10,
  });
  const [updateProviderVerification] = useUpdateProviderVerificationMutation();

  const stats = statsData?.data || {
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
  };

  const providers = (providersData?.data || []) as Provider[];
  const activities = activitiesData?.data || [];
  const loading = statsLoading || providersLoading;

  const handleStatusUpdate = async (
    providerId: string,
    action: 'activate' | 'deactivate' | 'verify' | 'unverify'
  ) => {
    setActionLoading(action);
    try {
      // Map action to the correct status for provider verification
      const status =
        action === 'verify' ? 'approved' : action === 'unverify' ? 'rejected' : 'pending';

      const result = await updateProviderVerification({
        providerId,
        status,
        rejectionReason: action === 'unverify' ? 'Rejected by admin' : undefined,
      }).unwrap();

      if (result.success) {
        setMessage(
          `Provider ${action === 'verify' ? 'approved' : action === 'unverify' ? 'rejected' : action}d successfully!`
        );
        setError('');

        // Update selected provider status if modal is open
        if (selectedProvider && selectedProvider._id === providerId) {
          setSelectedProvider({
            ...selectedProvider,
            verificationStatus: status,
          });
        }

        // Refetch providers to update the list
        refetchProviders();

        // Auto-close modal after 2 seconds to show the updated status briefly
        setTimeout(() => {
          handleCloseModal();
        }, 2000);
      } else {
        setError(result.error || `Failed to ${action} provider`);
        setMessage('');
      }
    } catch (error: any) {
      const errorMessage =
        error?.data?.error || error?.message || 'Network error. Please try again.';
      setError(errorMessage);
      setMessage('');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowDetailsModal(true);
    // Clear any existing messages when opening modal
    setMessage('');
    setError('');
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedProvider(null);
    setMessage('');
    setError('');
    setActionLoading(null);
  };

  const handleFilterChange = (newFilter: string) => {
    if (newFilter !== filter) {
      setIsFilterLoading(true);
      setFilter(newFilter);
      setMessage('');
      setError('');
      // Reset loading after a brief delay to show the skeleton
      setTimeout(() => setIsFilterLoading(false), 300);
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
    return <PageSkeleton type='dashboard' />;
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
              onClick={() => handleFilterChange(status)}
              disabled={isFilterLoading || providersLoading}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                filter === status
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              } ${(isFilterLoading || providersLoading) && 'opacity-50 cursor-not-allowed'}`}
            >
              {isFilterLoading && filter === status && (
                <Loader2 className='w-4 h-4 mr-1 animate-spin' />
              )}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Providers List */}
      <div className='grid grid-cols-1 gap-6'>
        {isFilterLoading || providersLoading ? (
          // Skeleton loading cards
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className='p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-2'>
                      <Skeleton className='w-10 h-10 rounded-full' />
                      <div className='space-y-2'>
                        <Skeleton className='h-5 w-48' />
                        <Skeleton className='h-4 w-64' />
                      </div>
                    </div>
                  </div>
                  <Skeleton className='h-6 w-20 rounded-full' />
                </div>
                <div className='space-y-2 mb-4'>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-3/4' />
                  <Skeleton className='h-4 w-1/2' />
                </div>
                <div className='flex gap-2'>
                  <Skeleton className='h-8 w-20' />
                  <Skeleton className='h-8 w-20' />
                  <Skeleton className='h-8 w-24' />
                </div>
              </CardContent>
            </Card>
          ))
        ) : providers.length === 0 ? (
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
                        {provider.verificationDocuments.map((doc: any, index: number) => (
                          <Badge key={index} variant='outline' className='text-xs'>
                            {doc.type.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className='flex space-x-3 pt-4 border-t'>
                    {provider.verificationStatus === 'pending' && (
                      <>
                        <Button
                          size='sm'
                          onClick={() => handleStatusUpdate(provider._id, 'verify')}
                          className='bg-green-600 hover:bg-green-700'
                          disabled={actionLoading === 'verify'}
                        >
                          {actionLoading === 'verify' ? (
                            <>
                              <Loader2 className='w-4 h-4 mr-1 animate-spin' />
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className='w-4 h-4 mr-1' />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size='sm'
                          variant='destructive'
                          onClick={() => handleStatusUpdate(provider._id, 'unverify')}
                          disabled={actionLoading === 'unverify'}
                        >
                          {actionLoading === 'unverify' ? (
                            <>
                              <Loader2 className='w-4 h-4 mr-1 animate-spin' />
                              Rejecting...
                            </>
                          ) : (
                            <>
                              <XCircle className='w-4 h-4 mr-1' />
                              Reject
                            </>
                          )}
                        </Button>
                      </>
                    )}
                    <Button size='sm' variant='outline' onClick={() => handleViewDetails(provider)}>
                      <Eye className='w-4 h-4 mr-1' />
                      View Details
                    </Button>
                  </div>
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

      {/* Provider Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={open => !open && handleCloseModal()}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <User className='w-5 h-5' />
              Provider Verification Details
            </DialogTitle>
            <DialogDescription>
              Review provider information and verification documents
            </DialogDescription>
          </DialogHeader>

          {selectedProvider && (
            <div className='space-y-6'>
              {/* Success/Error Messages in Modal */}
              {message && (
                <div className='p-4 bg-green-100 border border-green-400 text-green-700 rounded-md'>
                  {message}
                </div>
              )}
              {error && (
                <div className='p-4 bg-red-100 border border-red-400 text-red-700 rounded-md'>
                  {error}
                </div>
              )}
              {/* Provider Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center justify-between'>
                    <span>Basic Information</span>
                    <Badge className={getStatusColor(selectedProvider.verificationStatus)}>
                      {selectedProvider.verificationStatus}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='flex items-center gap-2'>
                      <User className='w-4 h-4 text-gray-500' />
                      <div>
                        <p className='text-sm text-gray-600'>Full Name</p>
                        <p className='font-medium'>{selectedProvider.name}</p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Mail className='w-4 h-4 text-gray-500' />
                      <div>
                        <p className='text-sm text-gray-600'>Email</p>
                        <p className='font-medium'>{selectedProvider.email}</p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Phone className='w-4 h-4 text-gray-500' />
                      <div>
                        <p className='text-sm text-gray-600'>Phone</p>
                        <p className='font-medium'>{selectedProvider.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Calendar className='w-4 h-4 text-gray-500' />
                      <div>
                        <p className='text-sm text-gray-600'>Registration Date</p>
                        <p className='font-medium'>
                          {new Date(selectedProvider.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Information */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Building className='w-5 h-5' />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <p className='text-sm text-gray-600'>Business Name</p>
                      <p className='font-medium'>
                        {selectedProvider.businessName || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className='text-sm text-gray-600'>Business Phone</p>
                      <p className='font-medium'>
                        {selectedProvider.businessPhone || 'Not provided'}
                      </p>
                    </div>
                    <div className='md:col-span-2'>
                      <p className='text-sm text-gray-600'>Business Address</p>
                      <p className='font-medium'>
                        {selectedProvider.businessAddress || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Verification Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <FileText className='w-5 h-5' />
                    Verification Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedProvider.verificationDocuments.length === 0 ? (
                    <p className='text-gray-500 text-center py-4'>No documents uploaded</p>
                  ) : (
                    <div className='space-y-4'>
                      {selectedProvider.verificationDocuments.map((doc, index) => (
                        <div key={index} className='border rounded-lg p-4'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <FileText className='w-5 h-5 text-blue-500' />
                              <div>
                                <p className='font-medium'>
                                  {doc.type
                                    .replace('_', ' ')
                                    .replace(/\b\w/g, l => l.toUpperCase())}
                                </p>
                                <p className='text-sm text-gray-600'>
                                  Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                                <Badge
                                  className={`mt-1 ${getStatusColor(doc.status)}`}
                                  variant='outline'
                                >
                                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                </Badge>
                              </div>
                            </div>
                            <div className='flex gap-2'>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => window.open(doc.fileUrl, '_blank')}
                              >
                                <Eye className='w-4 h-4 mr-1' />
                                View
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = doc.fileUrl;
                                  link.download = doc.fileName;
                                  link.click();
                                }}
                              >
                                <Download className='w-4 h-4 mr-1' />
                                Download
                              </Button>
                            </div>
                          </div>
                          {doc.rejectionReason && (
                            <div className='mt-3 p-3 bg-red-50 border border-red-200 rounded'>
                              <p className='text-sm text-red-800'>
                                <strong>Rejection Reason:</strong> {doc.rejectionReason}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              {selectedProvider.verificationStatus === 'pending' && (
                <div className='flex justify-end gap-3 pt-4 border-t'>
                  <Button
                    variant='outline'
                    onClick={handleCloseModal}
                    disabled={actionLoading !== null}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant='destructive'
                    onClick={() => handleStatusUpdate(selectedProvider._id, 'unverify')}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === 'unverify' ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-1 animate-spin' />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className='w-4 h-4 mr-1' />
                        Reject
                      </>
                    )}
                  </Button>
                  <Button
                    className='bg-green-600 hover:bg-green-700'
                    onClick={() => handleStatusUpdate(selectedProvider._id, 'verify')}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === 'verify' ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-1 animate-spin' />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className='w-4 h-4 mr-1' />
                        Approve
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
