import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserFromToken } from '@/utils/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    _id: string;
    email: string;
    role: string;
    name: string;
    isVerified: boolean;
  };
}

// Middleware to authenticate user
export async function authenticate(request: NextRequest): Promise<{ user: any; error?: string }> {
  try {
    // Handle build-time scenario where headers might not be available
    if (!request.headers) {
      return { user: null, error: 'No headers available' };
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return { user: null, error: 'No token provided' };
    }

    const payload = verifyToken(token);
    if (!payload) {
      return { user: null, error: 'Invalid token' };
    }

    await connectDB();
    const user = await User.findById(payload.userId).select('-password');

    if (!user) {
      return { user: null, error: 'User not found' };
    }

    return { user };
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

// Simple auth verification function for API routes
export async function verifyAuth(request: NextRequest): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    // Handle build-time scenario where headers might not be available
    if (!request.headers) {
      return { success: false, error: 'No headers available' };
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return { success: false, error: 'No token provided' };
    }

    const payload = verifyToken(token);
    if (!payload) {
      return { success: false, error: 'Invalid token' };
    }

    await connectDB();
    const user = await User.findById(payload.userId).select('-password');

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return {
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
        isVerified: user.isVerified
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

// Middleware to check if user has required role
export function requireRole(allowedRoles: string | string[]) {
  return async (request: NextRequest, user: any) => {
    if (!user) {
      return { error: 'Authentication required' };
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(user.role)) {
      return { error: 'Insufficient permissions' };
    }

    return { user };
  };
}

// Middleware to check if user is verified
export function requireVerification() {
  return async (request: NextRequest, user: any) => {
    if (!user) {
      return { error: 'Authentication required' };
    }

    if (!user.isVerified) {
      return { error: 'Account verification required' };
    }

    return { user };
  };
}

// Middleware to check if provider is approved
export function requireProviderApproval() {
  return async (request: NextRequest, user: any) => {
    if (!user) {
      return { error: 'Authentication required' };
    }

    if (user.role !== 'provider') {
      return { error: 'Provider access required' };
    }

    await connectDB();
    const provider = await User.findById(user._id);
    
    const providerData = provider as any; // Type assertion for verificationStatus
    if (!provider || providerData.verificationStatus !== 'approved') {
      return { error: 'Provider approval required' };
    }

    return { user };
  };
}

// Helper function to create authentication middleware
export function createAuthMiddleware(options: {
  requireAuth?: boolean;
  roles?: string | string[];
  requireVerified?: boolean;
  requireProviderApproval?: boolean;
} = {}) {
  return async (request: NextRequest) => {
    const {
      requireAuth = true,
      roles,
      requireVerified = false,
      requireProviderApproval: requireApproval = false,
    } = options;

    // Authenticate user
    const { user, error } = await authenticate(request);

    if (requireAuth && error) {
      return NextResponse.json(
        { success: false, error },
        { status: 401 }
      );
    }

    // Check roles
    if (roles && user) {
      const roleCheck = await requireRole(roles)(request, user);
      if (roleCheck.error) {
        return NextResponse.json(
          { success: false, error: roleCheck.error },
          { status: 403 }
        );
      }
    }

    // Check verification
    if (requireVerified && user) {
      const verificationCheck = await requireVerification()(request, user);
      if (verificationCheck.error) {
        return NextResponse.json(
          { success: false, error: verificationCheck.error },
          { status: 403 }
        );
      }
    }

    // Check provider approval
    if (requireApproval && user) {
      const approvalCheck = await requireProviderApproval()(request, user);
      if (approvalCheck.error) {
        return NextResponse.json(
          { success: false, error: approvalCheck.error },
          { status: 403 }
        );
      }
    }

    return { user };
  };
}

// Rate limiting middleware
const rateLimitMap = new Map();

export function rateLimit(options: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: NextRequest) => string;
} = { windowMs: 15 * 60 * 1000, maxRequests: 100 }) {
  const { windowMs, maxRequests, keyGenerator } = options;

  return (request: NextRequest) => {
    const key = keyGenerator ? keyGenerator(request) : request.ip || 'anonymous';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    const requests = rateLimitMap.get(key) || [];
    const validRequests = requests.filter((time: number) => time > windowStart);

    if (validRequests.length >= maxRequests) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      );
    }

    validRequests.push(now);
    rateLimitMap.set(key, validRequests);

    return null; // Continue processing
  };
}
