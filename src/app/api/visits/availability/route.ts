import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Visit } from '@/models/Visit';
import { logApiRequest, logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const date = searchParams.get('date');

    if (!providerId || !date) {
      return NextResponse.json(
        { success: false, error: 'Provider ID and date are required' },
        { status: 400 }
      );
    }

    // Validate date format
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid date format' }, { status: 400 });
    }

    // Check if date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      return NextResponse.json(
        { success: false, error: 'Date must be in the future' },
        { status: 400 }
      );
    }

    // Get available time slots
    const availableSlots = await (Visit as any).getAvailableTimeSlots(providerId, selectedDate);

    logApiRequest('GET', '/api/visits/availability', undefined, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: availableSlots,
    });
  } catch (error) {
    logError('Error in GET /api/visits/availability:', error);
    logApiRequest('GET', '/api/visits/availability', undefined, 500, Date.now() - startTime);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch available time slots' },
      { status: 500 }
    );
  }
}
