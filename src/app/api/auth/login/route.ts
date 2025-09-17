import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { comparePassword, generateToken } from '@/utils/auth';
import { loginSchema } from '@/utils/validation';
import { logApiRequest, logError } from '@/lib/logger';
import { logAuthActivity } from '@/lib/activityLogger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    await connectDB();

    const body = await request.json();
    
    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      logApiRequest('POST', '/api/auth/login', undefined, 400, Date.now() - startTime);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { identifier, password } = validationResult.data;

    // Find user by email or phone
    const isEmail = identifier.includes('@');
    const user = await User.findOne(
      isEmail ? { email: identifier } : { phone: identifier }
    );

    if (!user) {
      logApiRequest('POST', '/api/auth/login', undefined, 401, Date.now() - startTime);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
        },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      logApiRequest('POST', '/api/auth/login', user._id.toString(), 401, Date.now() - startTime);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
        },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

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
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };

    // Add provider-specific data if user is a provider
    if (user.role === 'provider') {
      userData.verificationStatus = user.verificationStatus;
      userData.businessName = user.businessName;
      userData.rating = user.rating;
      userData.totalReviews = user.totalReviews;
      userData.totalListings = user.totalListings;
    }

    // Log successful login
    await logAuthActivity(user._id.toString(), user.role, 'login', request);
    logApiRequest('POST', '/api/auth/login', user._id.toString(), 200, Date.now() - startTime);

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          user: userData,
          token,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    logError('Login error', error, {
      url: request.url,
      method: 'POST'
    });
    logApiRequest('POST', '/api/auth/login', undefined, 500, Date.now() - startTime);

    return NextResponse.json(
      {
        success: false,
        error: 'Login failed. Please try again.',
      },
      { status: 500 }
    );
  }
}
