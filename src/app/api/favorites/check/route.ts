import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthenticatedUser } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { logApiRequest, logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      logApiRequest('GET', '/api/favorites/check', undefined, 401, Date.now() - startTime);
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    }

    const user = authResult.user as AuthenticatedUser;
    await connectDB();

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    // Check if listing is in user's favorites
    const userData = await User.findById(user.id).select('favorites');
    console.log('Debug favorites check:', {
      userId: user.id,
      listingId,
      userFavorites: userData?.favorites,
      favoritesCount: userData?.favorites?.length || 0,
    });

    const isFavorite =
      userData?.favorites?.some((fav: any) => fav.toString() === listingId) || false;
    console.log('Is favorite result:', isFavorite);

    logApiRequest('GET', '/api/favorites/check', user.id, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: { isFavorite },
    });
  } catch (error) {
    logError('Error in GET /api/favorites/check:', error);
    logApiRequest('GET', '/api/favorites/check', undefined, 500, Date.now() - startTime);
    return NextResponse.json(
      { success: false, error: 'Failed to check favorite status' },
      { status: 500 }
    );
  }
}
