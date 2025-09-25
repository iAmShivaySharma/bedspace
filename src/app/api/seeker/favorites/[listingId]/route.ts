import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import { Favorite } from '@/models/Favorite';

interface RouteParams {
  params: {
    listingId: string;
  };
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { listingId } = params;

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

    // Remove favorite
    const result = await Favorite.findOneAndDelete({
      seekerId: user._id,
      listingId,
    });

    if (!result) {
      return NextResponse.json({ success: false, error: 'Favorite not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Removed from favorites',
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}
