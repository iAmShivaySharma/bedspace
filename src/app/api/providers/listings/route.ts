import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Listing } from '@/models/Listing';
import { requireProviderVerification } from '@/middleware/verification';
import { authenticate } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Check provider verification
    const verificationError = await requireProviderVerification(request);
    if (verificationError) return verificationError;

    // Get authenticated user
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get provider listings
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const query: any = {
      providerId: user._id, // Only get listings for the current provider
    };
    if (status) query.isActive = status === 'active';

    const listings = await Listing.find(query)
      .populate('providerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Listing.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        data: listings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get provider listings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check provider verification
    const verificationError = await requireProviderVerification(request);
    if (verificationError) return verificationError;

    const body = await request.json();
    const {
      title,
      description,
      address,
      city,
      state,
      pincode,
      rent,
      securityDeposit,
      roomType,
      genderPreference,
      facilities,
      availableFrom,
      images,
    } = body;

    if (
      !title ||
      !description ||
      !address ||
      !city ||
      !state ||
      !pincode ||
      !rent ||
      !securityDeposit ||
      !roomType ||
      !genderPreference ||
      !availableFrom
    ) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Process images array to match the model structure
    const processedImages = (images || []).map((img: any, index: number) => ({
      fileName: img.fileName,
      fileUrl: img.fileUrl,
      isPrimary: index === 0, // First image is primary
      uploadedAt: new Date(),
    }));

    const listing = new Listing({
      providerId: user._id,
      title,
      description,
      address,
      city: city.toLowerCase(),
      state,
      pincode,
      rent,
      securityDeposit,
      roomType,
      genderPreference,
      facilities: facilities || [],
      images: processedImages,
      availableFrom: new Date(availableFrom),
      isActive: true,
      isApproved: false, // All new listings need admin approval
    });

    await listing.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Listing created successfully',
        data: listing,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create listing error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
