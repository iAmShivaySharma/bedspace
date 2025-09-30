// Client-side upload utilities
import { v4 as uuidv4 } from 'uuid';

export interface ClientUploadResponse {
  success: boolean;
  data?: {
    publicUrl: string;
    fileName: string;
    objectName: string;
  };
  error?: string;
}

interface PresignedUrlResponse {
  success: boolean;
  data?: {
    presignedUrl: string;
    objectName: string;
    publicUrl: string;
    fileName: string;
  };
  error?: string;
}

/**
 * Upload a file directly to MinIO using presigned URLs (client-side)
 * @param file - The file to upload
 * @param folder - The folder to upload to ('documents', 'images', 'listings')
 * @param onProgress - Optional progress callback
 * @returns Promise with upload result
 */
export const uploadFileToMinioClient = async (
  file: File,
  folder: 'documents' | 'images' | 'listings' = 'documents',
  onProgress?: (progress: number) => void
): Promise<ClientUploadResponse> => {
  try {
    // Step 1: Get presigned URL
    const presignedResponse = await fetch('/api/upload/presigned-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        folder,
      }),
    });

    if (!presignedResponse.ok) {
      const errorData = await presignedResponse.json();
      throw new Error(errorData.error || 'Failed to get upload URL');
    }

    const presignedData: PresignedUrlResponse = await presignedResponse.json();
    if (!presignedData.success || !presignedData.data) {
      throw new Error(presignedData.error || 'Invalid presigned URL response');
    }

    // Step 2: Upload file directly to MinIO with progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', event => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 204) {
          resolve({
            success: true,
            data: {
              publicUrl: presignedData.data!.publicUrl,
              fileName: presignedData.data!.fileName,
              objectName: presignedData.data!.objectName,
            },
          });
        } else {
          reject(new Error('Failed to upload file to storage'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during file upload'));
      });

      xhr.open('PUT', presignedData.data!.presignedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

/**
 * Upload multiple files concurrently (client-side)
 * @param files - Array of files to upload
 * @param folder - The folder to upload to
 * @param onProgress - Optional progress callback for each file
 * @returns Promise with array of upload results
 */
export const uploadMultipleFilesClient = async (
  files: File[],
  folder: 'documents' | 'images' | 'listings' = 'documents',
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<ClientUploadResponse[]> => {
  const uploadPromises = files.map((file, index) =>
    uploadFileToMinioClient(file, folder, progress => {
      onProgress?.(index, progress);
    })
  );

  return Promise.all(uploadPromises);
};

/**
 * Validate file before upload (client-side)
 * @param file - File to validate
 * @param folder - Folder type for validation rules
 * @returns Validation result
 */
export const validateFileClient = (
  file: File,
  folder: 'documents' | 'images' | 'listings' = 'documents'
): { isValid: boolean; error?: string } => {
  // File size limits (in bytes)
  const maxSizes = {
    documents: 10 * 1024 * 1024, // 10MB for documents
    images: 5 * 1024 * 1024, // 5MB for images
    listings: 5 * 1024 * 1024, // 5MB for listing images
  };

  // Allowed file types
  const allowedTypes = {
    documents: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    listings: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  };

  // Check file size
  if (file.size > maxSizes[folder]) {
    const maxSizeMB = maxSizes[folder] / (1024 * 1024);
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check file type
  if (!allowedTypes[folder].includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  return { isValid: true };
};

/**
 * Get file preview URL for images (client-side)
 * @param file - File object
 * @returns Object URL for preview
 */
export const getFilePreview = (file: File): string => {
  if (file.type.startsWith('image/')) {
    return URL.createObjectURL(file);
  }
  return '';
};

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  return '📁';
}
