'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, sanitizeInput } from '@/utils/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PhoneInput } from '@/components/ui/phone-input';
import { USER_ROLES } from '@/constants';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  role: 'seeker' | 'provider';
  password: string;
}

interface RegisterFormProps {
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
}

export default function RegisterForm({ onSuccess, onError }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: USER_ROLES.SEEKER,
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // Sanitize inputs before sending
      const sanitizedData = {
        ...data,
        name: sanitizeInput(data.name),
        email: sanitizeInput(data.email.toLowerCase()),
        phone: sanitizeInput(data.phone),
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess(result.data);
      } else {
        onError(result.error || 'Registration failed');
      }
    } catch (error) {
      onError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Join BedSpace to find or list bed spaces</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          {/* Name */}
          <div className='space-y-2'>
            <Label htmlFor='name'>Full Name</Label>
            <Input
              id='name'
              type='text'
              placeholder='Enter your full name'
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className='text-sm text-red-500'>{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              placeholder='Enter your email'
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className='text-sm text-red-500'>{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div className='space-y-2'>
            <Label htmlFor='phone'>Phone Number</Label>
            <PhoneInput
              value={watch('phone')}
              onChange={value => setValue('phone', value)}
              onBlur={() => {}}
              placeholder='Enter your phone number'
              error={!!errors.phone}
            />
            {errors.phone && <p className='text-sm text-red-500'>{errors.phone.message}</p>}
          </div>

          {/* Role Selection */}
          <div className='space-y-2'>
            <Label>I want to</Label>
            <div className='flex space-x-4'>
              <label className='flex items-center space-x-2 cursor-pointer'>
                <input
                  type='radio'
                  value={USER_ROLES.SEEKER}
                  {...register('role')}
                  className='text-blue-600'
                />
                <span className='text-sm'>Find bed spaces</span>
              </label>
              <label className='flex items-center space-x-2 cursor-pointer'>
                <input
                  type='radio'
                  value={USER_ROLES.PROVIDER}
                  {...register('role')}
                  className='text-blue-600'
                />
                <span className='text-sm'>List bed spaces</span>
              </label>
            </div>
            {errors.role && <p className='text-sm text-red-500'>{errors.role.message}</p>}
          </div>

          {/* Password */}
          <div className='space-y-2'>
            <Label htmlFor='password'>Password</Label>
            <div className='relative'>
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                placeholder='Enter your password'
                {...register('password')}
                className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700'
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <p className='text-sm text-red-500'>{errors.password.message}</p>}
          </div>

          {/* Provider Info */}
          {selectedRole === USER_ROLES.PROVIDER && (
            <div className='p-3 bg-blue-50 rounded-md'>
              <p className='text-sm text-blue-800'>
                As a provider, you&apos;ll need to complete verification before listing spaces.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button type='submit' className='w-full' disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
