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
      const providerData = user as any; // Type assertion for provider-specific properties
      const userDataExtended = userData as any; // Type assertion for userData
      userDataExtended.verificationStatus = providerData.verificationStatus;
      userDataExtended.verificationDocuments = providerData.verificationDocuments;
      userDataExtended.businessName = providerData.businessName;
      userDataExtended.businessAddress = providerData.businessAddress;
      userDataExtended.businessPhone = providerData.businessPhone;
      userDataExtended.rating = providerData.rating;
      userDataExtended.totalReviews = providerData.totalReviews;
      userDataExtended.totalListings = providerData.totalListings;
      userDataExtended.verifiedAt = providerData.verifiedAt;
      userDataExtended.rejectionReason = providerData.rejectionReason;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: userData,
        },
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
