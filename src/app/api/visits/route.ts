import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthenticatedUser } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { Visit } from '@/models/Visit';
import { Listing } from '@/models/Listing';
import { logApiRequest, logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      logApiRequest('GET', '/api/visits', undefined, 401, Date.now() - startTime);
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    }

    const user = authResult.user as AuthenticatedUser;
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1') || 1;
    const limit = parseInt(searchParams.get('limit') || '20') || 20;
    const skip = (page - 1) * limit;

    // Get visits based on user role
    let query: any = {};
    if (user.role === 'seeker') {
      query.seekerId = user.id;
    } else if (user.role === 'provider') {
      // Get visits for provider's listings
      const listings = await Listing.find({ providerId: user.id }).select('_id');
      const listingIds = listings.map(l => l._id);
      query.listingId = { $in: listingIds };
    } else {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const visits = await Visit.find(query)
      .populate('seekerId', 'name email phone')
      .populate('listingId', 'title address city')
      .populate('providerId', 'name email phone')
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Visit.countDocuments(query);

    const transformedVisits = visits.map(visit => ({
      id: visit._id.toString(),
      listingId: visit.listingId._id.toString(),
      listingTitle: visit.listingId.title,
      listingAddress: `${visit.listingId.address}, ${visit.listingId.city}`,
      seekerId: visit.seekerId._id.toString(),
      seekerName: visit.seekerId.name,
      seekerEmail: visit.seekerId.email,
      seekerPhone: visit.seekerId.phone,
      providerId: visit.providerId._id.toString(),
      providerName: visit.providerId.name,
      providerEmail: visit.providerId.email,
      providerPhone: visit.providerId.phone,
      scheduledDate: visit.scheduledDate.toISOString(),
      timeSlot: visit.timeSlot,
      status: visit.status,
      notes: visit.notes,
      seekerNotes: visit.seekerNotes,
      providerNotes: visit.providerNotes,
      createdAt: visit.createdAt.toISOString(),
      updatedAt: visit.updatedAt.toISOString(),
    }));

    logApiRequest('GET', '/api/visits', user.id, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      data: transformedVisits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logError('Error in GET /api/visits:', error);
    logApiRequest('GET', '/api/visits', undefined, 500, Date.now() - startTime);
    return NextResponse.json({ success: false, error: 'Failed to fetch visits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      logApiRequest('POST', '/api/visits', undefined, 401, Date.now() - startTime);
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    }

    const user = authResult.user as AuthenticatedUser;
    if (user.role !== 'seeker') {
      return NextResponse.json(
        { success: false, error: 'Only seekers can schedule visits' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { listingId, scheduledDate, timeSlot, notes } = body;

    if (!listingId || !scheduledDate || !timeSlot) {
      return NextResponse.json(
        { success: false, error: 'Listing ID, scheduled date, and time slot are required' },
        { status: 400 }
      );
    }

    // Check if listing exists and is active
    const listing = await Listing.findById(listingId).populate('providerId');
    if (!listing || !listing.isActive || !listing.isApproved) {
      return NextResponse.json(
        { success: false, error: 'Listing not found or not available' },
        { status: 404 }
      );
    }

    // Validate date is in the future
    const visitDate = new Date(scheduledDate);
    if (visitDate <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'Visit date must be in the future' },
        { status: 400 }
      );
    }

    // Check if seeker already has a pending/confirmed visit for this listing
    const existingVisit = await Visit.findOne({
      seekerId: user.id,
      listingId,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (existingVisit) {
      return NextResponse.json(
        { success: false, error: 'You already have a pending or confirmed visit for this listing' },
        { status: 400 }
      );
    }

    // Create visit
    const visit = new Visit({
      listingId,
      seekerId: user.id,
      providerId: listing.providerId._id,
      scheduledDate: visitDate,
      timeSlot,
      notes: notes?.trim() || '',
      status: 'pending',
    });

    await visit.save();

    // Populate for response
    await visit.populate('seekerId', 'name email phone');
    await visit.populate('listingId', 'title address city');
    await visit.populate('providerId', 'name email phone');

    logApiRequest('POST', '/api/visits', user.id, 201, Date.now() - startTime);

    return NextResponse.json(
      {
        success: true,
        message: 'Visit scheduled successfully',
        data: {
          id: visit._id.toString(),
          listingId: visit.listingId._id.toString(),
          listingTitle: visit.listingId.title,
          listingAddress: `${visit.listingId.address}, ${visit.listingId.city}`,
          seekerId: visit.seekerId._id.toString(),
          seekerName: visit.seekerId.name,
          providerId: visit.providerId._id.toString(),
          providerName: visit.providerId.name,
          scheduledDate: visit.scheduledDate.toISOString(),
          timeSlot: visit.timeSlot,
          status: visit.status,
          notes: visit.notes,
          createdAt: visit.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logError('Error in POST /api/visits:', error);
    logApiRequest('POST', '/api/visits', undefined, 500, Date.now() - startTime);
    return NextResponse.json(
      { success: false, error: 'Failed to schedule visit' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      logApiRequest('PATCH', '/api/visits', undefined, 401, Date.now() - startTime);
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
    }

    const user = authResult.user as AuthenticatedUser;
    await connectDB();

    const body = await request.json();
    const { visitId, status, providerNotes } = body;

    if (!visitId || !status) {
      return NextResponse.json(
        { success: false, error: 'Visit ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    // Find the visit
    const visit = await Visit.findById(visitId)
      .populate('listingId', 'providerId')
      .populate('seekerId', 'name email')
      .populate('providerId', 'name email');

    if (!visit) {
      return NextResponse.json({ success: false, error: 'Visit not found' }, { status: 404 });
    }

    // Check authorization - only provider can update visit status
    if (user.role !== 'provider' || visit.listingId.providerId.toString() !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to update this visit' },
        { status: 403 }
      );
    }

    // Update the visit
    visit.status = status;
    if (providerNotes) {
      visit.providerNotes = providerNotes.trim();
    }
    visit.updatedAt = new Date();

    await visit.save();

    logApiRequest('PATCH', '/api/visits', user.id, 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      message: `Visit ${status} successfully`,
      data: {
        id: visit._id.toString(),
        status: visit.status,
        providerNotes: visit.providerNotes,
        updatedAt: visit.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    logError('Error in PATCH /api/visits:', error);
    logApiRequest('PATCH', '/api/visits', undefined, 500, Date.now() - startTime);
    return NextResponse.json({ success: false, error: 'Failed to update visit' }, { status: 500 });
  }
}
