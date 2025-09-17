import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User, Provider } from '@/models/User';
import { hashPassword, generateOTP } from '@/utils/auth';
import { sendOTPEmail } from '@/utils/email';
import { registerSchema } from '@/utils/validation';
import { USER_ROLES } from '@/constants';
import { logApiRequest, logError } from '@/lib/logger';
import { logAuthActivity } from '@/lib/activityLogger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    await connectDB();

    const body = await request.json();
    
    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      logApiRequest('POST', '/api/auth/register', undefined, 400, Date.now() - startTime);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, email, phone, role, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email },
        ...(phone ? [{ phone }] : []),
      ],
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: existingUser.email === email 
            ? 'Email already registered' 
            : 'Phone number already registered',
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user data
    const userData = {
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      emailVerificationToken: otp,
      otpExpiry,
      isEmailVerified: false,
      isPhoneVerified: false,
      isVerified: false,
    };

    // Create user based on role
    let user;
    if (role === USER_ROLES.PROVIDER) {
      user = new Provider({
        ...userData,
        verificationStatus: 'pending',
        verificationDocuments: [],
        rating: 0,
        totalReviews: 0,
        totalListings: 0,
      });
    } else {
      user = new User(userData);
    }

    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, name);
    if (!emailSent) {
      console.error('Failed to send OTP email');
      // Don't fail registration if email fails, user can resend OTP
    }

    // Log successful registration
    await logAuthActivity(user._id.toString(), user.role, 'register', request);
    logApiRequest('POST', '/api/auth/register', user._id.toString(), 201, Date.now() - startTime);

    // Return success response (don't include sensitive data)
    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful. Please verify your email with the OTP sent.',
        data: {
          userId: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isVerified: user.isVerified,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      logApiRequest('POST', '/api/auth/register', undefined, 409, Date.now() - startTime);
      return NextResponse.json(
        {
          success: false,
          error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
        },
        { status: 409 }
      );
    }

    logError('Registration error', error, {
      url: request.url,
      method: 'POST'
    });
    logApiRequest('POST', '/api/auth/register', undefined, 500, Date.now() - startTime);

    return NextResponse.json(
      {
        success: false,
        error: 'Registration failed. Please try again.',
      },
      { status: 500 }
    );
  }
}
