import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
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

    if (user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    await connectDB();

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const totalProviders = await User.countDocuments({ role: 'provider' });
    const totalSeekers = await User.countDocuments({ role: 'seeker' });

    // Get provider verification stats
    const pendingProviders = await User.countDocuments({
      role: 'provider',
      verificationStatus: 'pending',
    });
    const approvedProviders = await User.countDocuments({
      role: 'provider',
      verificationStatus: 'approved',
    });
    const rejectedProviders = await User.countDocuments({
      role: 'provider',
      verificationStatus: 'rejected',
    });

    // Mock data for listings and bookings (in production, these would come from actual collections)
    const totalListings = Math.floor(Math.random() * 500) + 200; // 200-700
    const activeListings = Math.floor(totalListings * 0.7); // ~70% active
    const totalBookings = Math.floor(Math.random() * 1000) + 500; // 500-1500
    const revenue = Math.floor(Math.random() * 5000000) + 1000000; // 1M-6M

    const stats = {
      totalUsers,
      totalProviders,
      totalSeekers,
      pendingProviders,
      approvedProviders,
      rejectedProviders,
      totalListings,
      activeListings,
      totalBookings,
      revenue,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get admin statistics' },
      { status: 500 }
    );
  }
}
