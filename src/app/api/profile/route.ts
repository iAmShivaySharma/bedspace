import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthenticatedUser } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { logApiRequest, logError } from '@/lib/logger';
import { logUserActivity } from '@/lib/activityLogger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      logApiRequest('GET', '/api/profile', undefined, 401, Date.now() - startTime);
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const authenticatedUser = authResult.user as AuthenticatedUser;

    // Find user by ID
    const user = await User.findById(authenticatedUser.id).select('-password');

    if (!user) {
      logApiRequest('GET', '/api/profile', authenticatedUser.id, 404, Date.now() - startTime);
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    logApiRequest('GET', '/api/profile', authenticatedUser.id, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logError('Get profile error', error, {
      url: request.url,
      method: 'GET',
    });

    logApiRequest('GET', '/api/profile', undefined, 500, Date.now() - startTime);

    return NextResponse.json({ success: false, error: 'Failed to get profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      logApiRequest('PUT', '/api/profile', undefined, 401, Date.now() - startTime);
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();

    // Fields that can be updated
    const allowedFields = [
      'name',
      'phone',
      'bio',
      'location',
      'dateOfBirth',
      'businessName', // for providers
    ];

    // Filter only allowed fields
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Validate required fields
    if (
      updateData.name &&
      typeof updateData.name === 'string' &&
      updateData.name.trim().length < 2
    ) {
      return NextResponse.json(
        { success: false, error: 'Name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    if (
      updateData.phone &&
      typeof updateData.phone === 'string' &&
      !/^\+?[\d\s\-\(\)]{10,}$/.test(updateData.phone)
    ) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid phone number' },
        { status: 400 }
      );
    }

    const authenticatedUser = authResult.user as AuthenticatedUser;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      authenticatedUser.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      logApiRequest('PUT', '/api/profile', authenticatedUser.id, 404, Date.now() - startTime);
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Log profile update activity
    await logUserActivity(
      authenticatedUser.id,
      authenticatedUser.role,
      'profile_update',
      { updatedFields: Object.keys(body) },
      request
    );

    logApiRequest('PUT', '/api/profile', authenticatedUser.id, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    logError('Update profile error', error, {
      url: request.url,
      method: 'PUT',
    });

    logApiRequest('PUT', '/api/profile', undefined, 500, Date.now() - startTime);

    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
