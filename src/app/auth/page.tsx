'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RegisterForm from '@/components/forms/RegisterForm';
import LoginForm from '@/components/forms/LoginForm';
import OTPVerificationForm from '@/components/forms/OTPVerificationForm';
import { Button } from '@/components/ui/button';

type AuthStep = 'login' | 'register' | 'verify-otp';

export default function AuthPage() {
  const [currentStep, setCurrentStep] = useState<AuthStep>('login');
  const [userEmail, setUserEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegisterSuccess = (data: any) => {
    setUserEmail(data.email);
    setCurrentStep('verify-otp');
    setMessage('Registration successful! Please verify your email.');
    setError('');
  };

  const handleLoginSuccess = (data: any) => {
    setMessage('Login successful! Redirecting...');
    setError('');
    
    // Redirect based on user role and verification status
    setTimeout(() => {
      if (data.user.role === 'admin') {
        router.push('/admin');
      } else if (data.user.role === 'provider') {
        if (data.user.verificationStatus === 'approved') {
          router.push('/provider/dashboard');
        } else {
          router.push('/provider/verification');
        }
      } else {
        router.push('/dashboard');
      }
    }, 1000);
  };

  const handleOTPSuccess = (data: any) => {
    setMessage('Email verified successfully! Redirecting...');
    setError('');
    
    // Redirect based on user role
    setTimeout(() => {
      if (data.user.role === 'provider') {
        router.push('/provider/verification');
      } else {
        router.push('/dashboard');
      }
    }, 1000);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setMessage('');
  };

  const handleResendOTP = () => {
    setMessage('OTP sent successfully!');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">BedSpace</h1>
          <p className="text-gray-600">Your trusted bed space platform</p>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
            {message}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Auth Forms */}
        {currentStep === 'login' && (
          <>
            <LoginForm onSuccess={handleLoginSuccess} onError={handleError} />
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Button
                  variant="link"
                  onClick={() => setCurrentStep('register')}
                  className="p-0 h-auto text-blue-600 hover:text-blue-800"
                >
                  Sign up
                </Button>
              </p>
            </div>
          </>
        )}

        {currentStep === 'register' && (
          <>
            <RegisterForm onSuccess={handleRegisterSuccess} onError={handleError} />
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Button
                  variant="link"
                  onClick={() => setCurrentStep('login')}
                  className="p-0 h-auto text-blue-600 hover:text-blue-800"
                >
                  Sign in
                </Button>
              </p>
            </div>
          </>
        )}

        {currentStep === 'verify-otp' && (
          <>
            <OTPVerificationForm
              email={userEmail}
              onSuccess={handleOTPSuccess}
              onError={handleError}
              onResendOTP={handleResendOTP}
            />
            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => setCurrentStep('register')}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to registration
              </Button>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>© 2024 BedSpace. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
