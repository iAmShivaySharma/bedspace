import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthenticatedUser } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { Listing } from '@/models/Listing';
import { logApiRequest, logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      logApiRequest('GET', '/api/favorites', undefined, 401, Date.now() - startTime);
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    }

    const user = authResult.user as AuthenticatedUser;
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1') || 1;
    const limit = parseInt(searchParams.get('limit') || '20') || 20;
    const skip = (page - 1) * limit;

    // Get user's favorites
    const userData = await User.findById(user.id)
      .populate({
        path: 'favorites',
        populate: {
          path: 'providerId',
          select: 'name avatar rating totalReviews',
        },
        options: {
          skip,
          limit,
        },
      })
      .select('favorites');

    const favorites = userData?.favorites || [];
    const total = await User.findById(user.id)
      .select('favorites')
      .then(u => u?.favorites?.length || 0);

    logApiRequest('GET', '/api/favorites', user.id, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: favorites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logError('Error in GET /api/favorites:', error);
    logApiRequest('GET', '/api/favorites', undefined, 500, Date.now() - startTime);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      logApiRequest('POST', '/api/favorites', undefined, 401, Date.now() - startTime);
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    }

    const user = authResult.user as AuthenticatedUser;
    await connectDB();

    const body = await request.json();
    const { listingId } = body;

    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    // Check if listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    // Add to favorites
    const userData = await User.findByIdAndUpdate(
      user.id,
      { $addToSet: { favorites: listingId } },
      { new: true }
    );

    logApiRequest('POST', '/api/favorites', user.id, 201, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      message: 'Added to favorites',
      data: { isFavorite: true },
    });
  } catch (error) {
    logError('Error in POST /api/favorites:', error);
    logApiRequest('POST', '/api/favorites', undefined, 500, Date.now() - startTime);
    return NextResponse.json(
      { success: false, error: 'Failed to add to favorites' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      logApiRequest('DELETE', '/api/favorites', undefined, 401, Date.now() - startTime);
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

    // Remove from favorites
    const userData = await User.findByIdAndUpdate(
      user.id,
      { $pull: { favorites: listingId } },
      { new: true }
    );

    logApiRequest('DELETE', '/api/favorites', user.id, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      message: 'Removed from favorites',
      data: { isFavorite: false },
    });
  } catch (error) {
    logError('Error in DELETE /api/favorites:', error);
    logApiRequest('DELETE', '/api/favorites', undefined, 500, Date.now() - startTime);
    return NextResponse.json(
      { success: false, error: 'Failed to remove from favorites' },
      { status: 500 }
    );
  }
}
