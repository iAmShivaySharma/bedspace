import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  // Socket.IO will be handled through the global server instance
  // This endpoint is for health check only
  return NextResponse.json({
    success: true,
    message: 'Socket.IO ready',
    timestamp: new Date().toISOString(),
  });
}
