import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import { logApiRequest, logError } from '@/lib/logger';
import { logAdminActivity } from '@/lib/activityLogger';

// Default platform settings
const DEFAULT_SETTINGS = {
  general: {
    platformName: 'BedSpace',
    platformDescription: 'Find comfortable and affordable bed spaces in Mumbai',
    supportEmail: 'support@bedspace.com',
    maintenanceMode: false,
    registrationEnabled: true,
  },
  booking: {
    maxBookingDuration: 365, // days
    minBookingDuration: 1, // days
    cancellationPolicy:
      'Free cancellation up to 24 hours before check-in. After that, 50% refund for cancellations made up to 7 days before check-in.',
    autoApprovalEnabled: false,
    bookingFee: 5.0, // percentage
  },
  verification: {
    autoVerifyProviders: false,
    requiredDocuments: ['Aadhaar Card', 'PAN Card', 'Property Documents', 'Photo'],
    verificationTimeout: 7, // days
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    adminAlerts: true,
  },
  security: {
    passwordMinLength: 8,
    sessionTimeout: 1440, // minutes (24 hours)
    maxLoginAttempts: 5,
    twoFactorRequired: false,
  },
  localization: {
    defaultCurrency: 'INR',
    currencySymbol: '₹',
    defaultTimezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12',
    supportedCurrencies: ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'JPY'],
  },
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify admin authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.user?.role !== 'admin') {
      logApiRequest('GET', '/api/admin/settings', authResult.user?.id, 401, Date.now() - startTime);
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 401 });
    }

    await connectDB();

    // In production, this would come from a Settings collection
    // For now, return default settings
    const settings = DEFAULT_SETTINGS;

    logApiRequest('GET', '/api/admin/settings', authResult.user.id, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logError('Get settings error', error, {
      url: request.url,
      method: 'GET',
    });

    logApiRequest('GET', '/api/admin/settings', undefined, 500, Date.now() - startTime);

    return NextResponse.json({ success: false, error: 'Failed to get settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify admin authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.user?.role !== 'admin') {
      logApiRequest('PUT', '/api/admin/settings', authResult.user?.id, 401, Date.now() - startTime);
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();

    // Validate settings structure
    const requiredSections = [
      'general',
      'booking',
      'verification',
      'notifications',
      'security',
      'localization',
    ];
    for (const section of requiredSections) {
      if (!body[section]) {
        return NextResponse.json(
          { success: false, error: `Missing ${section} settings` },
          { status: 400 }
        );
      }
    }

    // Validate specific settings
    if (body.security.passwordMinLength < 6) {
      return NextResponse.json(
        { success: false, error: 'Password minimum length must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (body.booking.minBookingDuration < 1) {
      return NextResponse.json(
        { success: false, error: 'Minimum booking duration must be at least 1 day' },
        { status: 400 }
      );
    }

    if (body.booking.maxBookingDuration < body.booking.minBookingDuration) {
      return NextResponse.json(
        { success: false, error: 'Maximum booking duration must be greater than minimum' },
        { status: 400 }
      );
    }

    // Validate localization settings
    if (!body.localization.defaultCurrency) {
      return NextResponse.json(
        { success: false, error: 'Default currency is required' },
        { status: 400 }
      );
    }

    if (!body.localization.currencySymbol) {
      return NextResponse.json(
        { success: false, error: 'Currency symbol is required' },
        { status: 400 }
      );
    }

    if (!body.localization.defaultTimezone) {
      return NextResponse.json(
        { success: false, error: 'Default timezone is required' },
        { status: 400 }
      );
    }

    // In production, save to Settings collection
    // For now, just log the activity
    await logAdminActivity(authResult.user.id, 'settings_update', undefined, undefined, request);

    logApiRequest('PUT', '/api/admin/settings', authResult.user.id, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: body,
    });
  } catch (error) {
    logError('Update settings error', error, {
      url: request.url,
      method: 'PUT',
    });

    logApiRequest('PUT', '/api/admin/settings', undefined, 500, Date.now() - startTime);

    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
