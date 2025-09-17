import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import { logApiRequest, logError } from '@/lib/logger';

// Mock notifications data - in production this would come from a Notifications collection
const generateMockNotifications = (userId: string, userRole: string) => {
  const notifications = [
    {
      id: '1',
      title: 'Welcome to BedSpace!',
      message: 'Your account has been successfully created. Start exploring available bed spaces.',
      type: 'info',
      category: 'system',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    },
    {
      id: '2',
      title: 'Profile Verification',
      message: 'Please complete your profile verification to access all features.',
      type: 'warning',
      category: 'verification',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    {
      id: '3',
      title: 'New Message',
      message: 'You have received a new message from a property provider.',
      type: 'info',
      category: 'message',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    }
  ];

  // Add role-specific notifications
  if (userRole === 'provider') {
    notifications.push(
      {
        id: '4',
        title: 'Listing Approved',
        message: 'Your bed space listing "Cozy Room in Bandra" has been approved and is now live.',
        type: 'success',
        category: 'listing',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
      },
      {
        id: '5',
        title: 'New Booking Request',
        message: 'You have received a new booking request for your property.',
        type: 'info',
        category: 'booking',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
      }
    );
  } else if (userRole === 'seeker') {
    notifications.push(
      {
        id: '4',
        title: 'Booking Confirmed',
        message: 'Your booking for "Modern Studio in Andheri" has been confirmed.',
        type: 'success',
        category: 'booking',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
      },
      {
        id: '5',
        title: 'Payment Due',
        message: 'Your payment for the upcoming booking is due in 2 days.',
        type: 'warning',
        category: 'payment',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
      }
    );
  } else if (userRole === 'admin') {
    notifications.push(
      {
        id: '4',
        title: 'New Provider Registration',
        message: 'A new provider has registered and requires verification.',
        type: 'info',
        category: 'verification',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
      },
      {
        id: '5',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur tonight from 2 AM to 4 AM.',
        type: 'warning',
        category: 'system',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      }
    );
  }

  return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      logApiRequest('GET', '/api/notifications', undefined, 401, Date.now() - startTime);
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // all, read, unread
    const category = searchParams.get('category') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Generate mock notifications based on user
    let notifications = generateMockNotifications(authResult.user.id, authResult.user.role);

    // Apply filters
    if (filter === 'read') {
      notifications = notifications.filter(n => n.isRead);
    } else if (filter === 'unread') {
      notifications = notifications.filter(n => !n.isRead);
    }

    if (category !== 'all') {
      notifications = notifications.filter(n => n.category === category);
    }

    // Apply limit
    notifications = notifications.slice(0, limit);

    logApiRequest('GET', '/api/notifications', authResult.user.id, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: notifications,
      total: notifications.length
    });

  } catch (error) {
    logError('Get notifications error', error, { 
      url: request.url,
      method: 'GET'
    });
    
    logApiRequest('GET', '/api/notifications', undefined, 500, Date.now() - startTime);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get notifications' },
      { status: 500 }
    );
  }
}
