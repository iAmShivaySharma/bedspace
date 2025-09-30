import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { Favorite } from '@/models/Favorite';
import { Listing } from '@/models/Listing';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.role !== 'seeker') {
      return NextResponse.json(
        { success: false, error: 'Seeker access required' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get user's favorites with populated listing data
    const favorites = await Favorite.find({ seekerId: user._id })
      .populate({
        path: 'listingId',
        populate: {
          path: 'providerId',
          select: 'name email rating totalReviews',
        },
      })
      .sort({ createdAt: -1 })
      .exec();

    // Format the response to match the frontend expectations
    const formattedFavorites = favorites
      .filter(fav => fav.listingId) // Only include favorites where listing still exists
      .map(favorite => ({
        id: favorite.listingId._id,
        title: favorite.listingId.title,
        location: `${favorite.listingId.address}, ${favorite.listingId.city}`,
        price: favorite.listingId.rent,
        rating: favorite.listingId.providerId.rating || 4.0,
        reviewCount: favorite.listingId.providerId.totalReviews || 0,
        provider: favorite.listingId.providerId.name,
        amenities: favorite.listingId.facilities,
        image: favorite.listingId.images?.[0]?.fileUrl || null,
        savedDate: favorite.createdAt,
        status:
          favorite.listingId.isActive && favorite.listingId.isApproved
            ? 'available'
            : 'unavailable',
      }));

    return NextResponse.json({
      success: true,
      data: formattedFavorites,
    });
  } catch (error) {
    console.error('Get seeker favorites error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get seeker favorites' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.role !== 'seeker') {
      return NextResponse.json(
        { success: false, error: 'Seeker access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { listingId } = body;

    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    // Create or update favorite
    const favorite = await Favorite.findOneAndUpdate(
      { seekerId: user._id, listingId },
      { seekerId: user._id, listingId },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Added to favorites',
      data: favorite,
    });
  } catch (error: any) {
    // Handle duplicate key error (already favorited)
    if (error.code === 11000) {
      return NextResponse.json({
        success: true,
        message: 'Already in favorites',
      });
    }

    console.error('Add favorite error:', error);
    return NextResponse.json({ success: false, error: 'Failed to add favorite' }, { status: 500 });
  }
}
