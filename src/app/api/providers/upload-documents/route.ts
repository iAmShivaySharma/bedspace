import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Provider } from '@/models/User';
import { authenticate } from '@/middleware/auth';
import { uploadFile } from '@/utils/upload-server';
import { initializeBucket } from '@/lib/minio';

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.role !== 'provider') {
      return NextResponse.json(
        { success: false, error: 'Provider access required' },
        { status: 403 }
      );
    }

    // Initialize MinIO bucket
    await initializeBucket();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json(
        { success: false, error: 'Document type is required' },
        { status: 400 }
      );
    }

    // Validate document type
    const allowedTypes = ['id_card', 'business_license', 'address_proof', 'other'];
    if (!allowedTypes.includes(documentType)) {
      return NextResponse.json({ success: false, error: 'Invalid document type' }, { status: 400 });
    }

    // Validate file type and size
    const allowedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    if (!allowedFileTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed',
        },
        { status: 400 }
      );
    }

    if (file.size > maxFileSize) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // Upload file to MinIO
    const uploadResult = await uploadFile(file, {
      folder: `verification-documents/${user._id}`,
      allowedTypes: allowedFileTypes,
      maxSize: maxFileSize,
    });

    await connectDB();
    const provider = await Provider.findById(user._id);

    if (!provider) {
      return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 });
    }

    // Add document to provider's verification documents
    const newDocument = {
      type: documentType,
      fileName: uploadResult.fileName,
      fileUrl: uploadResult.fileUrl,
      uploadedAt: new Date(),
      status: 'pending',
    };

    // Remove existing document of the same type
    provider.verificationDocuments = provider.verificationDocuments.filter(
      doc => doc.type !== documentType
    );

    // Add new document
    provider.verificationDocuments.push(newDocument as any);

    // Reset verification status to pending if it was rejected
    if (provider.verificationStatus === 'rejected') {
      provider.verificationStatus = 'pending';
      provider.rejectionReason = undefined;
    }

    await provider.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Document uploaded successfully',
        data: {
          document: newDocument,
          verificationStatus: provider.verificationStatus,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload document error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

// Get uploaded documents
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.role !== 'provider') {
      return NextResponse.json(
        { success: false, error: 'Provider access required' },
        { status: 403 }
      );
    }

    await connectDB();
    const provider = await Provider.findById(user._id);

    if (!provider) {
      return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          documents: provider.verificationDocuments,
          verificationStatus: provider.verificationStatus,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get documents' }, { status: 500 });
  }
}
