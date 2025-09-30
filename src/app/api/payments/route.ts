import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { Payment } from '@/models/Payment';
import { logApiRequest, logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      logApiRequest('GET', '/api/payments', undefined, 401, Date.now() - startTime);
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const role = searchParams.get('role') || 'any'; // payer, payee, any
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    const user = authResult.user as { id: string; role: string };
    const skip = (page - 1) * limit;

    let payments;

    if (user.role === 'admin') {
      // Admin can see all payments
      const query: any = {};
      if (status !== 'all') {
        query.status = status;
      }

      payments = await Payment.find(query)
        .populate('bookingId', 'status requestedDate')
        .populate('listingId', 'title address city')
        .populate('payerId', 'name email')
        .populate('payeeId', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
    } else {
      // Users can only see their own payments
      payments = await (Payment as any).getUserPayments(
        user.id,
        role as 'payer' | 'payee' | 'any',
        {
          status: status !== 'all' ? status : undefined,
          limit,
          skip,
        }
      );
    }

    // Transform payments to match expected format
    const transformedPayments = payments.map((payment: any) => ({
      id: payment._id,
      bookingId: payment.bookingId._id || payment.bookingId,
      listing: {
        title: payment.listingId.title,
        location: `${payment.listingId.address}, ${payment.listingId.city}`,
      },
      payer: {
        name: payment.payerId.name,
        email: payment.payerId.email,
      },
      payee: {
        name: payment.payeeId.name,
        email: payment.payeeId.email,
      },
      amount: payment.amount,
      formattedAmount: payment.formattedAmount,
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      description: payment.description,
      metadata: payment.metadata,
      createdAt: payment.createdAt.toISOString(),
      processedAt: payment.processedAt?.toISOString(),
      completedAt: payment.completedAt?.toISOString(),
      failureReason: payment.failureReason,
    }));

    logApiRequest('GET', '/api/payments', user.id, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: transformedPayments,
      pagination: {
        page,
        limit,
        total: transformedPayments.length,
      },
    });
  } catch (error) {
    logError('Error in GET /api/payments:', error);
    logApiRequest('GET', '/api/payments', undefined, 500, Date.now() - startTime);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { bookingId, payeeId, listingId, amount, paymentMethod, description, metadata } = body;

    if (!bookingId || !payeeId || !listingId || !amount || !paymentMethod || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment fields' },
        { status: 400 }
      );
    }

    const user = authResult.user as { id: string };

    // Create payment
    const payment = await (Payment as any).createPayment(
      bookingId,
      user.id, // payer
      payeeId,
      listingId,
      amount,
      paymentMethod,
      description,
      metadata
    );

    logApiRequest('POST', '/api/payments', user.id, 201, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        description: payment.description,
        createdAt: payment.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logError('Error in POST /api/payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
