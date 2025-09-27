'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, CreditCard, Home, Lock, Loader2 } from 'lucide-react';
import { useCurrency } from '@/contexts/LocalizationContext';
import { useCreatePaymentIntentMutation } from '@/lib/api/seekerApi';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function PaymentForm({ clientSecret, amount, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { formatCurrency } = useCurrency();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err: any) {
      onError(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='bg-blue-50 border border-blue-200 p-4 rounded-lg'>
        <h4 className='font-semibold text-blue-900 mb-2 flex items-center'>
          <Lock className='w-5 h-5 mr-2' />
          Secure Payment - {formatCurrency(amount)}
        </h4>
        <p className='text-sm text-blue-700'>
          Your payment information is processed securely through Stripe.
        </p>
      </div>

      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Card Information</label>
          <div className='border border-gray-300 rounded-lg p-3 bg-white'>
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      <Button
        type='submit'
        disabled={!stripe || isProcessing}
        className='w-full h-12 text-base bg-green-600 hover:bg-green-700 disabled:opacity-50'
      >
        {isProcessing ? (
          <>
            <Loader2 className='w-5 h-5 mr-2 animate-spin' />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className='w-5 h-5 mr-2' />
            Pay {formatCurrency(amount)}
          </>
        )}
      </Button>
    </form>
  );
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    id: string;
    title: string;
    rent: number;
    securityDeposit: number;
    address: string;
    city: string;
  };
  providerId: string;
}

export default function BookingModal({ isOpen, onClose, listing, providerId }: BookingModalProps) {
  const [checkInDate, setCheckInDate] = useState('');
  const [duration, setDuration] = useState(1);
  const [notes, setNotes] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    amount: number;
  } | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const { formatCurrency } = useCurrency();
  const [createPaymentIntent, { isLoading: isCreatingIntent }] = useCreatePaymentIntentMutation();

  // Get tomorrow's date as minimum date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const totalRent = listing.rent * duration;
  const totalAmount = totalRent + listing.securityDeposit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkInDate || duration < 1) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const result = await createPaymentIntent({
        listingId: listing.id,
        checkInDate,
        duration,
        notes: notes.trim(),
      }).unwrap();

      if (result.success && result.data.clientSecret) {
        setPaymentData({
          clientSecret: result.data.clientSecret,
          amount: result.data.amount,
        });
        setShowPayment(true);
        setPaymentError('');
      } else {
        throw new Error(result.error || 'Failed to create payment intent');
      }
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      setPaymentError(
        error?.data?.error || error?.message || 'Failed to initialize payment. Please try again.'
      );
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setPaymentError('');
    setTimeout(() => {
      handleClose();
    }, 3000);
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
    setPaymentSuccess(false);
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setCheckInDate('');
    setDuration(1);
    setNotes('');
    setShowPayment(false);
    setPaymentData(null);
    setPaymentError('');
    setPaymentSuccess(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2 text-xl'>
            <Home className='w-6 h-6 text-green-600' />
            <span>{showPayment ? 'Complete Payment' : 'Book This Property'}</span>
          </DialogTitle>
        </DialogHeader>

        {paymentSuccess ? (
          <div className='text-center py-8'>
            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <CreditCard className='w-8 h-8 text-green-600' />
            </div>
            <h3 className='text-xl font-semibold text-green-800 mb-2'>Payment Successful!</h3>
            <p className='text-gray-600 mb-4'>
              Your booking request has been submitted. The provider will review and confirm your
              request.
            </p>
            <p className='text-sm text-gray-500'>This window will close automatically...</p>
          </div>
        ) : showPayment && paymentData ? (
          <Elements stripe={stripePromise}>
            <div className='space-y-6'>
              {paymentError && (
                <div className='bg-red-50 border border-red-200 p-4 rounded-lg'>
                  <p className='text-red-800 font-medium'>Payment Error</p>
                  <p className='text-red-600 text-sm mt-1'>{paymentError}</p>
                </div>
              )}

              <div className='bg-gray-50 p-4 rounded-lg'>
                <h4 className='font-semibold text-gray-900 mb-2'>{listing.title}</h4>
                <div className='text-sm text-gray-600 space-y-1'>
                  <p>Duration: {duration} month(s)</p>
                  <p>Monthly Rent: {formatCurrency(listing.rent)}</p>
                  <p>Security Deposit: {formatCurrency(listing.securityDeposit)}</p>
                  <p className='font-semibold'>Total: {formatCurrency(paymentData.amount)}</p>
                </div>
              </div>

              <PaymentForm
                clientSecret={paymentData.clientSecret}
                amount={paymentData.amount}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />

              <Button variant='outline' onClick={() => setShowPayment(false)} className='w-full'>
                Back to Booking Details
              </Button>
            </div>
          </Elements>
        ) : (
          <>
            {paymentError && (
              <div className='bg-red-50 border border-red-200 p-4 rounded-lg mb-6'>
                <p className='text-red-800 font-medium'>Error</p>
                <p className='text-red-600 text-sm mt-1'>{paymentError}</p>
              </div>
            )}

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {/* Left Column - Property Details */}
              <div className='lg:col-span-1 space-y-4'>
                <div className='bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100'>
                  <h4 className='font-semibold text-gray-900 mb-3 text-lg'>{listing.title}</h4>
                  <p className='text-sm text-gray-600 mb-4 flex items-center'>
                    <Home className='w-4 h-4 mr-2 text-blue-600' />
                    {listing.address}, {listing.city}
                  </p>
                  <div className='space-y-3'>
                    <div className='bg-white p-3 rounded-lg shadow-sm'>
                      <span className='text-sm text-gray-500'>Monthly Rent</span>
                      <div className='text-2xl font-bold text-green-600'>
                        {formatCurrency(listing.rent)}
                      </div>
                    </div>
                    <div className='bg-white p-3 rounded-lg shadow-sm'>
                      <span className='text-sm text-gray-500'>Security Deposit</span>
                      <div className='text-xl font-semibold text-blue-600'>
                        {formatCurrency(listing.securityDeposit)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown - Moved to left column */}
                <div className='bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100'>
                  <h4 className='font-semibold text-gray-900 mb-4 flex items-center'>
                    <CreditCard className='w-5 h-5 mr-2 text-green-600' />
                    Cost Breakdown
                  </h4>
                  <div className='space-y-3 text-sm'>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>Monthly Rent × {duration} months:</span>
                      <span className='font-medium'>{formatCurrency(totalRent)}</span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>Security Deposit:</span>
                      <span className='font-medium'>{formatCurrency(listing.securityDeposit)}</span>
                    </div>
                    <div className='border-t border-green-200 pt-3 flex justify-between items-center'>
                      <span className='font-semibold text-lg text-gray-900'>Total Amount:</span>
                      <span className='font-bold text-xl text-green-600'>
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>
                  <p className='text-xs text-green-700 mt-3 bg-green-100 p-2 rounded'>
                    💡 Security deposit will be refunded at the end of tenancy
                  </p>
                </div>
              </div>

              {/* Right Column - Booking Form */}
              <div className='lg:col-span-2'>
                <div className='bg-white p-6 rounded-xl border border-gray-200 shadow-sm'>
                  <form onSubmit={handleSubmit} className='space-y-6'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                      <Calendar className='w-5 h-5 mr-2 text-blue-600' />
                      Booking Details
                    </h3>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      {/* Check-in Date */}
                      <div>
                        <label className='block text-sm font-semibold text-gray-700 mb-3'>
                          Move-in Date <span className='text-red-500'>*</span>
                        </label>
                        <Input
                          type='date'
                          value={checkInDate}
                          onChange={e => setCheckInDate(e.target.value)}
                          min={minDate}
                          required
                          className='h-12 text-base border-2 border-gray-300 focus:border-blue-500 rounded-lg'
                        />
                        <p className='text-xs text-gray-500 mt-2'>
                          📅 Earliest move-in date: {new Date(minDate).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Duration */}
                      <div>
                        <label className='block text-sm font-semibold text-gray-700 mb-3'>
                          Duration (months) <span className='text-red-500'>*</span>
                        </label>
                        <Input
                          type='number'
                          value={duration}
                          onChange={e => setDuration(parseInt(e.target.value) || 1)}
                          min={1}
                          max={24}
                          required
                          className='h-12 text-base border-2 border-gray-300 focus:border-blue-500 rounded-lg'
                        />
                        <p className='text-xs text-gray-500 mt-2'>
                          ⏱️ Minimum 1 month, maximum 24 months
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className='block text-sm font-semibold text-gray-700 mb-3'>
                        Additional Notes (Optional)
                      </label>
                      <Textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder='Any special requirements, questions, or preferences...'
                        rows={4}
                        maxLength={500}
                        className='border-2 border-gray-300 focus:border-blue-500 rounded-lg resize-none'
                      />
                      <div className='text-xs text-gray-500 mt-2 flex items-center justify-between'>
                        <span>📝 Share any specific requirements or questions</span>
                        <span className={notes.length > 450 ? 'text-red-500' : 'text-gray-500'}>
                          {notes.length}/500 characters
                        </span>
                      </div>
                    </div>

                    {/* Important Notice */}
                    <div className='bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-6 rounded-xl'>
                      <h4 className='font-semibold text-amber-800 mb-3 flex items-center'>
                        ⚠️ Important Information
                      </h4>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-amber-700'>
                        <div className='flex items-center'>
                          <span className='text-green-500 mr-2'>🔒</span>
                          Payment processed securely through Stripe
                        </div>
                        <div className='flex items-center'>
                          <span className='text-blue-500 mr-2'>✋</span>
                          Booking subject to provider approval
                        </div>
                        <div className='flex items-center'>
                          <span className='text-green-500 mr-2'>💰</span>
                          Full refund if booking is rejected
                        </div>
                        <div className='flex items-center'>
                          <span className='text-purple-500 mr-2'>🔄</span>
                          Monthly rent collected automatically
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className='flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6'>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={handleClose}
                        className='sm:flex-1 h-12 text-base border-2 border-gray-300 hover:border-gray-400'
                      >
                        Cancel
                      </Button>
                      <Button
                        type='submit'
                        disabled={isCreatingIntent}
                        className='sm:flex-1 h-12 text-base bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none'
                      >
                        {isCreatingIntent ? (
                          <>
                            <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                            Preparing Payment...
                          </>
                        ) : (
                          <>
                            <CreditCard className='w-5 h-5 mr-2' />
                            Book Now - {formatCurrency(totalAmount)}
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
