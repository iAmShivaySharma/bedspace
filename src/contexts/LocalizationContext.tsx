'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  LocalizationSettings,
  DEFAULT_LOCALIZATION,
  setLocalizationSettings,
  formatCurrencyWithSettings,
  formatDateWithSettings,
  formatTimeWithSettings,
  formatDateTimeWithSettings,
  formatRelativeTimeWithSettings,
  getCurrencySymbol,
} from '@/lib/localization';

interface LocalizationContextType {
  settings: LocalizationSettings;
  updateSettings: (newSettings: LocalizationSettings) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string) => string;
  formatTime: (date: Date | string) => string;
  formatDateTime: (date: Date | string) => string;
  formatRelativeTime: (date: Date | string) => string;
  currencySymbol: string;
  loading: boolean;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<LocalizationSettings>(DEFAULT_LOCALIZATION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch localization settings from admin settings API
    fetchLocalizationSettings();
  }, []);

  const fetchLocalizationSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.localization) {
          const newSettings = data.data.localization;
          setSettings(newSettings);
          setLocalizationSettings(newSettings);
        }
      }
    } catch (error) {
      console.error('Failed to fetch localization settings:', error);
      // Use default settings on error
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (newSettings: LocalizationSettings) => {
    setSettings(newSettings);
    setLocalizationSettings(newSettings);
  };

  const contextValue: LocalizationContextType = {
    settings,
    updateSettings,
    formatCurrency: (amount: number) => formatCurrencyWithSettings(amount, settings),
    formatDate: (date: Date | string) => formatDateWithSettings(date, settings),
    formatTime: (date: Date | string) => formatTimeWithSettings(date, settings),
    formatDateTime: (date: Date | string) => formatDateTimeWithSettings(date, settings),
    formatRelativeTime: (date: Date | string) => formatRelativeTimeWithSettings(date, settings),
    currencySymbol: getCurrencySymbol(settings.defaultCurrency),
    loading,
  };

  return (
    <LocalizationContext.Provider value={contextValue}>{children}</LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
}

// Convenience hook for currency formatting
export function useCurrency() {
  const { formatCurrency, currencySymbol } = useLocalization();
  return { formatCurrency, currencySymbol };
}

// Convenience hook for date/time formatting
export function useDateTime() {
  const { formatDate, formatTime, formatDateTime, formatRelativeTime } = useLocalization();
  return { formatDate, formatTime, formatDateTime, formatRelativeTime };
}
