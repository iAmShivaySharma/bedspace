import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Activity from '@/models/Activity';
import { logApiRequest, logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify admin authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || authResult.user?.role !== 'admin') {
      logApiRequest('GET', '/api/admin/reports', authResult.user?.id, 401, Date.now() - startTime);
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get user reports
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) }
    });
    const activeUsers = await User.countDocuments({ isActive: { $ne: false } });
    
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          role: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Mock listing reports (in production, this would come from Listings collection)
    const totalListings = Math.floor(totalUsers * 0.4); // 40% of users have listings
    const activeListings = Math.floor(totalListings * 0.8); // 80% are active
    const pendingApproval = Math.floor(totalListings * 0.1); // 10% pending
    const averagePrice = 12500;
    
    const listingsByLocation = [
      { location: 'Bandra West, Mumbai', count: Math.floor(totalListings * 0.15) },
      { location: 'Andheri East, Mumbai', count: Math.floor(totalListings * 0.12) },
      { location: 'Powai, Mumbai', count: Math.floor(totalListings * 0.10) },
      { location: 'Thane West, Mumbai', count: Math.floor(totalListings * 0.08) },
      { location: 'Worli, Mumbai', count: Math.floor(totalListings * 0.07) },
      { location: 'Malad West, Mumbai', count: Math.floor(totalListings * 0.06) }
    ];

    // Mock booking reports (in production, this would come from Bookings collection)
    const totalBookings = Math.floor(totalUsers * 0.25); // 25% of users have bookings
    const completedBookings = Math.floor(totalBookings * 0.7); // 70% completed
    const totalRevenue = completedBookings * averagePrice * 15; // Average 15 days per booking
    const averageBookingValue = totalRevenue / totalBookings;

    // Generate monthly booking data
    const bookingsByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const bookingCount = Math.floor(totalBookings / 6 * (0.8 + Math.random() * 0.4));
      const monthRevenue = bookingCount * averagePrice * 15;
      
      bookingsByMonth.push({
        month: monthName,
        count: bookingCount,
        revenue: monthRevenue
      });
    }

    // Get activity reports
    const totalActivities = await Activity.countDocuments({
      createdAt: { $gte: startDate }
    });

    const topActions = await Activity.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          action: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Generate daily activity data
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayActivities = await Activity.countDocuments({
        createdAt: { $gte: dayStart, $lt: dayEnd }
      });
      
      dailyActivity.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: dayActivities
      });
    }

    const reportData = {
      userReports: {
        totalUsers,
        newUsersThisMonth,
        activeUsers,
        usersByRole
      },
      listingReports: {
        totalListings,
        activeListings,
        pendingApproval,
        averagePrice,
        listingsByLocation
      },
      bookingReports: {
        totalBookings,
        completedBookings,
        totalRevenue,
        averageBookingValue,
        bookingsByMonth
      },
      activityReports: {
        totalActivities,
        topActions,
        dailyActivity
      }
    };

    logApiRequest('GET', '/api/admin/reports', authResult.user.id, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    logError('Get reports error', error, { 
      url: request.url,
      method: 'GET'
    });
    
    logApiRequest('GET', '/api/admin/reports', undefined, 500, Date.now() - startTime);
    
    return NextResponse.json(
      { success: false, error: 'Failed to generate reports' },
      { status: 500 }
    );
  }
}
