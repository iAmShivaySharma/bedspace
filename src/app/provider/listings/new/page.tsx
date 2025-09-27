'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateListingMutation } from '@/lib/api/providerApi';
import { ROOM_TYPES, GENDER_PREFERENCES, FACILITIES, INDIAN_STATES } from '@/constants';
import { ArrowLeft, Home, Loader2, Plus, X, Upload, FileText, Image, Video } from 'lucide-react';

const listingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title too long'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description too long'),
  address: z.string().min(10, 'Please provide a detailed address').max(300, 'Address too long'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  rent: z.number().min(500, 'Rent must be at least ₹500').max(100000, 'Rent too high'),
  securityDeposit: z
    .number()
    .min(0, 'Security deposit must be positive')
    .max(500000, 'Security deposit too high'),
  roomType: z.enum(['single', 'shared', 'private']),
  genderPreference: z.enum(['male', 'female', 'any']),
  facilities: z.array(z.string()).optional(),
  availableFrom: z.string().min(1, 'Available from date is required'),
});

type ListingFormData = z.infer<typeof listingSchema>;

export default function AddListingPage() {
  const router = useRouter();
  const [createListing, { isLoading }] = useCreateListingMutation();
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [customFacilities, setCustomFacilities] = useState<string[]>([]);
  const [newCustomFacility, setNewCustomFacility] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{
    images: File[];
    videos: File[];
    documents: File[];
  }>({
    images: [],
    videos: [],
    documents: [],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      roomType: 'private',
      genderPreference: 'any',
      facilities: [],
    },
  });

  const onSubmit = async (data: ListingFormData) => {
    try {
      const allFacilities = [...selectedFacilities, ...customFacilities];

      const result = await createListing({
        ...data,
        facilities: allFacilities,
      }).unwrap();

      if (result.success) {
        router.push('/provider/listings');
      }
    } catch (error: any) {
      console.error('Failed to create listing:', error);
    }
  };

  const toggleFacility = (facility: string) => {
    const updated = selectedFacilities.includes(facility)
      ? selectedFacilities.filter(f => f !== facility)
      : [...selectedFacilities, facility];

    setSelectedFacilities(updated);
    setValue('facilities', updated);
  };

  const addCustomFacility = () => {
    if (newCustomFacility.trim() && !customFacilities.includes(newCustomFacility.trim())) {
      const updated = [...customFacilities, newCustomFacility.trim()];
      setCustomFacilities(updated);
      setNewCustomFacility('');
    }
  };

  const removeCustomFacility = (facility: string) => {
    setCustomFacilities(customFacilities.filter(f => f !== facility));
  };

  const handleFileUpload = (files: FileList | null, type: 'images' | 'videos' | 'documents') => {
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }

      if (type === 'images') {
        return file.type.startsWith('image/');
      } else if (type === 'videos') {
        return file.type.startsWith('video/');
      } else if (type === 'documents') {
        return file.type === 'application/pdf' || file.type.startsWith('application/');
      }
      return true;
    });

    setUploadedFiles(prev => ({
      ...prev,
      [type]: [...prev[type], ...validFiles],
    }));
  };

  const removeFile = (fileName: string, type: 'images' | 'videos' | 'documents') => {
    setUploadedFiles(prev => ({
      ...prev,
      [type]: prev[type].filter(file => file.name !== fileName),
    }));
  };

  const getFileIcon = (type: 'images' | 'videos' | 'documents') => {
    switch (type) {
      case 'images':
        return <Image className='w-4 h-4' />;
      case 'videos':
        return <Video className='w-4 h-4' />;
      case 'documents':
        return <FileText className='w-4 h-4' />;
    }
  };

  return (
    <DashboardLayout title='Add New Listing'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center space-x-4'>
          <Button variant='ghost' onClick={() => router.back()} className='p-2'>
            <ArrowLeft className='w-4 h-4' />
          </Button>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Listing Details</h1>
            <p className='text-gray-600'>Create a new bed space listing</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Home className='w-5 h-5 mr-2' />
                Basic Information
              </CardTitle>
              <CardDescription>Provide the essential details about your listing</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <Label htmlFor='title'>Listing Title *</Label>
                <Input
                  id='title'
                  {...register('title')}
                  placeholder='e.g., Cozy Single Room in Bandra'
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className='text-sm text-red-600 mt-1'>{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor='description'>Description *</Label>
                <Textarea
                  id='description'
                  {...register('description')}
                  placeholder='Describe your property, nearby amenities, and what makes it special...'
                  rows={4}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className='text-sm text-red-600 mt-1'>{errors.description.message}</p>
                )}
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='roomType'>Room Type *</Label>
                  <select
                    id='roomType'
                    {...register('roomType')}
                    className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    <option value='private'>Private Room</option>
                    <option value='shared'>Shared Room</option>
                    <option value='single'>Single Occupancy</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor='genderPreference'>Gender Preference *</Label>
                  <select
                    id='genderPreference'
                    {...register('genderPreference')}
                    className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  >
                    <option value='any'>Any</option>
                    <option value='male'>Male Only</option>
                    <option value='female'>Female Only</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
              <CardDescription>Provide the complete address of your property</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <Label htmlFor='address'>Full Address *</Label>
                <Textarea
                  id='address'
                  {...register('address')}
                  placeholder='e.g., 123 Sample Street, Near Metro Station, Landmark Building'
                  rows={3}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className='text-sm text-red-600 mt-1'>{errors.address.message}</p>
                )}
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <Label htmlFor='city'>City *</Label>
                  <Input
                    id='city'
                    {...register('city')}
                    placeholder='e.g., Mumbai'
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && (
                    <p className='text-sm text-red-600 mt-1'>{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor='state'>State *</Label>
                  <select
                    id='state'
                    {...register('state')}
                    className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value=''>Select State</option>
                    {INDIAN_STATES.map(state => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className='text-sm text-red-600 mt-1'>{errors.state.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor='pincode'>Pincode *</Label>
                  <Input
                    id='pincode'
                    {...register('pincode')}
                    placeholder='400001'
                    maxLength={6}
                    className={errors.pincode ? 'border-red-500' : ''}
                  />
                  {errors.pincode && (
                    <p className='text-sm text-red-600 mt-1'>{errors.pincode.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing Details</CardTitle>
              <CardDescription>Set the rent and deposit amount</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='rent'>Monthly Rent (₹) *</Label>
                  <Input
                    id='rent'
                    type='number'
                    {...register('rent', { valueAsNumber: true })}
                    placeholder='15000'
                    className={errors.rent ? 'border-red-500' : ''}
                  />
                  {errors.rent && (
                    <p className='text-sm text-red-600 mt-1'>{errors.rent.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor='securityDeposit'>Security Deposit (₹) *</Label>
                  <Input
                    id='securityDeposit'
                    type='number'
                    {...register('securityDeposit', { valueAsNumber: true })}
                    placeholder='30000'
                    className={errors.securityDeposit ? 'border-red-500' : ''}
                  />
                  {errors.securityDeposit && (
                    <p className='text-sm text-red-600 mt-1'>{errors.securityDeposit.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Facilities */}
          <Card>
            <CardHeader>
              <CardTitle>Facilities & Amenities</CardTitle>
              <CardDescription>Select available facilities and add custom ones</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Standard Facilities */}
              <div>
                <h4 className='text-sm font-semibold mb-3'>Standard Facilities</h4>
                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                  {FACILITIES.map(facility => (
                    <label
                      key={facility}
                      className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedFacilities.includes(facility)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <input
                        type='checkbox'
                        checked={selectedFacilities.includes(facility)}
                        onChange={() => toggleFacility(facility)}
                        className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                      />
                      <span className='text-sm font-medium'>{facility}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Facilities */}
              <div>
                <h4 className='text-sm font-semibold mb-3'>Custom Facilities</h4>
                <div className='flex gap-2 mb-3'>
                  <Input
                    placeholder='Add custom facility (e.g., Study Room, Rooftop Access)'
                    value={newCustomFacility}
                    onChange={e => setNewCustomFacility(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addCustomFacility())}
                    className='flex-1'
                  />
                  <Button
                    type='button'
                    onClick={addCustomFacility}
                    disabled={!newCustomFacility.trim()}
                    variant='outline'
                  >
                    <Plus className='w-4 h-4 mr-1' />
                    Add
                  </Button>
                </div>

                {/* Custom Facilities List */}
                {customFacilities.length > 0 && (
                  <div className='flex flex-wrap gap-2'>
                    {customFacilities.map(facility => (
                      <div
                        key={facility}
                        className='flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg'
                      >
                        <span className='text-sm font-medium text-green-800'>{facility}</span>
                        <button
                          type='button'
                          onClick={() => removeCustomFacility(facility)}
                          className='text-green-600 hover:text-green-800 transition-colors'
                        >
                          <X className='w-4 h-4' />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Media & Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Media & Documents</CardTitle>
              <CardDescription>
                Upload images, videos, and documents for your listing
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Images Upload */}
              <div>
                <div className='flex items-center justify-between mb-3'>
                  <h4 className='text-sm font-semibold'>Property Images</h4>
                  <label className='cursor-pointer'>
                    <input
                      type='file'
                      multiple
                      accept='image/*'
                      onChange={e => handleFileUpload(e.target.files, 'images')}
                      className='hidden'
                    />
                    <Button type='button' variant='outline' size='sm' asChild>
                      <span>
                        <Upload className='w-4 h-4 mr-1' />
                        Add Images
                      </span>
                    </Button>
                  </label>
                </div>
                {uploadedFiles.images.length > 0 && (
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                    {uploadedFiles.images.map((file, index) => (
                      <div key={index} className='relative p-3 border border-gray-200 rounded-lg'>
                        <div className='flex items-center space-x-2'>
                          {getFileIcon('images')}
                          <span className='text-xs text-gray-600 truncate flex-1'>{file.name}</span>
                          <button
                            type='button'
                            onClick={() => removeFile(file.name, 'images')}
                            className='text-red-500 hover:text-red-700 transition-colors'
                          >
                            <X className='w-4 h-4' />
                          </button>
                        </div>
                        <div className='text-xs text-gray-500 mt-1'>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Videos Upload */}
              <div>
                <div className='flex items-center justify-between mb-3'>
                  <h4 className='text-sm font-semibold'>Property Videos</h4>
                  <label className='cursor-pointer'>
                    <input
                      type='file'
                      multiple
                      accept='video/*'
                      onChange={e => handleFileUpload(e.target.files, 'videos')}
                      className='hidden'
                    />
                    <Button type='button' variant='outline' size='sm' asChild>
                      <span>
                        <Upload className='w-4 h-4 mr-1' />
                        Add Videos
                      </span>
                    </Button>
                  </label>
                </div>
                {uploadedFiles.videos.length > 0 && (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    {uploadedFiles.videos.map((file, index) => (
                      <div key={index} className='relative p-3 border border-gray-200 rounded-lg'>
                        <div className='flex items-center space-x-2'>
                          {getFileIcon('videos')}
                          <span className='text-xs text-gray-600 truncate flex-1'>{file.name}</span>
                          <button
                            type='button'
                            onClick={() => removeFile(file.name, 'videos')}
                            className='text-red-500 hover:text-red-700 transition-colors'
                          >
                            <X className='w-4 h-4' />
                          </button>
                        </div>
                        <div className='text-xs text-gray-500 mt-1'>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documents Upload */}
              <div>
                <div className='flex items-center justify-between mb-3'>
                  <h4 className='text-sm font-semibold'>Documents (PDF, etc.)</h4>
                  <label className='cursor-pointer'>
                    <input
                      type='file'
                      multiple
                      accept='.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                      onChange={e => handleFileUpload(e.target.files, 'documents')}
                      className='hidden'
                    />
                    <Button type='button' variant='outline' size='sm' asChild>
                      <span>
                        <Upload className='w-4 h-4 mr-1' />
                        Add Documents
                      </span>
                    </Button>
                  </label>
                </div>
                {uploadedFiles.documents.length > 0 && (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    {uploadedFiles.documents.map((file, index) => (
                      <div key={index} className='relative p-3 border border-gray-200 rounded-lg'>
                        <div className='flex items-center space-x-2'>
                          {getFileIcon('documents')}
                          <span className='text-xs text-gray-600 truncate flex-1'>{file.name}</span>
                          <button
                            type='button'
                            onClick={() => removeFile(file.name, 'documents')}
                            className='text-red-500 hover:text-red-700 transition-colors'
                          >
                            <X className='w-4 h-4' />
                          </button>
                        </div>
                        <div className='text-xs text-gray-500 mt-1'>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className='text-xs text-gray-500'>
                <p>• Maximum file size: 10MB per file</p>
                <p>
                  • Supported formats: Images (JPG, PNG, etc.), Videos (MP4, MOV, etc.), Documents
                  (PDF, DOC, etc.)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader>
              <CardTitle>Availability</CardTitle>
              <CardDescription>When will this listing be available for rent?</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor='availableFrom'>Available From *</Label>
                <Input
                  id='availableFrom'
                  type='date'
                  {...register('availableFrom')}
                  min={new Date().toISOString().split('T')[0]}
                  className={errors.availableFrom ? 'border-red-500' : ''}
                />
                {errors.availableFrom && (
                  <p className='text-sm text-red-600 mt-1'>{errors.availableFrom.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className='flex items-center justify-between pt-6'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <Button type='submit' disabled={isLoading} className='min-w-[120px]'>
              {isLoading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Creating...
                </>
              ) : (
                'Create Listing'
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
