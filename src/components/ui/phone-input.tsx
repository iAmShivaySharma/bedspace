'use client';

import React, { useState, forwardRef } from 'react';
import { Input } from './input';
import { Button } from './button';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

interface CountryCode {
  country: string;
  code: string;
  flag: string;
}

const countryCodes: CountryCode[] = [
  { country: 'India', code: '+91', flag: '🇮🇳' },
  { country: 'United States', code: '+1', flag: '🇺🇸' },
  { country: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { country: 'Canada', code: '+1', flag: '🇨🇦' },
  { country: 'Australia', code: '+61', flag: '🇦🇺' },
  { country: 'Germany', code: '+49', flag: '🇩🇪' },
  { country: 'France', code: '+33', flag: '🇫🇷' },
  { country: 'Japan', code: '+81', flag: '🇯🇵' },
  { country: 'China', code: '+86', flag: '🇨🇳' },
  { country: 'Singapore', code: '+65', flag: '🇸🇬' },
  { country: 'UAE', code: '+971', flag: '🇦🇪' },
  { country: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { country: 'Nepal', code: '+977', flag: '🇳🇵' },
  { country: 'Bangladesh', code: '+880', flag: '🇧🇩' },
  { country: 'Sri Lanka', code: '+94', flag: '🇱🇰' },
];

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    { value = '', onChange, onBlur, name, placeholder = 'Enter phone number', className, error },
    ref
  ) => {
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(countryCodes[0]);
    const [phoneNumber, setPhoneNumber] = useState('');

    // Parse existing value to extract country code and phone number
    React.useEffect(() => {
      if (value) {
        const country = countryCodes.find(c => value.startsWith(c.code));
        if (country) {
          setSelectedCountry(country);
          setPhoneNumber(value.replace(country.code, ''));
        } else {
          setPhoneNumber(value);
        }
      }
    }, [value]);

    const handleCountryChange = (country: CountryCode) => {
      setSelectedCountry(country);
      const fullNumber = `${country.code}${phoneNumber}`;
      onChange?.(fullNumber);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newPhoneNumber = e.target.value.replace(/\D/g, ''); // Only allow digits
      setPhoneNumber(newPhoneNumber);
      const fullNumber = `${selectedCountry.code}${newPhoneNumber}`;
      onChange?.(fullNumber);
    };

    return (
      <div className={`flex ${className}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type='button'
              variant='outline'
              className={`flex items-center space-x-2 rounded-r-none border-r-0 px-3 ${
                error ? 'border-red-500' : ''
              }`}
            >
              <span className='text-lg'>{selectedCountry.flag}</span>
              <span className='text-sm font-medium'>{selectedCountry.code}</span>
              <ChevronDown className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-64 max-h-60 overflow-y-auto'>
            {countryCodes.map(country => (
              <DropdownMenuItem
                key={`${country.country}-${country.code}`}
                onClick={() => handleCountryChange(country)}
                className='flex items-center space-x-3 cursor-pointer'
              >
                <span className='text-lg'>{country.flag}</span>
                <span className='flex-1'>{country.country}</span>
                <span className='text-sm text-gray-500'>{country.code}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Input
          ref={ref}
          type='tel'
          value={phoneNumber}
          onChange={handlePhoneChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`rounded-l-none ${error ? 'border-red-500' : ''}`}
        />
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

export { PhoneInput, type PhoneInputProps, type CountryCode };
