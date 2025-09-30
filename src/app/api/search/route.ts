import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Listing } from '@/models/Listing';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const location = searchParams.get('location') || '';
    const minPrice = parseInt(searchParams.get('minPrice') || '0');
    const maxPrice = parseInt(searchParams.get('maxPrice') || '999999');
    const type = searchParams.get('type') || '';
    const gender = searchParams.get('gender') || '';
    const amenities = searchParams.get('amenities')?.split(',').filter(Boolean) || [];
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build database query
    const dbQuery: any = {
      isActive: true,
      isApproved: true,
      availableFrom: { $lte: new Date() },
    };

    // Text search in title and description
    if (query) {
      dbQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { city: { $regex: query, $options: 'i' } },
        { address: { $regex: query, $options: 'i' } },
      ];
    }

    // Location search
    if (location) {
      dbQuery.$and = dbQuery.$and || [];
      dbQuery.$and.push({
        $or: [
          { city: { $regex: location, $options: 'i' } },
          { address: { $regex: location, $options: 'i' } },
          { state: { $regex: location, $options: 'i' } },
        ],
      });
    }

    // Price range
    if (minPrice > 0 || maxPrice < 999999) {
      dbQuery.rent = {};
      if (minPrice > 0) dbQuery.rent.$gte = minPrice;
      if (maxPrice < 999999) dbQuery.rent.$lte = maxPrice;
    }

    // Room type mapping
    if (type) {
      const typeMapping: { [key: string]: string } = {
        private: 'single',
        shared: 'shared',
        entire: 'private',
      };
      dbQuery.roomType = typeMapping[type] || type;
    }

    // Gender preference
    if (gender && gender !== 'any') {
      dbQuery.genderPreference = { $in: [gender, 'any'] };
    }

    // Amenities/Facilities
    if (amenities.length > 0) {
      dbQuery.facilities = { $in: amenities };
    }

    // Get listings with pagination
    const listings = await Listing.find(dbQuery)
      .populate('providerId', 'name email avatar verificationStatus')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const totalResults = await Listing.countDocuments(dbQuery);

    // Transform listings to match frontend format
    const transformedListings = listings.map(listing => {
      const provider = listing.providerId as any; // Cast to any to access populated fields
      return {
        id: listing._id.toString(),
        title: listing.title,
        description: listing.description,
        location: `${listing.address}, ${listing.city}`,
        price: listing.rent,
        type:
          listing.roomType === 'single'
            ? 'private'
            : listing.roomType === 'shared'
              ? 'shared'
              : 'entire',
        gender: listing.genderPreference,
        amenities: listing.facilities || [],
        images: listing.images?.map((img: any) => img.fileUrl) || ['/api/placeholder/400/300'],
        provider: {
          id: provider._id.toString(),
          name: provider.name,
          rating: (4.0 + Math.random()).toFixed(1), // Placeholder rating
          verified: provider.verificationStatus === 'approved',
        },
        coordinates: listing.coordinates || { lat: 19.076, lng: 72.8777 }, // Default Mumbai coords
        rent: listing.rent,
        securityDeposit: listing.securityDeposit,
        roomType: listing.roomType,
        genderPreference: listing.genderPreference,
        availableFrom: listing.availableFrom,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
      };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalResults / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        listings: transformedListings,
        pagination: {
          page,
          limit,
          totalResults,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
        filters: {
          query,
          location,
          minPrice,
          maxPrice,
          type,
          gender,
          amenities,
        },
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}

// Get location suggestions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    // Mock location suggestions
    const locations = [
      'Downtown, Mumbai',
      'Bandra, Mumbai',
      'Andheri, Mumbai',
      'Powai, Mumbai',
      'Thane, Mumbai',
      'Worli, Mumbai',
      'Malad, Mumbai',
      'Borivali, Mumbai',
      'Kandivali, Mumbai',
      'Goregaon, Mumbai',
    ];

    const suggestions = locations
      .filter(location => location.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('Location suggestions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get location suggestions' },
      { status: 500 }
    );
  }
}
