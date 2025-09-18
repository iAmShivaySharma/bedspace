'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Download, Calendar, Receipt, AlertCircle, CheckCircle } from 'lucide-react';

interface Payment {
  id: string;
  bookingId: string;
  listing: {
    title: string;
    location: string;
  };
  provider: {
    name: string;
  };
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionId?: string;
  createdAt: string;
  completedAt?: string;
  description: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const statusIcons = {
  pending: AlertCircle,
  completed: CheckCircle,
  failed: AlertCircle,
  refunded: Receipt,
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payments', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async (paymentId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/payments/${paymentId}/receipt`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${paymentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  const filteredPayments = payments.filter(payment => 
    filter === 'all' || payment.status === filter
  );

  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <DashboardLayout title="Payments">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Payments">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
            <p className="text-gray-600">
              {filteredPayments.length} transaction{filteredPayments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{totalPaid.toLocaleString()}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {payments.filter(p => p.status === 'pending').length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{payments
                      .filter(p => {
                        const paymentDate = new Date(p.createdAt);
                        const now = new Date();
                        return paymentDate.getMonth() === now.getMonth() && 
                               paymentDate.getFullYear() === now.getFullYear() &&
                               p.status === 'completed';
                      })
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toLocaleString()}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {['all', 'completed', 'pending', 'failed', 'refunded'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Payments List */}
        {filteredPayments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === 'all' ? 'No payments yet' : `No ${filter} payments`}
              </h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'Your payment history will appear here once you make bookings.'
                  : `You don't have any ${filter} payments at the moment.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((payment) => {
              const StatusIcon = statusIcons[payment.status];
              return (
                <Card key={payment.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Payment Info */}
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <StatusIcon className={`h-6 w-6 ${
                            payment.status === 'completed' ? 'text-green-500' :
                            payment.status === 'pending' ? 'text-yellow-500' :
                            payment.status === 'failed' ? 'text-red-500' :
                            'text-gray-500'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {payment.listing.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">
                            {payment.listing.location}
                          </p>
                          <p className="text-sm text-gray-600">
                            Provider: {payment.provider.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {payment.description}
                          </p>
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div className="flex flex-col lg:items-end gap-2">
                        <Badge className={statusColors[payment.status]}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </Badge>
                        
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            ₹{payment.amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {payment.paymentMethod}
                          </p>
                        </div>
                        
                        <div className="flex items-center text-gray-600 text-sm">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        {payment.transactionId && (
                          <p className="text-xs text-gray-500">
                            ID: {payment.transactionId}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 lg:min-w-[120px]">
                        {payment.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadReceipt(payment.id)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Receipt
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.location.href = `/bookings/${payment.bookingId}`}
                        >
                          View Booking
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
