import { minioClient, BUCKET_NAME } from '@/lib/minio';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  fileName: string;
  fileUrl: string;
  originalName: string;
  size: number;
  mimeType: string;
}

export interface UploadOptions {
  folder?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  allowedTypes?: string[];
  maxSize?: number;
}

const DEFAULT_OPTIONS: UploadOptions = {
  folder: 'uploads',
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 85,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  maxSize: 5 * 1024 * 1024, // 5MB
};

export async function uploadFile(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Validate file type
  if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }

  // Validate file size
  if (opts.maxSize && file.size > opts.maxSize) {
    throw new Error(`File size ${file.size} exceeds maximum allowed size ${opts.maxSize}`);
  }

  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  const fileName = `${uuidv4()}.${fileExtension}`;
  const filePath = opts.folder ? `${opts.folder}/${fileName}` : fileName;

  let buffer = Buffer.from(await file.arrayBuffer());
  let processedSize = buffer.length;

  // Process images with Sharp
  if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Resize if needed
      if (
        (opts.maxWidth && metadata.width && metadata.width > opts.maxWidth) ||
        (opts.maxHeight && metadata.height && metadata.height > opts.maxHeight)
      ) {
        image.resize(opts.maxWidth, opts.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Convert to JPEG for better compression (except for PNG with transparency)
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        image.jpeg({ quality: opts.quality });
      } else if (file.type === 'image/png') {
        // Keep PNG format to preserve transparency
        image.png({ quality: opts.quality });
      } else if (file.type === 'image/webp') {
        image.webp({ quality: opts.quality });
      }

      buffer = Buffer.from(await image.toBuffer());
      processedSize = buffer.length;
    } catch (error) {
      console.error('Error processing image:', error);
      // Continue with original buffer if processing fails
    }
  }

  // Upload to MinIO
  try {
    await minioClient.putObject(BUCKET_NAME, filePath, buffer, processedSize, {
      'Content-Type': file.type,
      'Cache-Control': 'max-age=31536000', // 1 year
    });

    const fileUrl = await minioClient.presignedGetObject(BUCKET_NAME, filePath, 24 * 60 * 60); // 24 hours

    return {
      fileName,
      fileUrl,
      originalName: file.name,
      size: processedSize,
      mimeType: file.type,
    };
  } catch (error) {
    console.error('Error uploading file to MinIO:', error);
    throw new Error('Failed to upload file');
  }
}

export async function uploadMultipleFiles(
  files: File[],
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file => uploadFile(file, options));
  return Promise.all(uploadPromises);
}

export async function deleteFile(fileName: string, folder?: string): Promise<boolean> {
  try {
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    await minioClient.removeObject(BUCKET_NAME, filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file from MinIO:', error);
    return false;
  }
}

export async function getFileUrl(fileName: string, folder?: string, expirySeconds: number = 24 * 60 * 60): Promise<string> {
  try {
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    return await minioClient.presignedGetObject(BUCKET_NAME, filePath, expirySeconds);
  } catch (error) {
    console.error('Error getting file URL from MinIO:', error);
    throw new Error('Failed to get file URL');
  }
}

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
