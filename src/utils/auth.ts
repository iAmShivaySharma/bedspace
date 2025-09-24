import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // Token expires in 7 days
  });
};

// Verify JWT token
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};

// Generate OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate random string for verification tokens
export const generateRandomString = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Extract user info from token
export const getUserFromToken = (token: string): Partial<User> | null => {
  const payload = verifyToken(token);
  if (!payload) return null;

  return {
    _id: payload.userId,
    email: payload.email,
    role: payload.role as 'seeker' | 'provider' | 'admin',
  };
};

// Check if user has required role
export const hasRole = (user: Partial<User>, requiredRole: string | string[]): boolean => {
  if (!user.role) return false;

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role);
  }

  return user.role === requiredRole;
};

// Check if user is admin
export const isAdmin = (user: Partial<User>): boolean => {
  return user.role === 'admin';
};

// Check if user is provider
export const isProvider = (user: Partial<User>): boolean => {
  return user.role === 'provider';
};

// Check if user is seeker
export const isSeeker = (user: Partial<User>): boolean => {
  return user.role === 'seeker';
};
