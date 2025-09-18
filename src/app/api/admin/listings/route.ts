import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';

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
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';
    const search = searchParams.get('search') || '';

    // Get real providers from database
    const providers = await User.find({ role: 'provider' }).select('name email verificationStatus').limit(20);

    if (providers.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Generate realistic listings based on actual providers
    const locations = [
      'Bandra West, Mumbai',
      'Andheri East, Mumbai',
      'Powai, Mumbai',
      'Thane West, Mumbai',
      'Worli, Mumbai',
      'Malad West, Mumbai',
      'Goregaon East, Mumbai',
      'Kandivali West, Mumbai',
      'Juhu, Mumbai',
      'Santacruz East, Mumbai'
    ];

    const titleTemplates = [
      'Modern Private Room',
      'Cozy Shared Space',
      'Luxury Studio',
      'Budget Friendly Room',
      'Spacious Private Room',
      'Furnished Accommodation',
      'Premium Studio',
      'Comfortable Single Room',
      'Executive Room',
      'Student Friendly Space'
    ];

    const types = ['private_room', 'shared_room', 'entire_place'];
    const statuses = ['active', 'pending', 'inactive', 'rejected'];
    const amenitiesList = [
      ['wifi', 'ac', 'kitchen', 'laundry'],
      ['wifi', 'parking', 'security', 'gym'],
      ['pool', 'gym', 'parking', 'wifi'],
      ['kitchen', 'laundry', 'wifi', 'ac'],
      ['security', 'parking', 'wifi', 'balcony'],
      ['wifi', 'ac', 'furnished', 'cleaning'],
      ['metro', 'wifi', 'kitchen', 'security']
    ];

    // Create listings based on real providers (2-3 listings per provider)
    const mockListings: any[] = [];
    providers.forEach((provider, providerIndex) => {
      const listingsPerProvider = Math.floor(Math.random() * 3) + 1; // 1-3 listings per provider

      for (let i = 0; i < listingsPerProvider; i++) {
        const listingIndex = providerIndex * 3 + i;
        const listingType = types[Math.floor(Math.random() * types.length)];

        // Provider verification status affects listing status
        let listingStatus;
        const providerData = provider as any; // Type assertion for verificationStatus
        if (providerData.verificationStatus === 'approved') {
          listingStatus = statuses[Math.floor(Math.random() * 2)]; // active or pending
        } else if (providerData.verificationStatus === 'pending') {
          listingStatus = 'pending';
        } else {
          listingStatus = statuses[Math.floor(Math.random() * statuses.length)];
        }

        const basePrice = listingType === 'entire_place' ? 15000 :
                         listingType === 'private_room' ? 10000 : 7000;

        mockListings.push({
          _id: `listing-${listingIndex + 1}`,
          title: `${titleTemplates[listingIndex % titleTemplates.length]} ${listingType === 'entire_place' ? 'Apartment' : listingType === 'private_room' ? 'with AC' : 'Near Metro'}`,
          description: `A comfortable and well-furnished ${listingType.replace('_', ' ')} perfect for professionals and students. Located in prime area with easy access to transportation.`,
          location: locations[listingIndex % locations.length],
          price: basePrice + Math.floor(Math.random() * 8000), // Realistic pricing
          provider: {
            _id: provider._id,
            name: provider.name,
            email: provider.email
          },
          status: listingStatus,
          type: listingType,
          amenities: amenitiesList[listingIndex % amenitiesList.length],
          images: [`/images/listing-${(listingIndex % 5) + 1}.jpg`],
          rating: (3.8 + Math.random() * 1.2).toFixed(1), // 3.8-5.0 rating
          reviewCount: Math.floor(Math.random() * 30) + 3,
          createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(), // Last 60 days
          updatedAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString() // Last 14 days
        });
      }
    });

    // Apply filters
    let filteredListings = mockListings;

    if (status !== 'all') {
      filteredListings = filteredListings.filter(listing => listing.status === status);
    }

    if (type !== 'all') {
      filteredListings = filteredListings.filter(listing => listing.type === type);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredListings = filteredListings.filter(listing =>
        listing.title.toLowerCase().includes(searchLower) ||
        listing.location.toLowerCase().includes(searchLower) ||
        listing.provider.name.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredListings
    });

  } catch (error) {
    console.error('Get listings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get listings' },
      { status: 500 }
    );
  }
}
