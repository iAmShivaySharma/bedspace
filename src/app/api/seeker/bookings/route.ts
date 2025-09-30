import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { BookingRequest } from '@/models/Booking';
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const query: any = { seekerId: user._id };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Get seeker's bookings with populated data
    const bookings = await BookingRequest.find(query)
      .populate({
        path: 'listingId',
        populate: {
          path: 'providerId',
          select: 'name email phone',
        },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    const total = await BookingRequest.countDocuments(query);

    // Format bookings to match frontend expectations
    const formattedBookings = bookings.map(booking => ({
      id: booking._id,
      listing: {
        id: booking.listingId._id,
        title: booking.listingId.title,
        location: `${booking.listingId.address}, ${booking.listingId.city}`,
        price: booking.listingId.rent,
        images: booking.listingId.images?.map((img: any) => img.fileUrl) || [],
      },
      provider: {
        id: booking.listingId.providerId._id,
        name: booking.listingId.providerId.name,
        email: booking.listingId.providerId.email,
        phone: booking.listingId.providerId.phone,
      },
      status: booking.status,
      checkIn: booking.requestedDate,
      checkOut: null, // Not implemented yet
      duration: 1, // Default 1 month, can be calculated based on requirements
      totalAmount: booking.listingId.rent + booking.listingId.securityDeposit,
      paymentStatus: 'pending', // Would be determined by payment integration
      createdAt: booking.createdAt,
      requestDate: booking.createdAt,
      moveInDate: booking.requestedDate,
      message: booking.message,
      responseMessage: booking.responseMessage,
      respondedAt: booking.respondedAt,
    }));

    return NextResponse.json({
      success: true,
      data: formattedBookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get seeker bookings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get seeker bookings' },
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
    const { listingId, message, requestedDate } = body;

    if (!listingId || !message || !requestedDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get listing details
    const listing = await Listing.findById(listingId).populate('providerId');
    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    // Check if user already has a pending/approved booking for this listing
    const existingBooking = await BookingRequest.findOne({
      seekerId: user._id,
      listingId,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingBooking) {
      return NextResponse.json(
        { success: false, error: 'You already have a booking request for this listing' },
        { status: 400 }
      );
    }

    // Create booking request
    const booking = new BookingRequest({
      seekerId: user._id,
      providerId: listing.providerId,
      listingId,
      message,
      requestedDate: new Date(requestedDate),
      status: 'pending',
    });

    await booking.save();

    return NextResponse.json({
      success: true,
      message: 'Booking request created successfully',
      data: booking,
    });
  } catch (error: any) {
    // Handle duplicate booking request
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: 'You already have a booking request for this listing',
        },
        { status: 400 }
      );
    }

    console.error('Create booking error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create booking request' },
      { status: 500 }
    );
  }
}
