import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { Listing } from '@/models/Listing';

export async function POST(
  request: NextRequest,
  { params }: { params: { listingId: string; action: string } }
) {
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

    const { listingId, action } = params;

    // Find the listing
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    let message = '';
    let updateFields: any = {
      updatedAt: new Date(),
    };

    switch (action) {
      case 'approve':
        updateFields.isApproved = true;
        updateFields.isActive = true;
        updateFields.approvedBy = user._id;
        updateFields.approvedAt = new Date();
        message = 'Listing approved and activated successfully';
        break;

      case 'reject':
        updateFields.isApproved = false;
        updateFields.isActive = false;
        updateFields.rejectionReason = 'Rejected by admin';
        message = 'Listing rejected successfully';
        break;

      case 'activate':
        if (!listing.isApproved) {
          return NextResponse.json(
            { success: false, error: 'Cannot activate unapproved listing' },
            { status: 400 }
          );
        }
        updateFields.isActive = true;
        message = 'Listing activated successfully';
        break;

      case 'deactivate':
        updateFields.isActive = false;
        message = 'Listing deactivated successfully';
        break;

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    // Update the listing
    await Listing.findByIdAndUpdate(listingId, updateFields);

    // Log the admin action (in production, you'd save this to an audit log)
    console.log(`Admin ${user.email} performed ${action} on listing ${listingId}`);

    // Get updated listing for response
    const updatedListing = await Listing.findById(listingId);

    return NextResponse.json({
      success: true,
      message,
      data: {
        listingId,
        isApproved: updatedListing?.isApproved,
        isActive: updatedListing?.isActive,
        action,
        updatedAt: updatedListing?.updatedAt,
      },
    });
  } catch (error) {
    console.error('Listing action error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform listing action' },
      { status: 500 }
    );
  }
}
