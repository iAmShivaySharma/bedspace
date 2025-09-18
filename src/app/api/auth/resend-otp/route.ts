import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { generateOTP } from '@/utils/auth';
import { sendOTPEmail } from '@/utils/email';
import { z } from 'zod';

const resendOtpSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    
    // Validate input
    const validationResult = resendOtpSchema.safeParse(body);
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

    const { identifier } = validationResult.data;

    // Find user by email or phone
    const isEmail = identifier.includes('@');
    const user = await User.findOne(
      isEmail ? { email: identifier } : { phone: identifier }
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Check if email is already verified
    if (user.isEmailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email is already verified',
        },
        { status: 400 }
      );
    }

    // Check rate limiting (prevent spam)
    const lastOtpTime = user.otpExpiry ? new Date(user.otpExpiry.getTime() - 10 * 60 * 1000) : null;
    const now = new Date();
    const timeSinceLastOtp = lastOtpTime ? now.getTime() - lastOtpTime.getTime() : Infinity;
    const minInterval = 60 * 1000; // 1 minute

    if (timeSinceLastOtp < minInterval) {
      const remainingTime = Math.ceil((minInterval - timeSinceLastOtp) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `Please wait ${remainingTime} seconds before requesting another OTP`,
        },
        { status: 429 }
      );
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with new OTP
    user.emailVerificationToken = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(user.email, otp, user.name);
    if (!emailSent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send OTP email. Please try again.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'OTP sent successfully',
        data: {
          email: user.email,
          expiresAt: otpExpiry,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to resend OTP. Please try again.',
      },
      { status: 500 }
    );
  }
}
