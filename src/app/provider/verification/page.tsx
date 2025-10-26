'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { providerVerificationSchema } from '@/utils/validation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DocumentUpload from '@/components/ui/document-upload';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Shield,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import {
  useGetVerificationStatusQuery,
  useUpdateVerificationInfoMutation,
  useSaveVerificationDocumentMutation,
} from '@/lib/api/providerApi';

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
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editingDocument, setEditingDocument] = useState<string | null>(null);

  // RTK Query hooks
  const {
    data: verificationData,
    isLoading: loading,
    refetch: refetchVerification,
  } = useGetVerificationStatusQuery();
  const [updateVerificationInfo] = useUpdateVerificationInfoMutation();
  const [saveVerificationDocument] = useSaveVerificationDocumentMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(providerVerificationSchema),
    defaultValues: {
      businessName: verificationData?.data?.businessName || '',
      businessAddress: verificationData?.data?.businessAddress || '',
      businessPhone: verificationData?.data?.businessPhone || '',
    },
  });

  // Update form when verification data loads
  if (verificationData?.data && !loading) {
    const data = verificationData.data;
    setValue('businessName', data.businessName || '');
    setValue('businessAddress', data.businessAddress || '');
    setValue('businessPhone', data.businessPhone || '');
  }

  const isVerified = verificationData?.data?.verificationStatus === 'approved';

  const handleEditToggle = () => {
    setIsEditingInfo(!isEditingInfo);
    if (!isEditingInfo) {
      // Reset form when entering edit mode
      const data = verificationData?.data;
      if (data) {
        setValue('businessName', data.businessName || '');
        setValue('businessAddress', data.businessAddress || '');
        setValue('businessPhone', data.businessPhone || '');
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditingInfo(false);
    reset();
  };

  const onSubmit = async (data: FormData) => {
    try {
      const result = await updateVerificationInfo(data).unwrap();
      if (result.success) {
        setMessage('Business information updated successfully!');
        setError('');
        setIsEditingInfo(false);
        refetchVerification();
      } else {
        setError(result.error || 'Failed to update business information');
        setMessage('');
      }
    } catch (error: any) {
      const errorMessage =
        error?.data?.error || error?.message || 'Network error. Please try again.';
      setError(errorMessage);
      setMessage('');
    }
  };

  const handleDocumentUpload = async (urls: string[], documentType: string) => {
    if (urls.length === 0) return;

    try {
      const result = await saveVerificationDocument({
        type: documentType,
        url: urls[0], // Take first URL since we only upload one document per type
      }).unwrap();

      if (result.success) {
        setMessage('Document uploaded successfully!');
        setError('');
        setEditingDocument(null);
        refetchVerification();
      } else {
        setError(result.error || 'Failed to save document');
        setMessage('');
      }
    } catch (error: any) {
      const errorMessage =
        error?.data?.error || error?.message || 'Network error. Please try again.';
      setError(errorMessage);
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
    return <PageSkeleton type='form' />;
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
        {verificationData?.data && (
          <div
            className={`mb-8 p-6 rounded-lg border-l-4 ${
              verificationData.data.verificationStatus === 'approved'
                ? 'bg-green-50 border-green-400'
                : verificationData.data.verificationStatus === 'rejected'
                  ? 'bg-red-50 border-red-400'
                  : 'bg-yellow-50 border-yellow-400'
            }`}
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                {getStatusIcon(verificationData.data.verificationStatus)}
                <div>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Verification{' '}
                    {verificationData.data.verificationStatus.charAt(0).toUpperCase() +
                      verificationData.data.verificationStatus.slice(1)}
                  </h3>
                  <p className='text-sm text-gray-600'>
                    {verificationData.data.verificationStatus === 'approved' &&
                      'Your account is verified! You can now list bed spaces.'}
                    {verificationData.data.verificationStatus === 'pending' &&
                      "Your verification is under review. We'll notify you once complete."}
                    {verificationData.data.verificationStatus === 'rejected' &&
                      'Your verification was rejected. Please update your information and resubmit.'}
                  </p>
                </div>
              </div>
              <div className='text-right'>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(verificationData.data.verificationStatus)}`}
                >
                  {verificationData.data.verificationStatus.charAt(0).toUpperCase() +
                    verificationData.data.verificationStatus.slice(1)}
                </span>
              </div>
            </div>
            {verificationData.data.verificationStatus === 'rejected' &&
              verificationData.data.rejectionReason && (
                <div className='mt-4 p-3 bg-red-100 rounded-md'>
                  <div className='flex items-center space-x-2 text-red-800'>
                    <AlertCircle className='w-4 h-4' />
                    <span className='text-sm font-medium'>Rejection Reason:</span>
                  </div>
                  <p className='text-sm text-red-700 mt-1'>
                    {verificationData.data.rejectionReason}
                  </p>
                </div>
              )}
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Business Information */}
          <Card className='hover:shadow-md transition-shadow'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='flex items-center space-x-2'>
                    <span>Business Information</span>
                    {isVerified && <CheckCircle className='w-5 h-5 text-green-500' />}
                  </CardTitle>
                  <CardDescription>
                    {isVerified
                      ? 'Your business details (verified)'
                      : 'Provide your business details for verification'}
                  </CardDescription>
                </div>
                {isVerified && (
                  <div className='flex items-center space-x-2'>
                    {isEditingInfo ? (
                      <>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={handleCancelEdit}
                          className='flex items-center space-x-1'
                        >
                          <X className='w-4 h-4' />
                          <span>Cancel</span>
                        </Button>
                        <Button
                          type='submit'
                          size='sm'
                          form='business-info-form'
                          className='flex items-center space-x-1'
                        >
                          <Save className='w-4 h-4' />
                          <span>Save</span>
                        </Button>
                      </>
                    ) : (
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={handleEditToggle}
                        className='flex items-center space-x-1'
                      >
                        <Edit3 className='w-4 h-4' />
                        <span>Edit</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isVerified && !isEditingInfo ? (
                // Read-only view for verified providers
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700'>Bedspace Name</label>
                    <div className='px-3 py-2 border border-gray-200 rounded-md bg-gray-50'>
                      {verificationData?.data?.businessName || (
                        <span className='text-gray-500 italic'>Not provided</span>
                      )}
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700'>Bedspace Address</label>
                    <div className='px-3 py-2 border border-gray-200 rounded-md bg-gray-50'>
                      {verificationData?.data?.businessAddress || (
                        <span className='text-gray-500 italic'>Not provided</span>
                      )}
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700'>Business Phone</label>
                    <div className='px-3 py-2 border border-gray-200 rounded-md bg-gray-50'>
                      {verificationData?.data?.businessPhone || (
                        <span className='text-gray-500 italic'>Not provided</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Edit form for non-verified or edit mode
                <form
                  id='business-info-form'
                  onSubmit={handleSubmit(onSubmit)}
                  className='space-y-4'
                >
                  <div className='space-y-2'>
                    <Label htmlFor='businessName'>Bedspace Name (Optional)</Label>
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
                    <Label htmlFor='businessAddress'>Bedspace Address (Optional)</Label>
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

                  {!isVerified && (
                    <Button type='submit' className='w-full'>
                      Update Business Information
                    </Button>
                  )}
                </form>
              )}
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card className='hover:shadow-md transition-shadow'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='flex items-center space-x-2'>
                    <span>Verification Documents</span>
                    {isVerified && <CheckCircle className='w-5 h-5 text-green-500' />}
                  </CardTitle>
                  <CardDescription>
                    {isVerified
                      ? 'Your verification documents (approved)'
                      : 'Upload required documents for verification'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                {/* Document Types */}
                {[
                  { type: 'id_card', label: 'Emirates ID/Passport', required: true },
                  {
                    type: 'address_proof',
                    label: 'Address Proof(DEWA/Wi-Fi/Ejari/Sub-Lease documents)',
                    required: true,
                  },
                  { type: 'business_license', label: 'Business License', required: false },
                ].map(({ type, label, required }) => {
                  const existingDoc = verificationData?.data?.verificationDocuments.find(
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
                        <div className='flex items-center space-x-2'>
                          {existingDoc && getStatusIcon(existingDoc.status)}
                          {isVerified && existingDoc && (
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() =>
                                setEditingDocument(editingDocument === type ? null : type)
                              }
                              className='flex items-center space-x-1'
                            >
                              <Edit3 className='w-3 h-3' />
                              <span className='text-xs'>
                                {editingDocument === type ? 'Cancel' : 'Update'}
                              </span>
                            </Button>
                          )}
                        </div>
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
                            {existingDoc.fileUrl && (
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => window.open(existingDoc.fileUrl, '_blank')}
                              >
                                View
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {(!isVerified || editingDocument === type) && (
                        <DocumentUpload
                          folder='documents'
                          multiple={false}
                          maxFiles={1}
                          onUploadComplete={urls => handleDocumentUpload(urls, type)}
                          acceptedTypes={['application/pdf', 'image/jpeg', 'image/png']}
                          maxFileSize={10}
                          className='mt-3'
                        />
                      )}

                      {isVerified && !editingDocument && !existingDoc && (
                        <div className='mt-3 p-4 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-500'>
                          <p className='text-sm'>Document upload disabled (account verified)</p>
                        </div>
                      )}
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
