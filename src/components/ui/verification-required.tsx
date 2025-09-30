'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Shield, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface VerificationRequiredProps {
  title?: string;
  description?: string;
  verificationStatus?: 'pending' | 'rejected' | 'not_started';
  rejectionReason?: string;
}

export default function VerificationRequired({
  title = 'Verification Required',
  description = 'You need to complete provider verification to access this feature.',
  verificationStatus = 'not_started',
  rejectionReason,
}: VerificationRequiredProps) {
  const router = useRouter();

  const getStatusInfo = () => {
    switch (verificationStatus) {
      case 'pending':
        return {
          icon: <Clock className='w-12 h-12 text-yellow-500' />,
          title: 'Verification Pending',
          message: 'Your verification is being reviewed. This usually takes 1-2 business days.',
          buttonText: 'Check Status',
          buttonVariant: 'outline' as const,
        };
      case 'rejected':
        return {
          icon: <AlertCircle className='w-12 h-12 text-red-500' />,
          title: 'Verification Rejected',
          message:
            rejectionReason ||
            'Your verification was rejected. Please update your documents and try again.',
          buttonText: 'Update Verification',
          buttonVariant: 'default' as const,
        };
      default:
        return {
          icon: <Shield className='w-12 h-12 text-blue-500' />,
          title: 'Complete Verification',
          message:
            'To ensure user safety and trust, all providers must be verified before listing properties.',
          buttonText: 'Start Verification',
          buttonVariant: 'default' as const,
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className='flex items-center justify-center min-h-[60vh]'>
      <Card className='max-w-md w-full mx-4'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>{statusInfo.icon}</div>
          <CardTitle className='text-xl'>{statusInfo.title}</CardTitle>
          <CardDescription className='text-center'>{statusInfo.message}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {verificationStatus === 'rejected' && rejectionReason && (
            <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
              <div className='flex items-start space-x-2'>
                <AlertCircle className='w-5 h-5 text-red-500 mt-0.5 flex-shrink-0' />
                <div>
                  <p className='text-sm font-medium text-red-800'>Rejection Reason:</p>
                  <p className='text-sm text-red-700'>{rejectionReason}</p>
                </div>
              </div>
            </div>
          )}

          <div className='space-y-3'>
            <Button
              onClick={() => router.push('/provider/verification')}
              className='w-full'
              variant={statusInfo.buttonVariant}
            >
              {statusInfo.buttonText}
            </Button>

            <Button onClick={() => router.push('/dashboard')} variant='ghost' className='w-full'>
              Back to Dashboard
            </Button>
          </div>

          {/* Verification Benefits */}
          <div className='mt-6 pt-4 border-t'>
            <h4 className='text-sm font-medium text-gray-900 mb-2'>Verification Benefits:</h4>
            <ul className='text-sm text-gray-600 space-y-1'>
              <li className='flex items-center space-x-2'>
                <CheckCircle className='w-4 h-4 text-green-500' />
                <span>List unlimited properties</span>
              </li>
              <li className='flex items-center space-x-2'>
                <CheckCircle className='w-4 h-4 text-green-500' />
                <span>Receive booking requests</span>
              </li>
              <li className='flex items-center space-x-2'>
                <CheckCircle className='w-4 h-4 text-green-500' />
                <span>Access analytics and reports</span>
              </li>
              <li className='flex items-center space-x-2'>
                <CheckCircle className='w-4 h-4 text-green-500' />
                <span>Verified badge on listings</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
