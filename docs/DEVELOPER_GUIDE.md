# BedSpace Platform - Developer Guide

## 🏗️ Architecture Overview

BedSpace is a modern full-stack rental platform built with Next.js 14, TypeScript, MongoDB, and MinIO. The platform follows a clean architecture pattern with proper separation of concerns.

### Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, MongoDB with Mongoose ODM
- **Storage**: MinIO (S3-compatible) for file uploads
- **Authentication**: JWT-based with role-based access control
- **Logging**: Winston with daily rotation
- **Code Quality**: ESLint, Prettier, Husky pre-commit hooks

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance
- MinIO server (for file storage)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd bedspace

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Seed admin user
npm run seed:admin

# Seed sample data (optional)
npm run seed:data

# Start development server
npm run dev
```

### Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=bedspace

# Authentication
JWT_SECRET=your-jwt-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# MinIO Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=bedspace
MINIO_USE_SSL=false

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@bedspace.com

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── seeker/            # Seeker-specific pages
│   └── provider/          # Provider-specific pages
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (Radix UI)
│   └── layout/           # Layout components
├── lib/                  # Utility libraries
├── middleware/           # Authentication & authorization
├── models/               # MongoDB/Mongoose models
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
└── styles/               # Global styles
```

## 🔐 Authentication & Authorization

### User Roles

- **Seeker**: Can search and book properties
- **Provider**: Can list properties and manage bookings
- **Admin**: Full platform management access

### Authentication Flow

1. User registers with email/phone
2. OTP verification required
3. JWT token issued upon successful verification
4. Token stored in HTTP-only cookies
5. Middleware validates token on protected routes

### Role-Based Access Control

```typescript
// Example: Admin-only route
export async function GET(request: NextRequest) {
  const { user, error } = await authenticate(request);

  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Admin logic here
}
```

## 🗄️ Database Models

### User Model (Discriminator Pattern)

```typescript
// Base User
interface IUser {
  name: string;
  email: string;
  phone: string;
  role: 'seeker' | 'provider' | 'admin';
  isVerified: boolean;
  // ... other fields
}

// Provider extends User
interface IProvider extends IUser {
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verificationDocuments: IVerificationDocument[];
  businessName?: string;
}
```

### Key Models

- **User**: Base user model with role-based discrimination
- **Listing**: Property listings with geolocation
- **Booking**: Booking management with status tracking
- **Activity**: User activity logging with TTL
- **Message**: Real-time messaging system

## 🔧 Development Workflow

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check

# Build
npm run build
```

### Pre-commit Hooks

Husky automatically runs:

- ESLint with auto-fix
- Prettier formatting
- TypeScript type checking

### Git Workflow

1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes with proper commits
3. Pre-commit hooks run automatically
4. Push and create PR
5. Code review and merge

## 🧪 Testing Strategy

### API Testing

Use the provided Postman collection:

```bash
# Import collection
docs/BedSpace_API_Collection.postman_collection.json

# Set environment variables
- base_url: http://localhost:3000
- admin_token: <get from login response>
```

### Manual Testing

```bash
# Start development server
npm run dev

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bedspace.com","password":"admin123"}'

# Test protected route
curl -X GET http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer <token>"
```

## 📊 Monitoring & Logging

### Winston Logging

```typescript
import { logUserActivity } from '@/lib/activityLogger';

// Log user activity
await logUserActivity(userId, userRole, 'LISTING_CREATE', { listingId: listing._id }, request);
```

### Activity Tracking

- All user actions are logged to database
- TTL index automatically removes old activities (90 days)
- Real-time activity feed in admin dashboard

## 🚀 Deployment

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Setup

1. Set up MongoDB cluster
2. Configure MinIO/S3 storage
3. Set up email service (SMTP)
4. Configure environment variables
5. Set up SSL certificates
6. Configure reverse proxy (Nginx)

### Performance Optimization

- Static page generation where possible
- Dynamic routes for authenticated content
- Image optimization with Next.js
- Database indexing for queries
- CDN for static assets

## 🔒 Security Best Practices

### Implemented Security Measures

- JWT token authentication
- Password hashing with bcrypt
- Input validation with Zod
- SQL injection prevention (Mongoose)
- XSS protection (Next.js built-in)
- CSRF protection with HTTP-only cookies
- File upload validation
- Rate limiting (implement as needed)

### Security Checklist

- ✅ Strong password requirements
- ✅ JWT token expiration
- ✅ Input sanitization
- ✅ File type validation
- ✅ Role-based access control
- ✅ Secure headers
- ✅ Environment variable protection

## 🐛 Troubleshooting

### Common Issues

**Build Errors**

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check
```

**Database Connection**

```bash
# Check MongoDB connection
mongosh "mongodb://localhost:27017/bedspace"

# Verify environment variables
echo $MONGODB_URI
```

**Authentication Issues**

```bash
# Check JWT secret
echo $JWT_SECRET

# Verify token in browser dev tools
# Application > Cookies > auth-token
```

## 📚 API Documentation

Comprehensive API documentation is available in:

- `docs/API_Documentation.md` - Detailed endpoint documentation
- `docs/BedSpace_API_Collection.postman_collection.json` - Postman collection

### Quick API Reference

- **Authentication**: `/api/auth/*`
- **Admin**: `/api/admin/*`
- **Seeker**: `/api/seeker/*`
- **Provider**: `/api/providers/*`
- **General**: `/api/search`, `/api/profile`, etc.

## 🤝 Contributing

### Development Guidelines

1. Follow TypeScript strict mode
2. Use proper error handling
3. Implement comprehensive logging
4. Write self-documenting code
5. Follow REST API conventions
6. Maintain backward compatibility

### Code Style

- Use Prettier for formatting
- Follow ESLint rules
- Use meaningful variable names
- Add JSDoc comments for complex functions
- Keep functions small and focused

## 📞 Support

For development support:

1. Check this documentation
2. Review API documentation
3. Check existing issues
4. Create detailed bug reports
5. Follow contribution guidelines

---

**Happy Coding! 🚀**
