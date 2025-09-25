import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Listing } from '@/models/Listing';
import { BookingRequest } from '@/models/Booking';
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

    const providerId = user._id;

    // Get current date for monthly calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch provider statistics in parallel
    const [totalListings, activeListings, totalBookings, pendingBookings, monthlyBookings] =
      await Promise.all([
        // Total listings count
        Listing.countDocuments({ providerId }),

        // Active listings count
        Listing.countDocuments({ providerId, isActive: true, isApproved: true }),

        // Total bookings count (for all provider's listings)
        BookingRequest.aggregate([
          {
            $lookup: {
              from: 'listings',
              localField: 'listingId',
              foreignField: '_id',
              as: 'listing',
            },
          },
          {
            $match: {
              'listing.providerId': providerId,
            },
          },
          {
            $count: 'total',
          },
        ]).then(result => result[0]?.total || 0),

        // Pending bookings count
        BookingRequest.aggregate([
          {
            $lookup: {
              from: 'listings',
              localField: 'listingId',
              foreignField: '_id',
              as: 'listing',
            },
          },
          {
            $match: {
              'listing.providerId': providerId,
              status: 'pending',
            },
          },
          {
            $count: 'total',
          },
        ]).then(result => result[0]?.total || 0),

        // Monthly bookings count
        BookingRequest.aggregate([
          {
            $lookup: {
              from: 'listings',
              localField: 'listingId',
              foreignField: '_id',
              as: 'listing',
            },
          },
          {
            $match: {
              'listing.providerId': providerId,
              createdAt: { $gte: startOfMonth },
            },
          },
          {
            $count: 'total',
          },
        ]).then(result => result[0]?.total || 0),
      ]);

    // Calculate average rating (mock data for now)
    // In a real app, you'd calculate this from a reviews collection
    const rating = 4.5;
    const totalReviews = 0;

    const stats = {
      totalListings,
      activeListings,
      totalBookings,
      pendingBookings,
      monthlyBookings,
      rating,
      totalReviews,
    };

    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get provider stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch provider statistics' },
      { status: 500 }
    );
  }
}
