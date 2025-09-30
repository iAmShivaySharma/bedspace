'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { otpSchema } from '@/utils/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail } from 'lucide-react';

interface OTPFormData {
  otp: string;
  identifier: string;
}

interface OTPVerificationFormProps {
  email: string;
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
  onResendOTP: () => void;
}

export default function OTPVerificationForm({
  email,
  onSuccess,
  onError,
  onResendOTP,
}: OTPVerificationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      identifier: email,
    },
  });

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const onSubmit = async (data: OTPFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // Token is now stored in httpOnly cookie by the server
        onSuccess(result.data);
      } else {
        onError(result.error || 'OTP verification failed');
      }
    } catch (error) {
      onError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier: email }),
      });

      const result = await response.json();

      if (result.success) {
        setCountdown(60);
        setCanResend(false);
        onResendOTP();
      } else {
        onError(result.error || 'Failed to resend OTP');
      }
    } catch (error) {
      onError('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader className='text-center'>
        <div className='mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4'>
          <Mail className='w-6 h-6 text-blue-600' />
        </div>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          We&apos;ve sent a 6-digit code to
          <br />
          <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          {/* Hidden identifier field */}
          <input type='hidden' {...register('identifier')} />

          {/* OTP Input */}
          <div className='space-y-2'>
            <Label htmlFor='otp'>Verification Code</Label>
            <Input
              id='otp'
              type='text'
              placeholder='Enter 6-digit code'
              maxLength={6}
              {...register('otp')}
              className={`text-center text-lg tracking-widest ${errors.otp ? 'border-red-500' : ''}`}
              onChange={e => {
                // Only allow numbers
                const value = e.target.value.replace(/\D/g, '');
                setValue('otp', value);
              }}
            />
            {errors.otp && <p className='text-sm text-red-500'>{errors.otp.message}</p>}
          </div>

          {/* Submit Button */}
          <Button type='submit' className='w-full' disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </Button>

          {/* Resend OTP */}
          <div className='text-center'>
            <p className='text-sm text-gray-600 mb-2'>Didn&apos;t receive the code?</p>
            {canResend ? (
              <Button
                type='button'
                variant='ghost'
                onClick={handleResendOTP}
                disabled={isResending}
                className='text-blue-600 hover:text-blue-800'
              >
                {isResending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Resending...
                  </>
                ) : (
                  'Resend Code'
                )}
              </Button>
            ) : (
              <p className='text-sm text-gray-500'>Resend code in {countdown}s</p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
