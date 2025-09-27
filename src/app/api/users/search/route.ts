import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthenticatedUser } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { logApiRequest, logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      logApiRequest('GET', '/api/users/search', undefined, 401, Date.now() - startTime);
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    }

    const user = authResult.user as AuthenticatedUser;
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Search users by name or email
    const searchRegex = new RegExp(query.trim(), 'i');
    const users = await User.find({
      $and: [
        {
          $or: [{ name: { $regex: searchRegex } }, { email: { $regex: searchRegex } }],
        },
        { _id: { $ne: user.id } }, // Exclude current user
      ],
    })
      .select('name email role avatar isVerified verificationStatus')
      .limit(limit)
      .lean();

    const transformedUsers = users.map((u: any) => ({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      isVerified: u.isVerified,
    }));

    logApiRequest('GET', '/api/users/search', user.id, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: transformedUsers,
    });
  } catch (error) {
    logError('Error in GET /api/users/search:', error);
    logApiRequest('GET', '/api/users/search', undefined, 500, Date.now() - startTime);
    return NextResponse.json({ success: false, error: 'Failed to search users' }, { status: 500 });
  }
}
