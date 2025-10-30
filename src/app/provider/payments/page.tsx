'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import VerificationRequired from '@/components/ui/verification-required';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetCurrentUserQuery } from '@/lib/api/authApi';
import {
  useGetPaymentDataQuery,
  useGetStripeAccountStatusQuery,
  useSetupStripeAccountMutation,
  useRequestPayoutMutation,
} from '@/lib/api/providerApi';
import { useGetAdminSettingsQuery } from '@/lib/api/adminApi';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  Download,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Provider } from '@/types';

export default function ProviderPaymentsPage() {
  const router = useRouter();
  const [filterType, setFilterType] = useState<string>('all');
  const [payoutAmount, setPayoutAmount] = useState<string>('');

  const { data: userResponse } = useGetCurrentUserQuery();
  const { data: stripeAccountResponse, isLoading: accountLoading } =
    useGetStripeAccountStatusQuery();
  const { data: paymentDataResponse, isLoading: paymentLoading } = useGetPaymentDataQuery({
    type: 'summary',
  });
  const { data: transactionsResponse } = useGetPaymentDataQuery({ type: 'transactions' });
  const { data: settingsResponse } = useGetAdminSettingsQuery();

  const [setupStripeAccount, { isLoading: settingUpAccount }] = useSetupStripeAccountMutation();
  const [requestPayout, { isLoading: requestingPayout }] = useRequestPayoutMutation();

  const user = userResponse?.data?.user as Provider;
  const stripeAccount = stripeAccountResponse?.data;
  const paymentData = paymentDataResponse?.data;
  const transactions = transactionsResponse?.data;
  const settings = settingsResponse?.data;
  const platformFee = settings?.booking?.bookingFee || 3;

  if (!user || user.role !== 'provider') {
    router.push('/dashboard');
    return null;
  }

  // Show verification required if not approved
  if (user.verificationStatus !== 'approved') {
    return (
      <DashboardLayout title='Payments & Earnings'>
        <VerificationRequired
          title='Provider Verification Required'
          description='You must be verified to access payment information and withdraw earnings.'
          verificationStatus={user.verificationStatus as any}
        />
      </DashboardLayout>
    );
  }

  const handleSetupStripe = async () => {
    try {
      console.log('Starting Stripe account setup...');
      const result = await setupStripeAccount().unwrap();
      console.log('Stripe setup result:', result);

      if (result.success && result.data?.onboardingUrl) {
        console.log('Opening Stripe onboarding URL:', result.data.onboardingUrl);
        window.open(result.data.onboardingUrl, '_blank');
      } else {
        console.error('No onboarding URL received:', result);
        alert('Failed to get Stripe onboarding URL. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to setup Stripe account:', error);
      const errorMessage = error?.data?.error || error?.message || 'Unknown error occurred';
      alert(`Failed to setup Stripe account: ${errorMessage}`);
    }
  };

  const handleRequestPayout = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      return;
    }

    try {
      await requestPayout({
        amount: parseFloat(payoutAmount),
        method: 'standard',
      }).unwrap();
      setPayoutAmount('');
    } catch (error) {
      console.error('Failed to request payout:', error);
    }
  };

  const getTransactionIcon = (type: string) => {
    return type === 'earning' || type === 'payment' ? (
      <ArrowUpCircle className='w-5 h-5 text-green-600' />
    ) : (
      <ArrowDownCircle className='w-5 h-5 text-red-600' />
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { variant: 'default', label: 'Completed' },
      succeeded: { variant: 'default', label: 'Completed' },
      pending: { variant: 'secondary', label: 'Pending' },
      processing: { variant: 'secondary', label: 'Processing' },
      failed: { variant: 'destructive', label: 'Failed' },
      canceled: { variant: 'outline', label: 'Canceled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: 'outline',
      label: status,
    };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  if (accountLoading || paymentLoading) {
    return <PageSkeleton type='payments' />;
  }

  // Show Stripe setup if no account
  if (!stripeAccount?.hasAccount) {
    return (
      <DashboardLayout title='Payments & Earnings'>
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <CreditCard className='w-5 h-5 mr-2' />
                Setup Payment Account
              </CardTitle>
              <CardDescription>
                Connect your Stripe account to receive payments from bookings
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                <h4 className='font-medium text-blue-900 mb-2'>Why Stripe?</h4>
                <ul className='text-sm text-blue-700 space-y-1'>
                  <li>• Secure payment processing</li>
                  <li>• Direct deposits to your bank account</li>
                  <li>• Real-time transaction tracking</li>
                  <li>• Industry-standard security</li>
                </ul>
              </div>
              <Button onClick={handleSetupStripe} disabled={settingUpAccount} size='lg'>
                {settingUpAccount ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 REMOVED_SPINNER' />
                    Setting up...
                  </>
                ) : (
                  <>
                    <ExternalLink className='w-4 h-4 mr-2' />
                    Setup Stripe Account
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Show account verification required
  if (!stripeAccount?.chargesEnabled) {
    return (
      <DashboardLayout title='Payments & Earnings'>
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <AlertTriangle className='w-5 h-5 mr-2 text-yellow-600' />
                Complete Account Verification
              </CardTitle>
              <CardDescription>
                Your Stripe account needs additional verification to accept payments
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                <h4 className='font-medium text-yellow-900 mb-2'>Verification Status</h4>
                <p className='text-sm text-yellow-700'>
                  Account Status: {stripeAccount?.accountStatus || 'Pending'}
                </p>
                {stripeAccount?.requirements?.currentlyDue?.length > 0 && (
                  <div className='mt-2'>
                    <p className='text-sm font-medium text-yellow-800'>Required Information:</p>
                    <ul className='text-sm text-yellow-700 mt-1'>
                      {stripeAccount.requirements.currentlyDue.map((req: string) => (
                        <li key={req}>
                          • {req.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <Button onClick={handleSetupStripe} size='lg'>
                <ExternalLink className='w-4 h-4 mr-2' />
                Complete Verification
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title='Payments & Earnings'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Payments & Earnings</h1>
            <p className='text-gray-600'>Track your earnings and payment history</p>
          </div>
          {paymentData?.balance?.available > 0 && (
            <div className='flex items-center space-x-2'>
              <Input
                type='number'
                placeholder='Amount'
                value={payoutAmount}
                onChange={e => setPayoutAmount(e.target.value)}
                className='w-32'
                min='1'
                max={paymentData?.balance?.available || 0}
              />
              <Button onClick={handleRequestPayout} disabled={requestingPayout || !payoutAmount}>
                {requestingPayout ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 REMOVED_SPINNER' />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className='w-4 h-4 mr-2' />
                    Request Payout
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Payment Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {/* Available Balance */}
          <Card className='hover:shadow-md transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Available Balance</CardTitle>
              <Wallet className='h-4 w-4 text-green-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-green-600'>
                ₹{(paymentData?.balance?.available || 0).toLocaleString()}
              </div>
              <p className='text-xs text-muted-foreground'>Ready for withdrawal</p>
              {(paymentData?.balance?.available || 0) > 0 && (
                <div className='mt-2'>
                  <Badge variant='outline' className='text-green-700 border-green-200'>
                    Withdraw Available
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Earnings */}
          <Card className='hover:shadow-md transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>This Month</CardTitle>
              <TrendingUp className='h-4 w-4 text-blue-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                ₹{(paymentData?.earnings?.thisMonth || 0).toLocaleString()}
              </div>
              <p className='text-xs text-muted-foreground'>Monthly earnings</p>
              <div className='mt-2 text-xs text-blue-600'>After {platformFee}% platform fee</div>
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card className='hover:shadow-md transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Pending</CardTitle>
              <Clock className='h-4 w-4 text-yellow-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-yellow-600'>
                ₹{(paymentData?.balance?.pending || 0).toLocaleString()}
              </div>
              <p className='text-xs text-muted-foreground'>Processing payments</p>
              {(paymentData?.balance?.pending || 0) > 0 && (
                <div className='mt-2 text-xs text-yellow-700'>Expected in 2-3 business days</div>
              )}
            </CardContent>
          </Card>

          {/* Total Earnings */}
          <Card className='hover:shadow-md transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Earnings</CardTitle>
              <DollarSign className='h-4 w-4 text-purple-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                ₹{(paymentData?.earnings?.total || 0).toLocaleString()}
              </div>
              <p className='text-xs text-muted-foreground'>All-time earnings</p>
              <div className='mt-2 text-xs text-purple-600'>
                Platform fee deducted: ₹
                {Math.round(
                  ((paymentData?.earnings?.total || 0) * platformFee) / (100 - platformFee)
                ).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings Breakdown</CardTitle>
            <CardDescription>Detailed view of your earnings and fees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='p-4 bg-green-50 rounded-lg border border-green-200'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-green-900'>Gross Earnings</span>
                  <TrendingUp className='w-4 h-4 text-green-600' />
                </div>
                <div className='text-xl font-bold text-green-700'>
                  ₹
                  {Math.round(
                    (paymentData?.earnings?.total || 0) / (1 - platformFee / 100)
                  ).toLocaleString()}
                </div>
                <p className='text-xs text-green-600'>Before platform fees</p>
              </div>

              <div className='p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-yellow-900'>Platform Fees</span>
                  <DollarSign className='w-4 h-4 text-yellow-600' />
                </div>
                <div className='text-xl font-bold text-yellow-700'>
                  ₹
                  {Math.round(
                    ((paymentData?.earnings?.total || 0) * platformFee) / (100 - platformFee)
                  ).toLocaleString()}
                </div>
                <p className='text-xs text-yellow-600'>{platformFee}% service fee</p>
              </div>

              <div className='p-4 bg-blue-50 rounded-lg border border-blue-200'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-blue-900'>Net Earnings</span>
                  <Wallet className='w-4 h-4 text-blue-600' />
                </div>
                <div className='text-xl font-bold text-blue-700'>
                  ₹{(paymentData?.earnings?.total || 0).toLocaleString()}
                </div>
                <p className='text-xs text-blue-600'>After fees deducted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your payments and earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <button
                className='p-4 border border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed'
                disabled={(paymentData?.balance?.available || 0) <= 0}
                onClick={() => {
                  if ((paymentData?.balance?.available || 0) > 0) {
                    setPayoutAmount(paymentData?.balance?.available?.toString() || '');
                  }
                }}
              >
                <Wallet className='w-8 h-8 text-green-600 mb-2' />
                <h4 className='font-medium text-gray-900 mb-1'>Request Payout</h4>
                <p className='text-sm text-gray-500'>
                  {(paymentData?.balance?.available || 0) > 0
                    ? `Withdraw ₹${(paymentData?.balance?.available || 0).toLocaleString()}`
                    : 'No funds available'}
                </p>
              </button>

              <button
                className='p-4 border border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left'
                onClick={handleSetupStripe}
              >
                <CreditCard className='w-8 h-8 text-blue-600 mb-2' />
                <h4 className='font-medium text-gray-900 mb-1'>Payment Settings</h4>
                <p className='text-sm text-gray-500'>Update bank details and preferences</p>
              </button>

              <button className='p-4 border border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left'>
                <Download className='w-8 h-8 text-purple-600 mb-2' />
                <h4 className='font-medium text-gray-900 mb-1'>Download Report</h4>
                <p className='text-sm text-gray-500'>Export payment history</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <Clock className='w-5 h-5 mr-2' />
              Transaction History
            </CardTitle>
            <CardDescription>Your recent earnings and payouts</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filter Tabs */}
            <div className='border-b border-gray-200 mb-6'>
              <nav className='-mb-px flex space-x-8'>
                {[
                  { key: 'all', label: 'All Transactions' },
                  { key: 'earning', label: 'Earnings' },
                  { key: 'payout', label: 'Payouts' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilterType(tab.key)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      filterType === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Transactions List */}
            <div className='space-y-4'>
              {paymentData?.recentPayments?.map((payment: any) => (
                <div
                  key={payment._id}
                  className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                >
                  <div className='flex items-center space-x-4'>
                    {getTransactionIcon(payment.paymentType || 'earning')}
                    <div>
                      <p className='font-medium text-gray-900'>
                        {payment.paymentType === 'rent'
                          ? 'Rent Payment'
                          : payment.paymentType === 'security_deposit'
                            ? 'Security Deposit'
                            : 'Booking Payment'}
                      </p>
                      {payment.listingId && (
                        <p className='text-sm text-gray-500'>{payment.listingId.title}</p>
                      )}
                      <p className='text-sm text-gray-500'>
                        {format(new Date(payment.createdAt), 'PPP')}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-4'>
                    <div className='text-right'>
                      <p className='font-semibold text-green-600'>
                        +₹{(payment.amount || 0).toLocaleString()}
                      </p>
                    </div>
                    {getStatusBadge(payment.status)}
                  </div>
                </div>
              ))}

              {paymentData?.recentPayouts?.map((payout: any) => (
                <div
                  key={payout._id}
                  className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                >
                  <div className='flex items-center space-x-4'>
                    {getTransactionIcon('payout')}
                    <div>
                      <p className='font-medium text-gray-900'>Payout to Bank Account</p>
                      <p className='text-sm text-gray-500'>
                        {format(new Date(payout.createdAt), 'PPP')}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-4'>
                    <div className='text-right'>
                      <p className='font-semibold text-red-600'>
                        -₹{(payout.amount || 0).toLocaleString()}
                      </p>
                    </div>
                    {getStatusBadge(payout.status)}
                  </div>
                </div>
              ))}
            </div>

            {!paymentData?.recentPayments?.length && !paymentData?.recentPayouts?.length && (
              <div className='text-center py-8 text-gray-500'>
                <DollarSign className='w-12 h-12 mx-auto mb-4 text-gray-400' />
                <p>No transactions found. Start receiving bookings to see payments here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>Important details about your payments</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
              <h4 className='font-medium text-blue-900 mb-2'>Payment Schedule</h4>
              <p className='text-sm text-blue-700'>
                Earnings are processed within 2-3 business days after a booking is completed.
                Payouts are available for withdrawal once funds are confirmed.
              </p>
            </div>

            <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
              <h4 className='font-medium text-yellow-900 mb-2'>Platform Fee</h4>
              <p className='text-sm text-yellow-700'>
                BedSpace charges a {platformFee}% service fee on each booking. This fee is
                automatically deducted from your earnings.
              </p>
            </div>

            <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
              <h4 className='font-medium text-green-900 mb-2'>Tax Information</h4>
              <p className='text-sm text-green-700'>
                You are responsible for reporting and paying taxes on your rental income. We
                recommend consulting with a tax professional.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
