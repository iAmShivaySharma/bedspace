import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { Settings } from '@/models/Settings';
import { logApiRequest, logError } from '@/lib/logger';
import { logAdminActivity } from '@/lib/activityLogger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Authenticate user
    const { user, error } = await authenticate(request);
    if (error || !user) {
      logApiRequest('GET', '/api/admin/settings', undefined, 401, Date.now() - startTime);
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      logApiRequest('GET', '/api/admin/settings', user._id, 403, Date.now() - startTime);
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    await connectDB();

    // Get settings from database
    const settings = await (Settings as any).getSettings();

    logApiRequest('GET', '/api/admin/settings', user._id, 200, Date.now() - startTime);

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
    // Authenticate user
    const { user, error } = await authenticate(request);
    if (error || !user) {
      logApiRequest('PUT', '/api/admin/settings', undefined, 401, Date.now() - startTime);
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      logApiRequest('PUT', '/api/admin/settings', user._id, 403, Date.now() - startTime);
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();

    // Validate critical settings if provided
    if (body.security?.passwordMinLength && body.security.passwordMinLength < 6) {
      return NextResponse.json(
        { success: false, error: 'Password minimum length must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (body.booking?.minBookingDuration && body.booking.minBookingDuration < 1) {
      return NextResponse.json(
        { success: false, error: 'Minimum booking duration must be at least 1 day' },
        { status: 400 }
      );
    }

    if (
      body.booking?.maxBookingDuration &&
      body.booking?.minBookingDuration &&
      body.booking.maxBookingDuration < body.booking.minBookingDuration
    ) {
      return NextResponse.json(
        { success: false, error: 'Maximum booking duration must be greater than minimum' },
        { status: 400 }
      );
    }

    // Update settings in database
    const updatedSettings = await (Settings as any).updateSettings(body);

    // Log admin activity
    await logAdminActivity(user._id, 'settings_updated', {
      sections: Object.keys(body),
      changes: body,
    });

    logApiRequest('PUT', '/api/admin/settings', user._id, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully',
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
