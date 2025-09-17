import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await authenticate(request);

    if (error || !user) {
      return NextResponse.json(
        {
          success: false,
          error: error || 'Authentication required',
        },
        { status: 401 }
      );
    }

    // Prepare user data (exclude sensitive information)
    const userData = {
      _id: user._id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Add provider-specific data if user is a provider
    if (user.role === 'provider') {
      userData.verificationStatus = user.verificationStatus;
      userData.verificationDocuments = user.verificationDocuments;
      userData.businessName = user.businessName;
      userData.businessAddress = user.businessAddress;
      userData.businessPhone = user.businessPhone;
      userData.rating = user.rating;
      userData.totalReviews = user.totalReviews;
      userData.totalListings = user.totalListings;
      userData.verifiedAt = user.verifiedAt;
      userData.rejectionReason = user.rejectionReason;
    }

    return NextResponse.json(
      {
        success: true,
        data: userData,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get user profile',
      },
      { status: 500 }
    );
  }
}
