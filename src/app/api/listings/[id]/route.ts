import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Listing } from '@/models/Listing';
import { User } from '@/models/User';
import { logApiRequest, logError } from '@/lib/logger';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now();

  try {
    await connectDB();

    const listing = (await Listing.findById(params.id)
      .populate({
        path: 'providerId',
        select: 'name avatar rating totalReviews',
        model: User,
      })
      .lean()) as any;

    if (!listing) {
      logApiRequest('GET', `/api/listings/${params.id}`, undefined, 404, Date.now() - startTime);
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    // Only return active and approved listings for public access
    if (!listing.isActive || !listing.isApproved) {
      logApiRequest('GET', `/api/listings/${params.id}`, undefined, 404, Date.now() - startTime);
      return NextResponse.json({ success: false, error: 'Listing not available' }, { status: 404 });
    }

    const transformedListing = {
      id: listing._id.toString(),
      _id: listing._id.toString(),
      title: listing.title,
      description: listing.description,
      rent: listing.rent,
      securityDeposit: listing.securityDeposit,
      address: listing.address,
      city: listing.city,
      state: listing.state,
      pincode: listing.pincode,
      roomType: listing.roomType,
      genderPreference: listing.genderPreference,
      facilities: listing.facilities,
      images: listing.images,
      availableFrom: listing.availableFrom,
      isActive: listing.isActive,
      isApproved: listing.isApproved,
      providerId: listing.providerId._id.toString(),
      provider: {
        id: listing.providerId._id.toString(),
        _id: listing.providerId._id.toString(),
        name: listing.providerId.name,
        avatar: listing.providerId.avatar,
        rating: listing.providerId.rating || 0,
        totalReviews: listing.providerId.totalReviews || 0,
      },
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    };

    logApiRequest('GET', `/api/listings/${params.id}`, undefined, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: transformedListing,
    });
  } catch (error) {
    logError(`Error in GET /api/listings/${params.id}:`, error);
    logApiRequest('GET', `/api/listings/${params.id}`, undefined, 500, Date.now() - startTime);
    return NextResponse.json({ success: false, error: 'Failed to fetch listing' }, { status: 500 });
  }
}
