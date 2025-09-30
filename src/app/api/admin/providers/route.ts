import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Provider } from '@/models/User';
import { authenticate } from '@/middleware/auth';

// Get all providers for admin review
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    await connectDB();

    // Build query
    const query: any = { role: 'provider' };
    if (status !== 'all') {
      query.verificationStatus = status;
    }

    // Get providers with pagination
    const providers = await Provider.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Provider.countDocuments(query);
    const pages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        data: providers,
        pagination: {
          page,
          limit,
          total,
          pages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get providers error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get providers' }, { status: 500 });
  }
}

// Update provider verification status
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { providerId, status, rejectionReason } = body;

    if (!providerId || !status) {
      return NextResponse.json(
        { success: false, error: 'Provider ID and status are required' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    if (status === 'rejected' && !rejectionReason) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required when rejecting' },
        { status: 400 }
      );
    }

    await connectDB();
    const provider = await Provider.findById(providerId);

    if (!provider) {
      return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 });
    }

    // Update verification status
    provider.verificationStatus = status;

    if (status === 'approved') {
      provider.verifiedAt = new Date();
      provider.rejectionReason = undefined;
      provider.isVerified = true;
    } else if (status === 'rejected') {
      provider.rejectionReason = rejectionReason;
      provider.verifiedAt = undefined;
      provider.isVerified = false;
    } else {
      provider.rejectionReason = undefined;
      provider.verifiedAt = undefined;
      provider.isVerified = false;
    }

    // Update document statuses
    provider.verificationDocuments.forEach(doc => {
      if (status === 'approved') {
        doc.status = 'approved';
        doc.reviewedBy = user._id;
        doc.reviewedAt = new Date();
      } else if (status === 'rejected') {
        doc.status = 'rejected';
        doc.reviewedBy = user._id;
        doc.reviewedAt = new Date();
      }
    });

    await provider.save();

    return NextResponse.json(
      {
        success: true,
        message: `Provider ${status} successfully`,
        data: {
          providerId: provider._id,
          verificationStatus: provider.verificationStatus,
          verifiedAt: provider.verifiedAt,
          rejectionReason: provider.rejectionReason,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update provider status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update provider status' },
      { status: 500 }
    );
  }
}
