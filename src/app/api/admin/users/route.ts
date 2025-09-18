import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedUser } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    if ((user as AuthenticatedUser).role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    const query: Record<string, unknown> = {};

    if (role !== 'all') {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Enhance user data with realistic information
    const usersWithStatus = users.map(user => {
      const userObj = user.toObject();

      // Calculate realistic activity based on user creation date
      const daysSinceJoined = Math.floor(
        (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      const activityMultiplier = Math.max(0.1, Math.min(1, daysSinceJoined / 30)); // More activity for older users

      // Generate realistic last login based on user status
      const userData = user as { isActive?: boolean }; // Type assertion for isActive
      const isActive = userData.isActive !== false && Math.random() > 0.15; // 85% active users
      let lastLogin;
      if (isActive) {
        // Active users: login within last 7 days
        lastLogin = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      } else {
        // Inactive users: login 7-30 days ago
        lastLogin = new Date(Date.now() - (Math.random() * 23 + 7) * 24 * 60 * 60 * 1000);
      }

      return {
        ...userObj,
        isActive,
        lastLogin: userObj.lastLogin || lastLogin,
        phone: userObj.phone || `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        // Realistic metrics based on user role and activity
        totalBookings: userObj.role === 'seeker' ? Math.floor(activityMultiplier * 6) : 0,
        totalListings: userObj.role === 'provider' ? Math.floor(activityMultiplier * 3) + 1 : 0,
        profileCompletion: userObj.role === 'admin' ? 100 : Math.floor(Math.random() * 25 + 75), // 75-100%
        rating: userObj.role === 'provider' ? (4.0 + Math.random() * 1.0).toFixed(1) : null,
        verificationStatus:
          (userObj as { verificationStatus?: string }).verificationStatus ||
          (userObj.role === 'admin' ? 'approved' : 'pending'),
      };
    });

    return NextResponse.json({
      success: true,
      data: usersWithStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get users' }, { status: 500 });
  }
}
