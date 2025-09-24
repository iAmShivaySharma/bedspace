import { Client } from 'minio';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio-cwg0go8cgkskkk4o4k4gk0o8.pinkyfoundation.com',
  port: parseInt(process.env.MINIO_PORT || '443'),
  useSSL: process.env.MINIO_USE_SSL !== 'false', // Default to true for HTTPS
  accessKey: process.env.MINIO_ACCESS_KEY || 'RqUc8GIbxw56P7XM',
  secretKey: process.env.MINIO_SECRET_KEY || 'OLNDU1qc3DfEJ2PG2MSL8FqTp86RGphC',
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'bedspace-images';

// Initialize bucket if it doesn't exist
export const initializeBucket = async () => {
  try {
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`Bucket ${BUCKET_NAME} created successfully`);

      // Set bucket policy to allow public read access for images
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/public/*`],
          },
        ],
      };

      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    }
  } catch (error) {
    console.error('Error initializing MinIO bucket:', error);
  }
};

export { minioClient, BUCKET_NAME };
