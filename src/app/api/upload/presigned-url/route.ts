import { NextRequest, NextResponse } from 'next/server';
import { minioClient, BUCKET_NAME } from '@/lib/minio';
import { verifyAuth } from '@/middleware/auth';
import { z } from 'zod';

const presignedUrlSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().min(1, 'File type is required'),
  folder: z.enum(['documents', 'images', 'listings']).default('documents'),
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = presignedUrlSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { fileName, fileType, folder } = validation.data;
    const userId = authResult.user.id;

    // Generate unique file name with timestamp and user ID
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${userId}_${timestamp}.${fileExtension}`;
    const objectName = `${folder}/${uniqueFileName}`;

    // Validate file type based on folder
    const allowedTypes = {
      documents: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
      images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      listings: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    };

    if (!allowedTypes[folder].includes(fileType)) {
      return NextResponse.json(
        {
          success: false,
          error: `File type ${fileType} not allowed for ${folder}`,
        },
        { status: 400 }
      );
    }

    // Generate presigned URL for PUT operation (7 days expiry)
    const presignedUrl = await minioClient.presignedPutObject(
      BUCKET_NAME,
      objectName,
      7 * 24 * 60 * 60 // 7 days in seconds
    );

    // Generate the public URL that will be accessible after upload
    const publicUrl = `${process.env.MINIO_PUBLIC_URL || 'https://minio-cwg0go8cgkskkk4o4k4gk0o8.pinkyfoundation.com'}/${BUCKET_NAME}/${objectName}`;

    return NextResponse.json({
      success: true,
      data: {
        presignedUrl,
        objectName,
        publicUrl,
        fileName: uniqueFileName,
      },
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate upload URL',
      },
      { status: 500 }
    );
  }
}
