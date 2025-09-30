'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Progress } from './progress';
import {
  uploadFileToMinioClient,
  validateFileClient,
  formatFileSize,
  getFilePreview,
  getFileIcon,
} from '@/utils/upload-client';
import { X, Upload, FileIcon, Eye, Trash2 } from 'lucide-react';

interface UploadedFile {
  id: string;
  file?: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
  publicUrl?: string;
  uploadProgress: number;
  isUploading: boolean;
  error?: string;
}

interface DocumentUploadProps {
  folder?: 'documents' | 'images' | 'listings';
  multiple?: boolean;
  maxFiles?: number;
  onUploadComplete?: (urls: string[]) => void;
  onFilesChange?: (files: UploadedFile[]) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  initialFiles?: { name: string; url: string }[];
}

export default function DocumentUpload({
  folder = 'documents',
  multiple = false,
  maxFiles = 5,
  onUploadComplete,
  onFilesChange,
  acceptedTypes,
  maxFileSize = 10,
  className = '',
  disabled = false,
  initialFiles = [],
}: DocumentUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
    initialFiles.map((file, index) => ({
      id: `initial-${index}`,
      name: file.name,
      size: 0,
      type: 'application/pdf',
      publicUrl: file.url,
      uploadProgress: 100,
      isUploading: false,
    }))
  );
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDefaultAcceptedTypes = () => {
    const typeMap = {
      documents: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
      images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      listings: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    };
    return acceptedTypes || typeMap[folder];
  };

  const validateAndProcessFiles = (files: FileList | File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      const validation = validateFileClient(file, folder);
      if (!validation.isValid) {
        errors.push(`${file.name}: ${validation.error}`);
        return;
      }

      // Check if file type is accepted
      const acceptedTypes = getDefaultAcceptedTypes();
      if (!acceptedTypes.includes(file.type)) {
        errors.push(`${file.name}: File type not supported`);
        return;
      }

      // Check file size
      const maxSizeBytes = maxFileSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        errors.push(`${file.name}: File too large (max ${maxFileSize}MB)`);
        return;
      }

      validFiles.push(file);
    });

    // Check total file count
    const totalFiles = uploadedFiles.length + validFiles.length;
    if (totalFiles > maxFiles) {
      errors.push(`Cannot upload more than ${maxFiles} files`);
      return { validFiles: [], errors };
    }

    if (!multiple && validFiles.length > 1) {
      errors.push('Only one file is allowed');
      return { validFiles: [], errors };
    }

    return { validFiles, errors };
  };

  const handleFileUpload = useCallback(
    async (files: File[]) => {
      if (disabled) return;

      const newFiles: UploadedFile[] = files.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: getFilePreview(file),
        uploadProgress: 0,
        isUploading: true,
      }));

      setUploadedFiles(prev => [...prev, ...newFiles]);

      // Upload files concurrently
      const uploadPromises = newFiles.map(async fileData => {
        if (!fileData.file) return;

        try {
          const result = await uploadFileToMinioClient(fileData.file, folder, progress => {
            setUploadedFiles(prev =>
              prev.map(f => (f.id === fileData.id ? { ...f, uploadProgress: progress } : f))
            );
          });

          if (result.success && result.data) {
            setUploadedFiles(prev =>
              prev.map(f =>
                f.id === fileData.id
                  ? {
                      ...f,
                      publicUrl: result.data!.publicUrl,
                      uploadProgress: 100,
                      isUploading: false,
                    }
                  : f
              )
            );
            return result.data.publicUrl;
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } catch (error) {
          setUploadedFiles(prev =>
            prev.map(f =>
              f.id === fileData.id
                ? {
                    ...f,
                    uploadProgress: 0,
                    isUploading: false,
                    error: error instanceof Error ? error.message : 'Upload failed',
                  }
                : f
            )
          );
          return null;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter(Boolean) as string[];

      if (validUrls.length > 0 && onUploadComplete) {
        onUploadComplete(validUrls);
      }

      const updatedFiles = uploadedFiles.concat(newFiles);
      onFilesChange?.(updatedFiles);
    },
    [disabled, folder, maxFiles, onUploadComplete, onFilesChange, uploadedFiles]
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const { validFiles, errors } = validateAndProcessFiles(files);

    if (errors.length > 0) {
      // You might want to show these errors to the user
      console.error('File validation errors:', errors);
      alert(errors.join('\n'));
      return;
    }

    handleFileUpload(validFiles);

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    const files = event.dataTransfer.files;
    if (files.length === 0) return;

    const { validFiles, errors } = validateAndProcessFiles(files);

    if (errors.length > 0) {
      console.error('File validation errors:', errors);
      alert(errors.join('\n'));
      return;
    }

    handleFileUpload(validFiles);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter(f => f.id !== fileId);
    setUploadedFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
  };

  const openFileDialog = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const getAcceptString = () => {
    return getDefaultAcceptedTypes().join(',');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={openFileDialog}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className='flex flex-col items-center justify-center py-8'>
          <Upload className='h-10 w-10 text-gray-400 mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            {multiple ? 'Upload Files' : 'Upload File'}
          </h3>
          <p className='text-sm text-gray-600 text-center mb-2'>
            Drag and drop your {folder} here, or click to select
          </p>
          <p className='text-xs text-gray-500'>
            {getDefaultAcceptedTypes()
              .map(type => type.split('/')[1])
              .join(', ')
              .toUpperCase()}
            up to {maxFileSize}MB
          </p>
          {multiple && <p className='text-xs text-gray-500 mt-1'>Maximum {maxFiles} files</p>}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type='file'
        multiple={multiple}
        accept={getAcceptString()}
        onChange={handleFileSelect}
        className='hidden'
        disabled={disabled}
      />

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className='space-y-2'>
          <h4 className='text-sm font-medium text-gray-700'>
            {uploadedFiles.length === 1 ? 'Uploaded File' : 'Uploaded Files'}
          </h4>
          {uploadedFiles.map(file => (
            <Card key={file.id} className='p-4'>
              <div className='flex items-center space-x-4'>
                {/* File Icon/Preview */}
                <div className='flex-shrink-0'>
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className='w-12 h-12 object-cover rounded'
                    />
                  ) : (
                    <div className='w-12 h-12 bg-gray-100 rounded flex items-center justify-center'>
                      <span className='text-2xl'>{getFileIcon(file.type)}</span>
                    </div>
                  )}
                </div>

                {/* File Details */}
                <div className='flex-grow min-w-0'>
                  <p className='text-sm font-medium text-gray-900 truncate'>{file.name}</p>
                  {file.size > 0 && (
                    <p className='text-xs text-gray-500'>{formatFileSize(file.size)}</p>
                  )}

                  {/* Upload Progress */}
                  {file.isUploading && (
                    <div className='mt-2'>
                      <Progress value={file.uploadProgress} className='h-2' />
                      <p className='text-xs text-gray-500 mt-1'>{file.uploadProgress}% uploaded</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {file.error && <p className='text-xs text-red-500 mt-1'>{file.error}</p>}
                </div>

                {/* Actions */}
                <div className='flex items-center space-x-2'>
                  {file.publicUrl && file.type.startsWith('image/') && (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={e => {
                        e.stopPropagation();
                        window.open(file.publicUrl, '_blank');
                      }}
                    >
                      <Eye className='h-4 w-4' />
                    </Button>
                  )}
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={e => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    disabled={disabled}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
