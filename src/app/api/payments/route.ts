import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import { connectDB } from '@/lib/mongodb';
import { logApiRequest, logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    logApiRequest('GET', '/api/payments', undefined, 200, Date.now() - startTime);

    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const { user } = authResult;
    await connectDB();

    // Mock payments data - in real implementation, you'd have a Payments model
    const mockPayments = [
      {
        id: 'pay_001',
        bookingId: 'book_001',
        listing: {
          title: 'Modern Private Room with AC',
          location: 'Bandra West, Mumbai'
        },
        provider: {
          name: 'Rajesh Kumar'
        },
        amount: 90000,
        status: 'completed',
        paymentMethod: 'UPI',
        transactionId: 'TXN123456789',
        createdAt: '2024-01-15T10:30:00Z',
        completedAt: '2024-01-15T10:31:00Z',
        description: 'Security deposit + 6 months rent'
      },
      {
        id: 'pay_002',
        bookingId: 'book_002',
        listing: {
          title: 'Cozy Shared Room in Andheri',
          location: 'Andheri East, Mumbai'
        },
        provider: {
          name: 'Priya Sharma'
        },
        amount: 24000,
        status: 'pending',
        paymentMethod: 'Bank Transfer',
        createdAt: '2024-01-20T14:15:00Z',
        description: 'Security deposit + 3 months rent'
      },
      {
        id: 'pay_003',
        bookingId: 'book_003',
        listing: {
          title: 'Luxury Studio Apartment',
          location: 'Powai, Mumbai'
        },
        provider: {
          name: 'Amit Patel'
        },
        amount: 50000,
        status: 'failed',
        paymentMethod: 'Credit Card',
        createdAt: '2024-01-18T09:20:00Z',
        description: 'Security deposit + 2 months rent'
      },
      {
        id: 'pay_004',
        bookingId: 'book_004',
        listing: {
          title: 'Budget Room in Thane',
          location: 'Thane West, Mumbai'
        },
        provider: {
          name: 'Sunita Joshi'
        },
        amount: 15000,
        status: 'refunded',
        paymentMethod: 'UPI',
        transactionId: 'TXN987654321',
        createdAt: '2024-01-10T16:45:00Z',
        completedAt: '2024-01-12T11:20:00Z',
        description: 'Booking cancellation refund'
      }
    ];

    // Filter payments by user role
    let filteredPayments = mockPayments;
    if (user.role !== 'admin') {
      // In real implementation, filter by user ID
      filteredPayments = mockPayments;
    }

    const responseTime = Date.now() - startTime;
    console.log(`✅ GET /api/payments completed in ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      data: filteredPayments
    });

  } catch (error) {
    logError('Error in GET /api/payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
