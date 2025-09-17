import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string; action: string } }
) {
  try {
    const { user, error } = await authenticate(request);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const { userId, action } = params;

    // Find the target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admin from deactivating themselves
    if (action === 'deactivate' && userId === user._id) {
      return NextResponse.json(
        { success: false, error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'activate':
        // In production, you would have an isActive field
        message = 'User activated successfully';
        break;

      case 'deactivate':
        // In production, you would set isActive: false
        message = 'User deactivated successfully';
        break;

      case 'verify':
        updateData.isVerified = true;
        message = 'User verified successfully';
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update user if there's data to update
    if (Object.keys(updateData).length > 0) {
      await User.findByIdAndUpdate(userId, updateData);
    }

    // Log the admin action (in production, you'd save this to an audit log)
    console.log(`Admin ${user.email} performed ${action} on user ${targetUser.email}`);

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('User action error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform user action' },
      { status: 500 }
    );
  }
}
