// Localization utilities for currency and timezone formatting

export interface LocalizationSettings {
  defaultCurrency: string;
  currencySymbol: string;
  defaultTimezone: string;
  dateFormat: string;
  timeFormat: string;
  supportedCurrencies: string[];
}

// Default settings (fallback)
export const DEFAULT_LOCALIZATION: LocalizationSettings = {
  defaultCurrency: 'INR',
  currencySymbol: '₹',
  defaultTimezone: 'Asia/Kolkata',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12',
  supportedCurrencies: ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'JPY'],
};

// Currency symbols mapping
export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  JPY: '¥',
};

// Global localization settings (can be overridden by admin settings)
let currentLocalization: LocalizationSettings = DEFAULT_LOCALIZATION;

export function setLocalizationSettings(settings: LocalizationSettings) {
  currentLocalization = settings;
}

export function getLocalizationSettings(): LocalizationSettings {
  return currentLocalization;
}

export function formatCurrencyWithSettings(
  amount: number,
  settings?: Partial<LocalizationSettings>
): string {
  const { defaultCurrency, currencySymbol } = { ...currentLocalization, ...settings };

  try {
    // Use Intl.NumberFormat for proper currency formatting
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: defaultCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return formatter.format(amount);
  } catch (error) {
    // Fallback to manual formatting if currency is not supported by Intl
    return `${currencySymbol}${amount.toLocaleString()}`;
  }
}

export function formatDateWithSettings(
  date: Date | string,
  settings?: Partial<LocalizationSettings>
): string {
  const { dateFormat, defaultTimezone } = { ...currentLocalization, ...settings };
  const targetDate = new Date(date);

  try {
    // Convert to target timezone
    const zonedDate = new Date(targetDate.toLocaleString('en-US', { timeZone: defaultTimezone }));

    // Format according to the specified format
    switch (dateFormat) {
      case 'DD/MM/YYYY':
        return zonedDate.toLocaleDateString('en-GB');
      case 'MM/DD/YYYY':
        return zonedDate.toLocaleDateString('en-US');
      case 'YYYY-MM-DD':
        return zonedDate.toISOString().split('T')[0];
      case 'DD-MM-YYYY':
        return zonedDate.toLocaleDateString('en-GB').replace(/\//g, '-');
      case 'DD.MM.YYYY':
        return zonedDate.toLocaleDateString('en-GB').replace(/\//g, '.');
      default:
        return zonedDate.toLocaleDateString('en-GB');
    }
  } catch (error) {
    // Fallback to default formatting
    return new Date(date).toLocaleDateString('en-GB');
  }
}

export function formatTimeWithSettings(
  date: Date | string,
  settings?: Partial<LocalizationSettings>
): string {
  const { timeFormat, defaultTimezone } = { ...currentLocalization, ...settings };
  const targetDate = new Date(date);

  try {
    // Convert to target timezone
    const timeOptions: Intl.DateTimeFormatOptions = {
      timeZone: defaultTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: timeFormat === '12',
    };

    return targetDate.toLocaleTimeString('en-US', timeOptions);
  } catch (error) {
    // Fallback to default formatting
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: timeFormat === '12',
    });
  }
}

export function formatDateTimeWithSettings(
  date: Date | string,
  settings?: Partial<LocalizationSettings>
): string {
  const formattedDate = formatDateWithSettings(date, settings);
  const formattedTime = formatTimeWithSettings(date, settings);
  return `${formattedDate} ${formattedTime}`;
}

export function formatRelativeTimeWithSettings(
  date: Date | string,
  settings?: Partial<LocalizationSettings>
): string {
  const { defaultTimezone } = { ...currentLocalization, ...settings };
  const now = new Date();
  const targetDate = new Date(date);

  try {
    // Convert both dates to the same timezone for accurate comparison
    const nowInTimezone = new Date(now.toLocaleString('en-US', { timeZone: defaultTimezone }));
    const targetInTimezone = new Date(
      targetDate.toLocaleString('en-US', { timeZone: defaultTimezone })
    );

    const diffInSeconds = Math.floor((nowInTimezone.getTime() - targetInTimezone.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    }

    return formatDateWithSettings(date, settings);
  } catch (error) {
    // Fallback to existing relative time function
    return formatDateWithSettings(date, settings);
  }
}

export function getCurrencySymbol(currencyCode?: string): string {
  const currency = currencyCode || currentLocalization.defaultCurrency;
  return CURRENCY_SYMBOLS[currency] || currency;
}

export function getSupportedCurrencies(): string[] {
  return currentLocalization.supportedCurrencies;
}

export function getTimezoneOffset(timezone?: string): string {
  const tz = timezone || currentLocalization.defaultTimezone;
  try {
    const now = new Date();
    const offset = now
      .toLocaleString('en-US', {
        timeZone: tz,
        timeZoneName: 'short',
      })
      .split(' ')
      .pop();
    return offset || 'UTC';
  } catch (error) {
    return 'UTC';
  }
}

// Validation functions
export function isValidCurrency(currency: string): boolean {
  return Object.keys(CURRENCY_SYMBOLS).includes(currency);
}

export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}
