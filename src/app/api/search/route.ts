import { NextRequest, NextResponse } from 'next/server';

// Mock search data for now
const mockListings = [
  {
    id: '1',
    title: 'Cozy Bed Space in Downtown',
    description: 'Comfortable shared room with all amenities',
    location: 'Downtown, Mumbai',
    price: 8000,
    type: 'shared',
    gender: 'any',
    amenities: ['wifi', 'ac', 'laundry', 'kitchen'],
    images: ['/api/placeholder/400/300'],
    provider: {
      name: 'John Smith',
      rating: 4.5,
      verified: true,
    },
    coordinates: { lat: 19.076, lng: 72.8777 },
  },
  {
    id: '2',
    title: 'Private Room Near IT Park',
    description: 'Spacious private room with attached bathroom',
    location: 'Bandra, Mumbai',
    price: 12000,
    type: 'private',
    gender: 'male',
    amenities: ['wifi', 'ac', 'parking', 'security'],
    images: ['/api/placeholder/400/300'],
    provider: {
      name: 'Sarah Johnson',
      rating: 4.8,
      verified: true,
    },
    coordinates: { lat: 19.0596, lng: 72.8295 },
  },
  {
    id: '3',
    title: 'Budget Friendly Shared Space',
    description: 'Clean and affordable bed space for students',
    location: 'Andheri, Mumbai',
    price: 6000,
    type: 'shared',
    gender: 'female',
    amenities: ['wifi', 'kitchen', 'laundry'],
    images: ['/api/placeholder/400/300'],
    provider: {
      name: 'Mike Wilson',
      rating: 4.2,
      verified: true,
    },
    coordinates: { lat: 19.1136, lng: 72.8697 },
  },
  {
    id: '4',
    title: 'Luxury Bed Space with Pool',
    description: 'Premium accommodation with swimming pool access',
    location: 'Powai, Mumbai',
    price: 15000,
    type: 'private',
    gender: 'any',
    amenities: ['wifi', 'ac', 'pool', 'gym', 'parking'],
    images: ['/api/placeholder/400/300'],
    provider: {
      name: 'Alice Brown',
      rating: 4.9,
      verified: true,
    },
    coordinates: { lat: 19.1197, lng: 72.9056 },
  },
  {
    id: '5',
    title: 'Student Hostel Style Room',
    description: 'Affordable accommodation for students and working professionals',
    location: 'Thane, Mumbai',
    price: 5500,
    type: 'shared',
    gender: 'any',
    amenities: ['wifi', 'kitchen', 'study_room'],
    images: ['/api/placeholder/400/300'],
    provider: {
      name: 'Bob Davis',
      rating: 4.0,
      verified: true,
    },
    coordinates: { lat: 19.2183, lng: 72.9781 },
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const location = searchParams.get('location') || '';
    const minPrice = parseInt(searchParams.get('minPrice') || '0');
    const maxPrice = parseInt(searchParams.get('maxPrice') || '999999');
    const type = searchParams.get('type') || '';
    const gender = searchParams.get('gender') || '';
    const amenities = searchParams.get('amenities')?.split(',') || [];
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Filter listings based on search criteria
    let filteredListings = mockListings.filter(listing => {
      // Text search in title and description
      const matchesQuery =
        !query ||
        listing.title.toLowerCase().includes(query.toLowerCase()) ||
        listing.description.toLowerCase().includes(query.toLowerCase());

      // Location search
      const matchesLocation =
        !location || listing.location.toLowerCase().includes(location.toLowerCase());

      // Price range
      const matchesPrice = listing.price >= minPrice && listing.price <= maxPrice;

      // Room type
      const matchesType = !type || listing.type === type;

      // Gender preference
      const matchesGender = !gender || listing.gender === 'any' || listing.gender === gender;

      // Amenities
      const matchesAmenities =
        amenities.length === 0 || amenities.every(amenity => listing.amenities.includes(amenity));

      return (
        matchesQuery &&
        matchesLocation &&
        matchesPrice &&
        matchesType &&
        matchesGender &&
        matchesAmenities
      );
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedListings = filteredListings.slice(startIndex, endIndex);

    // Calculate pagination info
    const totalResults = filteredListings.length;
    const totalPages = Math.ceil(totalResults / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        listings: paginatedListings,
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
