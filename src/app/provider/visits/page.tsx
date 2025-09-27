'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useDateTime } from '@/contexts/LocalizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  FileText,
  Filter,
} from 'lucide-react';
import { useGetVisitsQuery } from '@/lib/api/commonApi';

interface Visit {
  id: string;
  listingTitle: string;
  listingAddress: string;
  seekerName: string;
  seekerEmail: string;
  seekerPhone: string;
  scheduledDate: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  seekerNotes?: string;
  providerNotes?: string;
  createdAt: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
};

export default function ProviderVisitsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const { formatDate } = useDateTime();

  const {
    data: visitsData,
    isLoading,
    error,
  } = useGetVisitsQuery({
    page,
    limit: 20,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const visits = visitsData?.data || [];
  const pagination = visitsData?.pagination;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className='w-4 h-4 text-blue-600' />;
      case 'cancelled':
        return <XCircle className='w-4 h-4 text-red-600' />;
      case 'completed':
        return <CheckCircle className='w-4 h-4 text-green-600' />;
      default:
        return <Clock className='w-4 h-4 text-yellow-600' />;
    }
  };

  const formatDateLong = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleStatusUpdate = async (visitId: string, newStatus: 'confirmed' | 'cancelled') => {
    try {
      // TODO: Implement status update API call
      console.log('Updating visit', visitId, 'to', newStatus);
    } catch (error) {
      console.error('Error updating visit status:', error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className='text-center py-12'>
          <div className='text-red-600 mb-4'>Failed to load visits</div>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Property Visits</h1>
            <p className='text-gray-600 mt-1'>Manage visit requests from potential tenants</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center'>
                <Clock className='h-8 w-8 text-yellow-600' />
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-600'>Pending</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {visits.filter((v: Visit) => v.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center'>
                <CheckCircle className='h-8 w-8 text-blue-600' />
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-600'>Confirmed</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {visits.filter((v: Visit) => v.status === 'confirmed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center'>
                <CheckCircle className='h-8 w-8 text-green-600' />
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-600'>Completed</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {visits.filter((v: Visit) => v.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center'>
                <Calendar className='h-8 w-8 text-gray-600' />
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-600'>Total</p>
                  <p className='text-2xl font-bold text-gray-900'>{visits.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center space-x-4'>
              <Filter className='h-5 w-5 text-gray-400' />
              <div className='flex space-x-2'>
                {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setStatusFilter(status)}
                    className='capitalize'
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visits List */}
        <div className='space-y-4'>
          {visits.length === 0 ? (
            <Card>
              <CardContent className='p-12 text-center'>
                <Calendar className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>No visits found</h3>
                <p className='text-gray-600'>
                  {statusFilter === 'all'
                    ? "You don't have any visit requests yet."
                    : `No ${statusFilter} visits found.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            visits.map((visit: Visit) => (
              <Card key={visit.id} className='hover:shadow-md transition-shadow'>
                <CardContent className='p-6'>
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex items-start space-x-4'>
                      {getStatusIcon(visit.status)}
                      <div>
                        <h3 className='text-lg font-semibold text-gray-900 mb-1'>
                          {visit.listingTitle}
                        </h3>
                        <div className='flex items-center text-gray-600 mb-2'>
                          <MapPin className='h-4 w-4 mr-1' />
                          <span className='text-sm'>{visit.listingAddress}</span>
                        </div>
                        <Badge className={statusColors[visit.status as keyof typeof statusColors]}>
                          {visit.status}
                        </Badge>
                      </div>
                    </div>

                    <div className='text-right'>
                      <div className='text-sm text-gray-600 mb-1'>
                        {formatDateLong(visit.scheduledDate)}
                      </div>
                      <div className='text-sm font-medium text-gray-900'>{visit.timeSlot}</div>
                    </div>
                  </div>

                  {/* Seeker Info */}
                  <div className='bg-gray-50 rounded-lg p-4 mb-4'>
                    <h4 className='font-medium text-gray-900 mb-2 flex items-center'>
                      <User className='h-4 w-4 mr-1' />
                      Visitor Information
                    </h4>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                      <div>
                        <span className='font-medium'>Name:</span> {visit.seekerName}
                      </div>
                      <div className='flex items-center'>
                        <Mail className='h-4 w-4 mr-1' />
                        {visit.seekerEmail}
                      </div>
                      <div className='flex items-center'>
                        <Phone className='h-4 w-4 mr-1' />
                        {visit.seekerPhone}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {(visit.notes || visit.seekerNotes) && (
                    <div className='border-t pt-4 mb-4'>
                      {visit.notes && (
                        <div className='mb-2'>
                          <span className='text-sm font-medium text-gray-700'>
                            Initial Request:
                          </span>
                          <p className='text-sm text-gray-600 mt-1'>{visit.notes}</p>
                        </div>
                      )}
                      {visit.seekerNotes && (
                        <div>
                          <span className='text-sm font-medium text-gray-700'>
                            Additional Notes:
                          </span>
                          <p className='text-sm text-gray-600 mt-1'>{visit.seekerNotes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {visit.status === 'pending' && (
                    <div className='flex space-x-3 pt-4 border-t'>
                      <Button
                        size='sm'
                        onClick={() => handleStatusUpdate(visit.id, 'confirmed')}
                        className='bg-blue-600 hover:bg-blue-700'
                      >
                        <CheckCircle className='h-4 w-4 mr-1' />
                        Confirm Visit
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleStatusUpdate(visit.id, 'cancelled')}
                        className='text-red-600 border-red-600 hover:bg-red-50'
                      >
                        <XCircle className='h-4 w-4 mr-1' />
                        Decline
                      </Button>
                      <Button size='sm' variant='outline'>
                        <FileText className='h-4 w-4 mr-1' />
                        Add Notes
                      </Button>
                    </div>
                  )}

                  {visit.status === 'confirmed' && (
                    <div className='flex space-x-3 pt-4 border-t'>
                      <Button
                        size='sm'
                        onClick={() => handleStatusUpdate(visit.id, 'cancelled')}
                        variant='outline'
                      >
                        Cancel Visit
                      </Button>
                      <Button size='sm' variant='outline'>
                        <FileText className='h-4 w-4 mr-1' />
                        Add Notes
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className='flex justify-center space-x-2'>
            <Button variant='outline' disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <span className='flex items-center px-4 text-sm text-gray-600'>
              Page {page} of {pagination.pages}
            </span>
            <Button
              variant='outline'
              disabled={page === pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
