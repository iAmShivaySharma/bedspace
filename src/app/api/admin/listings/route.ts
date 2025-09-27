import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
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

    if (user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query for real listings
    const query: any = {};

    // Filter by status (map from frontend status to database fields)
    if (status !== 'all') {
      switch (status) {
        case 'active':
          query.isActive = true;
          query.isApproved = true;
          break;
        case 'pending':
          query.isApproved = false;
          break;
        case 'inactive':
          query.isActive = false;
          break;
        case 'rejected':
          query.isApproved = false;
          query.rejectionReason = { $exists: true };
          break;
      }
    }

    // Filter by room type
    if (type !== 'all') {
      query.roomType = type;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    // Get real listings from database
    const listings = await Listing.find(query)
      .populate('providerId', 'name email verificationStatus')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const totalListings = await Listing.countDocuments(query);

    // Transform data to match admin panel format
    const transformedListings = listings.map(listing => ({
      _id: listing._id,
      title: listing.title,
      description: listing.description,
      location: `${listing.address}, ${listing.city}`,
      price: listing.rent,
      provider: {
        _id: listing.providerId._id,
        name: listing.providerId.name,
        email: listing.providerId.email,
      },
      // Map database status to frontend status
      status: (() => {
        if (!listing.isApproved && listing.rejectionReason) return 'rejected';
        if (!listing.isApproved) return 'pending';
        if (!listing.isActive) return 'inactive';
        return 'active';
      })(),
      type:
        listing.roomType === 'single'
          ? 'private_room'
          : listing.roomType === 'shared'
            ? 'shared_room'
            : 'entire_place',
      amenities: listing.facilities || [],
      images: listing.images?.map((img: any) => img.fileUrl) || [],
      rating: (4.0 + Math.random()).toFixed(1), // Placeholder rating
      reviewCount: Math.floor(Math.random() * 20) + 1, // Placeholder review count
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: transformedListings,
      pagination: {
        page,
        limit,
        total: totalListings,
        pages: Math.ceil(totalListings / limit),
      },
    });
  } catch (error) {
    console.error('Get listings error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get listings' }, { status: 500 });
  }
}
