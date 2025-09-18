// eslint-disable-next-line @typescript-eslint/no-unused-vars
import mongoose from 'mongoose';
import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      isVerified: boolean;
      phone: string;
      verificationStatus: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: string;
    isVerified: boolean;
    phone: string;
    verificationStatus: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role: string;
    isVerified: boolean;
    phone: string;
    verificationStatus: string;
  }
}

declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };

  namespace NodeJS {
    interface ProcessEnv {
      MONGODB_URI: string;
      MONGODB_DB: string;
      NEXTAUTH_SECRET: string;
      NEXTAUTH_URL: string;
      JWT_SECRET: string;
      MINIO_ENDPOINT: string;
      MINIO_PORT: string;
      MINIO_ACCESS_KEY: string;
      MINIO_SECRET_KEY: string;
      MINIO_BUCKET_NAME: string;
      MINIO_USE_SSL: string;
      EMAIL_HOST: string;
      EMAIL_PORT: string;
      EMAIL_USER: string;
      EMAIL_PASS: string;
      EMAIL_FROM: string;
      NEXT_PUBLIC_APP_URL: string;
      NEXT_PUBLIC_API_URL: string;
      MAX_FILE_SIZE: string;
      ALLOWED_FILE_TYPES: string;
    }
  }
}

export {};
