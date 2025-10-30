import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Settings } from '@/models/Settings';
import { logApiRequest, logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    await connectDB();

    // Get public settings from database - no authentication required
    const publicSettings = await (Settings as any).getPublicSettings();

    logApiRequest('GET', '/api/settings', undefined, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: publicSettings,
    });
  } catch (error) {
    logError('Get public settings error', error, {
      url: request.url,
      method: 'GET',
    });

    logApiRequest('GET', '/api/settings', undefined, 500, Date.now() - startTime);

    return NextResponse.json({ success: false, error: 'Failed to get settings' }, { status: 500 });
  }
}
