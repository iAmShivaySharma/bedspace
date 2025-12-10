import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { comparePassword, generateToken } from '@/utils/auth';
import { loginSchema } from '@/utils/validation';
import { logApiRequest, logError } from '@/lib/logger';
import { logAuthActivity } from '@/lib/activityLogger';
import { rateLimit } from '@/middleware/auth';
import { getClientIp } from '@/utils/ipExtractor';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Apply rate limiting (max 5 login attempts per IP per 15 minutes)
    const rateLimitResponse = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      keyGenerator: req => getClientIp(req),
    })(request);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

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
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { identifier, password } = validationResult.data;

    // Find user by email or phone
    const isEmail = identifier.includes('@');
    const user = await User.findOne(isEmail ? { email: identifier } : { phone: identifier });

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

    // Check if user is locked out from too many failed login attempts
    if (user.loginLockoutUntil && user.loginLockoutUntil > new Date()) {
      const lockoutRemaining = Math.ceil((user.loginLockoutUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        {
          success: false,
          error: `Account temporarily locked. Please try again in ${lockoutRemaining} minutes.`,
        },
        { status: 429 }
      );
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      // Increment failed attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      user.failedLoginAttempts = failedAttempts;

      // Lock account if too many failed attempts (5 attempts = 30 min lockout)
      if (failedAttempts >= 5) {
        user.loginLockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }

      await user.save();

      logApiRequest('POST', '/api/auth/login', user._id.toString(), 401, Date.now() - startTime);
      return NextResponse.json(
        {
          success: false,
          error:
            failedAttempts >= 5
              ? 'Too many failed attempts. Account temporarily locked for 30 minutes.'
              : `Invalid credentials. ${5 - failedAttempts} attempts remaining.`,
        },
        { status: 401 }
      );
    }

    // Reset failed attempts and update last login
    user.failedLoginAttempts = 0;
    user.loginLockoutUntil = undefined;
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
      const providerData = user as any; // Type assertion for provider-specific properties
      const userDataExtended = userData as any; // Type assertion for userData
      userDataExtended.verificationStatus = providerData.verificationStatus;
      userDataExtended.businessName = providerData.businessName;
      userDataExtended.rating = providerData.rating;
      userDataExtended.totalReviews = providerData.totalReviews;
      userDataExtended.totalListings = providerData.totalListings;
    }

    // Log successful login
    await logAuthActivity(user._id.toString(), user.role, 'login', request);
    logApiRequest('POST', '/api/auth/login', user._id.toString(), 200, Date.now() - startTime);

    // Create response with cookie
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
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
    logError('Login error', error, {
      url: request.url,
      method: 'POST',
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
