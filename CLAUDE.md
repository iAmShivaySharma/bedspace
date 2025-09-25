# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## BedSpace - Room Rental Platform

BedSpace is a Next.js-based platform for finding and renting bed spaces/rooms in Mumbai. It connects room seekers with providers and includes admin functionality.

## Development Commands

```bash
# Development
npm run dev                 # Start development server

# Build & Production
npm run build              # Build for production
npm start                  # Start production server

# Code Quality
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint issues automatically
npm run format             # Format code with Prettier
npm run format:check       # Check formatting
npm run type-check         # Run TypeScript type checking

# Database Seeding
npm run seed:admin         # Seed admin user
npm run seed:users         # Seed test users
npm run seed:data          # Seed sample data
```

## Redux Toolkit Query (RTK Query) Integration

The application uses Redux Toolkit Query for efficient API state management, caching, and data fetching.

### Key Features

- **Automatic caching** with intelligent invalidation
- **Real-time loading and error states**
- **Optimistic updates** for better UX
- **TypeScript integration** with full type safety
- **Background refetching** and polling support

### Quick Usage

```tsx
// Query Hook Example
import { useGetAdminStatsQuery } from '@/lib/api/adminApi';

function Dashboard() {
  const { data, isLoading, error, refetch } = useGetAdminStatsQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;

  return <div>Total Users: {data?.data?.totalUsers}</div>;
}

// Mutation Hook Example
import { useCreateListingMutation } from '@/lib/api/providerApi';

function CreateListingForm() {
  const [createListing, { isLoading, error }] = useCreateListingMutation();

  const handleSubmit = async formData => {
    try {
      const result = await createListing(formData).unwrap();
      console.log('Success:', result);
    } catch (error) {
      console.error('Failed:', error);
    }
  };
}
```

### Available API Endpoints

- **Auth**: `useLoginMutation`, `useGetCurrentUserQuery`, `useLogoutMutation`
- **Admin**: `useGetAdminStatsQuery`, `useGetAdminUsersQuery`, `useAdminUserActionMutation`
- **Seeker**: `useSearchListingsQuery`, `useCreateBookingRequestMutation`, `useGetSeekerFavoritesQuery`
- **Provider**: `useGetProviderListingsQuery`, `useCreateListingMutation`, `useUpdateListingMutation`
- **Common**: `useGetNotificationsQuery`, `useSendMessageMutation`, `useGetUserProfileQuery`

See `RTK_QUERY_GUIDE.md` for comprehensive documentation and best practices.

## Architecture Overview

### Tech Stack

- **Frontend/Backend**: Next.js 14 with App Router
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with custom middleware
- **File Storage**: MinIO (S3-compatible object storage)
- **Styling**: Tailwind CSS with Radix UI components
- **Email**: Nodemailer
- **Logging**: Winston with daily rotate files
- **Real-time**: Socket.IO

### Key Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API route handlers
│   │   ├── auth/          # Authentication endpoints
│   │   ├── admin/         # Admin-specific endpoints
│   │   ├── seeker/        # Seeker-specific endpoints
│   │   └── providers/     # Provider-specific endpoints
│   ├── admin/             # Admin dashboard pages
│   ├── seeker/            # Seeker dashboard pages
│   └── provider/          # Provider pages
├── components/            # React components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── ui/               # Reusable UI components (Radix)
├── lib/                  # Core utilities and configurations
│   ├── mongodb.ts        # Database connection with caching
│   ├── logger.ts         # Winston logger setup
│   ├── minio.ts          # MinIO client configuration
│   └── activityLogger.ts # Activity tracking
├── middleware/           # Authentication and request middleware
├── models/              # Mongoose schema definitions
├── types/               # TypeScript type definitions
└── utils/               # Helper utilities
```

### User Roles & Architecture

The platform supports three user roles with distinct access patterns:

- **Seekers**: Search and book rooms
- **Providers**: List and manage properties, handle bookings
- **Admins**: Manage users, approve listings, system oversight

### Authentication Flow

- JWT-based authentication with Bearer tokens
- Role-based access control with middleware functions
- Multi-step verification (email/phone OTP)
- Provider verification workflow for document approval

### Database Models

Key entities and relationships:

- **User** (base model with role discrimination)
- **Listing** (properties with images, geolocation)
- **BookingRequest** (seeker-provider interactions)
- **Message/Conversation** (real-time messaging)
- **Activity** (audit logging)

### API Patterns

- Consistent `ApiResponse<T>` and `PaginatedResponse<T>` interfaces
- Authentication middleware: `authenticate()`, `verifyAuth()`
- Role checking: `requireRole()`, `requireVerification()`, `requireProviderApproval()`
- Rate limiting utilities available

### File Upload & Storage

- MinIO integration for document and image storage
- Provider verification documents
- Listing images with primary image designation
- Multer middleware for file handling

## Environment Variables Required

```bash
# Database
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=bedspace

# Authentication
JWT_SECRET=your-jwt-secret-here

# File Storage (MinIO)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET_NAME=bedspace-uploads

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Stripe Payments
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Development Notes

- The project uses Husky with lint-staged for pre-commit hooks
- TypeScript strict mode enabled
- ESLint configured with Next.js and Prettier integration
- Winston logging with daily rotation in `/logs` directory
- Socket.IO server setup for real-time messaging
- Activity logging system tracks all user actions
- MongoDB connection uses caching for development hot reloads
- Zod for runtime type validation in API routes

## Important Code Patterns

### API Route Authentication

Use the authentication middleware functions from `src/middleware/auth.ts`:

- `verifyAuth()` - Basic token validation
- `createAuthMiddleware()` - Comprehensive middleware with role/verification checks
- `requireRole()`, `requireVerification()`, `requireProviderApproval()` - Specific requirement checks

### Response Format

All API routes should use consistent response interfaces:

- `ApiResponse<T>` for single responses
- `PaginatedResponse<T>` for paginated data

### Database Models

Key models follow role-based inheritance:

- User model has discriminator for seeker/provider/admin roles
- Provider extends User with verification workflow
- All models use Mongoose with proper TypeScript integration

### File Upload Flow

MinIO integration requires:

1. Multer middleware for file handling
2. MinIO client configuration in `src/lib/minio.ts`
3. File metadata stored in database models
