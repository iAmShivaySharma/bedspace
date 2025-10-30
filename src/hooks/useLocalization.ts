import { useGetPublicSettingsQuery } from '@/lib/api/commonApi';
import {
  LocalizationSettings,
  DEFAULT_LOCALIZATION,
  formatCurrencyWithSettings,
  formatDateWithSettings,
  formatTimeWithSettings,
  formatDateTimeWithSettings,
  formatRelativeTimeWithSettings,
  getCurrencySymbol,
} from '@/lib/localization';

export function useLocalization() {
  const { data: settingsData, isLoading } = useGetPublicSettingsQuery();

  const settings: LocalizationSettings = settingsData?.data?.localization || DEFAULT_LOCALIZATION;

  return {
    settings,
    loading: isLoading,
    formatCurrency: (amount: number) => formatCurrencyWithSettings(amount, settings),
    formatDate: (date: Date | string) => formatDateWithSettings(date, settings),
    formatTime: (date: Date | string) => formatTimeWithSettings(date, settings),
    formatDateTime: (date: Date | string) => formatDateTimeWithSettings(date, settings),
    formatRelativeTime: (date: Date | string) => formatRelativeTimeWithSettings(date, settings),
    currencySymbol: getCurrencySymbol(settings.defaultCurrency),
  };
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
