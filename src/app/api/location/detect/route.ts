import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latitude, longitude } = body;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { success: false, error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Mock reverse geocoding - in production, use Google Maps API or similar
    const mockLocations = [
      {
        lat: 19.0760,
        lng: 72.8777,
        address: 'Downtown, Mumbai, Maharashtra, India',
        city: 'Mumbai',
        area: 'Downtown'
      },
      {
        lat: 19.0596,
        lng: 72.8295,
        address: 'Bandra, Mumbai, Maharashtra, India',
        city: 'Mumbai',
        area: 'Bandra'
      },
      {
        lat: 19.1136,
        lng: 72.8697,
        address: 'Andheri, Mumbai, Maharashtra, India',
        city: 'Mumbai',
        area: 'Andheri'
      }
    ];

    // Find closest location (simple distance calculation)
    let closestLocation = mockLocations[0];
    let minDistance = Math.sqrt(
      Math.pow(latitude - closestLocation.lat, 2) + 
      Math.pow(longitude - closestLocation.lng, 2)
    );

    for (const location of mockLocations) {
      const distance = Math.sqrt(
        Math.pow(latitude - location.lat, 2) + 
        Math.pow(longitude - location.lng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestLocation = location;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        address: closestLocation.address,
        city: closestLocation.city,
        area: closestLocation.area,
        coordinates: {
          latitude: closestLocation.lat,
          longitude: closestLocation.lng
        }
      }
    });

  } catch (error) {
    console.error('Location detection error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to detect location' },
      { status: 500 }
    );
  }
}
