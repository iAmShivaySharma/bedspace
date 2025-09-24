import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';

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

    // In production, you would find and update the actual listing
    // const listing = await Listing.findById(listingId);
    // if (!listing) {
    //   return NextResponse.json(
    //     { success: false, error: 'Listing not found' },
    //     { status: 404 }
    //   );
    // }

    let message = '';
    let newStatus = '';

    switch (action) {
      case 'approve':
        newStatus = 'active';
        message = 'Listing approved and activated successfully';
        break;

      case 'reject':
        newStatus = 'rejected';
        message = 'Listing rejected successfully';
        break;

      case 'activate':
        newStatus = 'active';
        message = 'Listing activated successfully';
        break;

      case 'deactivate':
        newStatus = 'inactive';
        message = 'Listing deactivated successfully';
        break;

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    // In production, you would update the listing:
    // await Listing.findByIdAndUpdate(listingId, {
    //   status: newStatus,
    //   updatedAt: new Date()
    // });

    // Log the admin action (in production, you'd save this to an audit log)
    console.log(`Admin ${user.email} performed ${action} on listing ${listingId}`);

    return NextResponse.json({
      success: true,
      message,
      data: {
        listingId,
        newStatus,
        action,
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
