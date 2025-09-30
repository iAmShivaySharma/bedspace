import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { Provider } from '@/models/User';
import { verifyAuth } from '@/middleware/auth';
import { z } from 'zod';

const documentSchema = z.object({
  type: z.enum(['id_card', 'address_proof', 'business_license']),
  url: z.string().url('Invalid document URL'),
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and ensure user is a provider
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (authResult.user.role !== 'provider') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Provider role required.' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const validation = documentSchema.safeParse(body);

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

    const { type, url } = validation.data;

    // Find the provider
    const provider = await Provider.findById(authResult.user.id);
    if (!provider) {
      return NextResponse.json({ success: false, error: 'Provider not found' }, { status: 404 });
    }

    // Remove existing document of the same type
    provider.verificationDocuments = provider.verificationDocuments.filter(
      (doc: any) => doc.type !== type
    );

    // Add new document
    const newDocument = {
      _id: new mongoose.Types.ObjectId().toString(),
      type,
      fileName: url.split('/').pop() || 'unknown',
      fileUrl: url,
      uploadedAt: new Date(),
      status: 'pending' as const,
    };

    provider.verificationDocuments.push(newDocument);

    // Update verification status if needed
    const requiredDocs = ['id_card', 'address_proof'];
    const hasAllRequiredDocs = requiredDocs.every(docType =>
      provider.verificationDocuments.some((doc: any) => doc.type === docType)
    );

    if (hasAllRequiredDocs && provider.verificationStatus === 'pending') {
      // Keep as pending for admin review
      provider.verificationStatus = 'pending';
    }

    await provider.save();

    return NextResponse.json({
      success: true,
      message: 'Document saved successfully',
      data: {
        document: newDocument,
        verificationStatus: provider.verificationStatus,
      },
    });
  } catch (error) {
    console.error('Error saving verification document:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save document',
      },
      { status: 500 }
    );
  }
}
