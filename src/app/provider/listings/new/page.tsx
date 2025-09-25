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
import { ArrowLeft, Home, Loader2 } from 'lucide-react';

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
      const result = await createListing({
        ...data,
        facilities: selectedFacilities,
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

  return (
    <DashboardLayout title='Add New Listing'>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center space-x-4'>
          <Button variant='ghost' onClick={() => router.back()} className='p-2'>
            <ArrowLeft className='w-4 h-4' />
          </Button>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Add New Listing</h1>
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
              <CardDescription>Select all available facilities (optional)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
                {FACILITIES.map(facility => (
                  <label
                    key={facility}
                    className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
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
