import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from './auth';

/**
 * Middleware to check if provider is verified before accessing certain routes
 */
export async function requireProviderVerification(request: NextRequest) {
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

  if (user.verificationStatus !== 'approved') {
    return NextResponse.json(
      {
        success: false,
        error: 'Provider verification required. Please complete your verification process.',
        requiresVerification: true,
      },
      { status: 403 }
    );
  }

  return null; // No error, proceed
}

/**
 * Check verification status for middleware usage
 */
export function checkVerificationStatus(user: any): boolean {
  return user?.role === 'provider' ? user.verificationStatus === 'approved' : true;
}

/**
 * Protected routes that require provider verification
 */
export const VERIFICATION_REQUIRED_ROUTES = [
  '/provider/listings',
  '/provider/bookings',
  '/provider/analytics',
  '/provider/payments',
  '/api/providers/listings',
  '/api/providers/bookings',
];

/**
 * Check if route requires verification
 */
export function requiresVerification(pathname: string): boolean {
  return VERIFICATION_REQUIRED_ROUTES.some(route => pathname.startsWith(route));
}
