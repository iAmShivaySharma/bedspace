import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { generateToken } from '@/utils/auth';
import { sendWelcomeEmail } from '@/utils/email';
import { otpSchema } from '@/utils/validation';
import { rateLimit } from '@/middleware/auth';
import { getClientIp } from '@/utils/ipExtractor';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (max 5 OTP verification attempts per IP per hour)
    const rateLimitResponse = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5,
      keyGenerator: req => getClientIp(req),
    })(request);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

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
          error: 'Invalid verification code or user information',
        },
        { status: 400 }
      );
    }

    // Check if user is locked out from too many failed OTP attempts
    if (user.otpLockoutUntil && user.otpLockoutUntil > new Date()) {
      const lockoutRemaining = Math.ceil((user.otpLockoutUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        {
          success: false,
          error: `Account temporarily locked. Please try again in ${lockoutRemaining} minutes.`,
        },
        { status: 429 }
      );
    }

    // Check if OTP is valid and not expired
    if (!user.emailVerificationToken || user.emailVerificationToken !== otp) {
      // Increment failed attempts
      const failedAttempts = (user.failedOtpAttempts || 0) + 1;
      user.failedOtpAttempts = failedAttempts;

      // Lock account if too many failed attempts (5 attempts = 30 min lockout)
      if (failedAttempts >= 5) {
        user.otpLockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }

      await user.save();

      return NextResponse.json(
        {
          success: false,
          error:
            failedAttempts >= 5
              ? 'Too many failed attempts. Account temporarily locked for 30 minutes.'
              : `Invalid verification code. ${5 - failedAttempts} attempts remaining.`,
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

    // Mark email as verified and reset failed attempts
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.otpExpiry = undefined;
    user.failedOtpAttempts = 0;
    user.otpLockoutUntil = undefined;

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
