'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { providerVerificationSchema } from '@/utils/validation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DocumentUpload from '@/components/ui/document-upload';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle, Shield } from 'lucide-react';

interface VerificationData {
  verificationStatus: string;
  verificationDocuments: any[];
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  rejectionReason?: string;
}

interface FormData {
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
}

export default function ProviderVerificationPage() {
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(providerVerificationSchema),
  });

  useEffect(() => {
    const fetchVerificationData = async () => {
      try {
        const response = await fetch('/api/providers/verification', {
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          setVerificationData(result.data);

          // Pre-fill form with existing data
          if (result.data.businessName) setValue('businessName', result.data.businessName);
          if (result.data.businessAddress) setValue('businessAddress', result.data.businessAddress);
          if (result.data.businessPhone) setValue('businessPhone', result.data.businessPhone);
        } else {
          const result = await response.json();
          setError(result.error || 'Failed to fetch verification data');
        }
      } catch (error) {
        console.error('Error fetching verification data:', error);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchVerificationData();
  }, [router, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch('/api/providers/verification', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('Business information updated successfully!');
        setError('');
        // Refresh verification data
        setVerificationData(prev => (prev ? { ...prev, ...data } : null));
      } else {
        setError(result.error || 'Failed to update business information');
        setMessage('');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      setMessage('');
    }
  };

  const handleDocumentUpload = async (urls: string[], documentType: string) => {
    if (urls.length === 0) return;

    try {
      // Save the document URL to the backend
      const response = await fetch('/api/providers/verification-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          type: documentType,
          url: urls[0], // Take first URL since we only upload one document per type
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('Document uploaded successfully!');
        setError('');
        // Refresh verification data
        const updatedData = { ...verificationData! };
        updatedData.verificationDocuments = updatedData.verificationDocuments.filter(
          doc => doc.type !== documentType
        );
        updatedData.verificationDocuments.push(result.data.document);
        updatedData.verificationStatus = result.data.verificationStatus;
        setVerificationData(updatedData);
      } else {
        setError(result.error || 'Failed to save document');
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
        return <CheckCircle className='w-5 h-5 text-green-500' />;
      case 'rejected':
        return <XCircle className='w-5 h-5 text-red-500' />;
      case 'pending':
      default:
        return <Clock className='w-5 h-5 text-yellow-500' />;
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
      <DashboardLayout title='Verification'>
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-600'>Loading verification data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title='Provider Verification'>
      <div className='space-y-6'>
        {/* Page Header */}
        <div className='flex items-center space-x-3'>
          <Shield className='w-8 h-8 text-blue-600' />
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Provider Verification</h1>
            <p className='text-gray-600'>Complete your verification to start listing bed spaces</p>
          </div>
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

        {/* Verification Status */}
        {verificationData && (
          <Card className='mb-8'>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                {getStatusIcon(verificationData.verificationStatus)}
                <span>Verification Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center space-x-3'>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(verificationData.verificationStatus)}`}
                >
                  {verificationData.verificationStatus.charAt(0).toUpperCase() +
                    verificationData.verificationStatus.slice(1)}
                </span>
                {verificationData.verificationStatus === 'rejected' &&
                  verificationData.rejectionReason && (
                    <div className='flex items-center space-x-2 text-red-600'>
                      <AlertCircle className='w-4 h-4' />
                      <span className='text-sm'>{verificationData.rejectionReason}</span>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Provide your business details for verification</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='businessName'>Business Name (Optional)</Label>
                  <Input
                    id='businessName'
                    type='text'
                    placeholder='Enter your business name'
                    {...register('businessName')}
                    className={errors.businessName ? 'border-red-500' : ''}
                  />
                  {errors.businessName && (
                    <p className='text-sm text-red-500'>{errors.businessName.message}</p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='businessAddress'>Business Address (Optional)</Label>
                  <Input
                    id='businessAddress'
                    type='text'
                    placeholder='Enter your business address'
                    {...register('businessAddress')}
                    className={errors.businessAddress ? 'border-red-500' : ''}
                  />
                  {errors.businessAddress && (
                    <p className='text-sm text-red-500'>{errors.businessAddress.message}</p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='businessPhone'>Business Phone (Optional)</Label>
                  <Input
                    id='businessPhone'
                    type='tel'
                    placeholder='Enter your business phone'
                    {...register('businessPhone')}
                    className={errors.businessPhone ? 'border-red-500' : ''}
                  />
                  {errors.businessPhone && (
                    <p className='text-sm text-red-500'>{errors.businessPhone.message}</p>
                  )}
                </div>

                <Button type='submit' className='w-full'>
                  Update Business Information
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Documents</CardTitle>
              <CardDescription>Upload required documents for verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                {/* Document Types */}
                {[
                  { type: 'id_card', label: 'ID Card/Passport', required: true },
                  { type: 'address_proof', label: 'Address Proof', required: true },
                  { type: 'business_license', label: 'Business License', required: false },
                ].map(({ type, label, required }) => {
                  const existingDoc = verificationData?.verificationDocuments.find(
                    doc => doc.type === type
                  );

                  return (
                    <div key={type} className='border rounded-lg p-4'>
                      <div className='flex items-center justify-between mb-4'>
                        <div className='flex items-center space-x-2'>
                          <FileText className='w-4 h-4' />
                          <span className='font-medium'>{label}</span>
                          {required && <span className='text-red-500 text-sm'>*</span>}
                        </div>
                        {existingDoc && getStatusIcon(existingDoc.status)}
                      </div>

                      {existingDoc && (
                        <div className='mb-4 p-3 bg-gray-50 rounded-lg'>
                          <div className='flex items-center justify-between'>
                            <div>
                              <p className='text-sm text-gray-600'>
                                Current: Uploaded{' '}
                                {new Date(existingDoc.uploadedAt).toLocaleDateString()}
                              </p>
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${getStatusColor(existingDoc.status)}`}
                              >
                                {existingDoc.status.charAt(0).toUpperCase() +
                                  existingDoc.status.slice(1)}
                              </span>
                            </div>
                            {(existingDoc.url || existingDoc.fileUrl) && (
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() =>
                                  window.open(existingDoc.url || existingDoc.fileUrl, '_blank')
                                }
                              >
                                View
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      <DocumentUpload
                        folder='documents'
                        multiple={false}
                        maxFiles={1}
                        onUploadComplete={urls => handleDocumentUpload(urls, type)}
                        acceptedTypes={['application/pdf', 'image/jpeg', 'image/png']}
                        maxFileSize={10}
                        className='mt-3'
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
