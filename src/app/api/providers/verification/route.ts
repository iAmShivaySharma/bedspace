import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Provider } from '@/models/User';
import { authenticate } from '@/middleware/auth';
import { providerVerificationSchema } from '@/utils/validation';

// Get provider verification status
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.role !== 'provider') {
      return NextResponse.json(
        { success: false, error: 'Provider access required' },
        { status: 403 }
      );
    }

    await connectDB();
    const provider = await Provider.findById(user._id);

    if (!provider) {
      return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          verificationStatus: provider.verificationStatus,
          verificationDocuments: provider.verificationDocuments,
          businessName: provider.businessName,
          businessAddress: provider.businessAddress,
          businessPhone: provider.businessPhone,
          rejectionReason: provider.rejectionReason,
          verifiedAt: provider.verifiedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get verification status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get verification status' },
      { status: 500 }
    );
  }
}

// Update provider verification information
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.role !== 'provider') {
      return NextResponse.json(
        { success: false, error: 'Provider access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = providerVerificationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { businessName, businessAddress, businessPhone } = validationResult.data;

    await connectDB();
    const provider = await Provider.findById(user._id);

    if (!provider) {
      return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 });
    }

    // Update provider information
    if (businessName) provider.businessName = businessName;
    if (businessAddress) provider.businessAddress = businessAddress;
    if (businessPhone) provider.businessPhone = businessPhone;

    await provider.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Provider information updated successfully',
        data: {
          verificationStatus: provider.verificationStatus,
          businessName: provider.businessName,
          businessAddress: provider.businessAddress,
          businessPhone: provider.businessPhone,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update provider verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update provider information' },
      { status: 500 }
    );
  }
}
