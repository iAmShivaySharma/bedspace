import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { generateToken } from '@/utils/auth';
import { sendWelcomeEmail } from '@/utils/email';
import { otpSchema } from '@/utils/validation';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate input
    const validationResult = otpSchema.safeParse(body);
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

    const { otp, identifier } = validationResult.data;

    // Find user by email or phone
    const isEmail = identifier.includes('@');
    const user = await User.findOne(isEmail ? { email: identifier } : { phone: identifier });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Check if OTP is valid and not expired
    if (!user.emailVerificationToken || user.emailVerificationToken !== otp) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid OTP',
        },
        { status: 400 }
      );
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'OTP has expired',
        },
        { status: 400 }
      );
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.otpExpiry = undefined;

    // Update overall verification status
    const userWithVerification = user as any; // Type assertion for verificationStatus
    user.isVerified =
      user.isEmailVerified &&
      (user.role !== 'provider' || userWithVerification.verificationStatus === 'approved');

    await user.save();

    // Send welcome email
    const emailSent = await sendWelcomeEmail(user.email, user.name);
    if (!emailSent) {
      console.error('Failed to send welcome email');
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

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
      createdAt: user.createdAt,
    };

    // Add provider-specific data if user is a provider
    if (user.role === 'provider') {
      const providerData = user as any; // Type assertion for provider-specific properties
      const userDataExtended = userData as any; // Type assertion for userData
      userDataExtended.verificationStatus = providerData.verificationStatus;
      userDataExtended.businessName = providerData.businessName;
      userDataExtended.rating = providerData.rating;
      userDataExtended.totalReviews = providerData.totalReviews;
      userDataExtended.totalListings = providerData.totalListings;
    }

    // Create response with cookie
    const response = NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully',
        data: {
          user: userData,
        },
      },
      { status: 200 }
    );

    // Set httpOnly cookie with the token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'OTP verification failed. Please try again.',
      },
      { status: 500 }
    );
  }
}
