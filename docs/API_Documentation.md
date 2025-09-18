# BedSpace API Documentation

## Overview

BedSpace is a comprehensive bed space rental platform that connects seekers with providers. This documentation covers all available API endpoints, authentication methods, and data structures.

## Base URL

```
http://localhost:3001
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Getting Started

1. **Register a new user** or **login** to get an authentication token
2. **Include the token** in all subsequent requests
3. **Use role-based endpoints** based on your user role (seeker, provider, admin)

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register

Register a new user account.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 9876543210",
  "password": "password123",
  "role": "seeker" // or "provider"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "seeker",
      "isVerified": false
    },
    "token": "jwt_token_here"
  }
}
```

#### POST /api/auth/login

Login with email and password.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "seeker",
      "isVerified": true
    },
    "token": "jwt_token_here"
  }
}
```

#### GET /api/auth/me

Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "seeker",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/auth/logout

Logout current user.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Admin Endpoints

All admin endpoints require `role: "admin"` and valid authentication.

#### GET /api/admin/stats

Get platform statistics overview.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "totalProviders": 320,
    "totalSeekers": 890,
    "pendingProviders": 45,
    "approvedProviders": 275,
    "rejectedProviders": 12,
    "totalListings": 680,
    "activeListings": 520,
    "totalBookings": 1840,
    "revenue": 2450000
  }
}
```

#### GET /api/admin/users

Get all users with filtering and pagination.

**Query Parameters:**

- `role` (optional): Filter by role (all, seeker, provider, admin)
- `search` (optional): Search by name or email
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "seeker",
      "isVerified": true,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLogin": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "pages": 25
  }
}
```

#### POST /api/admin/users/:userId/:action

Perform actions on users (activate, deactivate, verify).

**Parameters:**

- `userId`: User ID
- `action`: Action to perform (activate, deactivate, verify)

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "User activated successfully"
}
```

#### GET /api/admin/listings

Get all listings with filtering.

**Query Parameters:**

- `status` (optional): Filter by status (all, active, pending, inactive, rejected)
- `type` (optional): Filter by type (all, private_room, shared_room, entire_place)
- `search` (optional): Search by title, location, or provider

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "listing_id",
      "title": "Modern Private Room with AC",
      "location": "Bandra West, Mumbai",
      "price": 15000,
      "provider": {
        "_id": "provider_id",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "status": "active",
      "type": "private_room",
      "amenities": ["wifi", "ac", "kitchen"],
      "rating": 4.5,
      "reviewCount": 23,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/admin/listings/:listingId/:action

Perform actions on listings (approve, reject, activate, deactivate).

**Parameters:**

- `listingId`: Listing ID
- `action`: Action to perform (approve, reject, activate, deactivate)

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Listing approved and activated successfully",
  "data": {
    "listingId": "listing_id",
    "newStatus": "active",
    "action": "approve"
  }
}
```

#### GET /api/admin/bookings

Get all bookings with filtering.

**Query Parameters:**

- `status` (optional): Filter by status (all, pending, approved, rejected, cancelled, completed)
- `paymentStatus` (optional): Filter by payment status (all, pending, paid, failed, refunded)
- `search` (optional): Search by seeker, provider, or listing

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "booking_id",
      "seeker": {
        "_id": "seeker_id",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+91 9876543210"
      },
      "provider": {
        "_id": "provider_id",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "listing": {
        "_id": "listing_id",
        "title": "Modern Private Room",
        "location": "Bandra West, Mumbai",
        "price": 15000
      },
      "status": "approved",
      "checkIn": "2024-02-01T00:00:00.000Z",
      "duration": 6,
      "totalAmount": 90000,
      "paymentStatus": "paid",
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

#### GET /api/admin/analytics

Get platform analytics data.

**Query Parameters:**

- `range` (optional): Time range (7d, 30d, 90d, 1y) - default: 30d

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalRevenue": 2450000,
      "revenueGrowth": 15.5,
      "totalBookings": 1840,
      "bookingsGrowth": 12.3,
      "activeUsers": 750,
      "userGrowth": 8.7,
      "averageRating": 4.5,
      "ratingChange": 2.1
    },
    "userMetrics": {
      "newUsers": 85,
      "activeUsers": 750,
      "retentionRate": 78,
      "conversionRate": 22
    },
    "listingMetrics": {
      "totalListings": 680,
      "activeListings": 520,
      "averagePrice": 16500,
      "occupancyRate": 76
    },
    "bookingMetrics": {
      "totalBookings": 1840,
      "completedBookings": 1520,
      "cancelledBookings": 85,
      "averageBookingValue": 55000
    },
    "topPerformers": {
      "topProviders": [
        {
          "name": "Rajesh Kumar",
          "bookings": 28,
          "revenue": 420000,
          "rating": 4.8
        }
      ],
      "topListings": [
        {
          "title": "Luxury Studio in Bandra",
          "location": "Bandra West, Mumbai",
          "bookings": 18,
          "revenue": 540000
        }
      ]
    }
  }
}
```

---

### Seeker Endpoints

All seeker endpoints require `role: "seeker"` and valid authentication.

#### GET /api/seeker/stats

Get seeker dashboard statistics.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "savedListings": 12,
    "activeBookings": 3,
    "messages": 8,
    "searchAlerts": 2
  }
}
```

#### GET /api/seeker/activities

Get recent seeker activities.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "search",
      "title": "Searched for \"Private room in Bandra\"",
      "time": "2 hours ago",
      "icon": "Search",
      "color": "text-blue-500"
    }
  ]
}
```

#### GET /api/seeker/favorites

Get seeker's saved/favorite listings.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Modern Private Room",
      "location": "Bandra West, Mumbai",
      "price": 12000,
      "rating": "4.8",
      "provider": "John Smith",
      "amenities": ["wifi", "ac", "kitchen"],
      "status": "available",
      "savedDate": "2024-01-15"
    }
  ]
}
```

#### GET /api/seeker/bookings

Get seeker's booking history.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Modern Private Room",
      "provider": "John Smith",
      "status": "approved",
      "requestDate": "2024-01-16",
      "moveInDate": "2024-02-01",
      "price": 12000
    }
  ]
}
```

---

### Search & Location Endpoints

#### GET /api/search

Search for listings with filters.

**Query Parameters:**

- `location` (optional): Location to search in
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `type` (optional): Listing type (private_room, shared_room, entire_place)
- `amenities` (optional): Comma-separated amenities
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**

```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": 1,
        "title": "Modern Private Room",
        "location": "Bandra West, Mumbai",
        "price": 15000,
        "rating": 4.5,
        "reviewCount": 23,
        "amenities": ["wifi", "ac", "kitchen"],
        "images": ["/images/listing-1.jpg"],
        "provider": {
          "name": "Jane Smith",
          "rating": 4.7
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 45,
      "pages": 4
    }
  }
}
```

#### POST /api/location/detect

Detect location from coordinates.

**Request Body:**

```json
{
  "latitude": 19.076,
  "longitude": 72.8777
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "location": "Bandra West, Mumbai, Maharashtra, India",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India"
  }
}
```

---

### Activities & Tracking

#### GET /api/activities/recent

Get recent user activities and system events.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `limit` (optional): Number of activities to return (max 50, default 10)
- `userRole` (optional): Filter by user role (admin only)
- `userId` (optional): Filter by specific user ID (admin only)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "activity_id",
      "action": "login",
      "description": "User logged in successfully",
      "details": {},
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "seeker"
      },
      "userRole": "seeker",
      "ipAddress": "192.168.1.1",
      "createdAt": "2024-01-15T10:30:00Z",
      "timeAgo": "2 hours ago"
    }
  ],
  "total": 10
}
```

---

### Notifications & Messages

#### GET /api/notifications

Get user notifications with filtering options.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `filter` (optional): Filter type (all, read, unread) - default: all
- `category` (optional): Category filter (all, booking, message, listing, verification, payment, system) - default: all
- `limit` (optional): Number of notifications to return - default: 20

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "notif_id",
      "title": "Booking Confirmed",
      "message": "Your booking has been confirmed",
      "type": "success",
      "category": "booking",
      "isRead": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "actionUrl": "/bookings/123"
    }
  ],
  "total": 5
}
```

#### GET /api/notifications/count

Get unread notification count.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

#### GET /api/messages/conversations

Get user's message conversations.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "conv_123",
      "participants": [
        {
          "id": "user_456",
          "name": "John Doe",
          "avatar": "/avatars/john.jpg"
        }
      ],
      "lastMessage": {
        "content": "Is the room still available?",
        "timestamp": "2024-01-15T10:30:00Z",
        "sender": "user_456"
      },
      "unreadCount": 2
    }
  ]
}
```

#### GET /api/messages/unread-count

Get unread message count.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

#### GET /api/payments

Get user's payment history.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

- `status` (optional): Filter by payment status (pending, completed, failed)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**

```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "pay_123",
        "amount": 15000,
        "status": "completed",
        "type": "booking_payment",
        "description": "Booking payment for Cozy Room in Mumbai",
        "date": "2024-01-15T10:30:00Z",
        "method": "upi",
        "transactionId": "TXN123456789"
      }
    ],
    "summary": {
      "totalPaid": 45000,
      "pendingAmount": 5000,
      "totalTransactions": 8
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8,
      "pages": 1
    }
  }
}
```

---

### Profile Management

#### GET /api/profile

Get current user's profile information.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91 9876543210",
    "role": "seeker",
    "bio": "Looking for comfortable accommodation",
    "location": "Mumbai, Maharashtra",
    "isVerified": true,
    "isEmailVerified": true,
    "isPhoneVerified": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLogin": "2024-01-15T10:30:00Z"
  }
}
```

#### PUT /api/profile

Update current user's profile information.

**Headers:**

- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "name": "Updated Name",
  "phone": "+91 9876543210",
  "bio": "Updated bio description",
  "location": "Mumbai, Maharashtra",
  "businessName": "Business Name (for providers)"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    // Updated user object
  }
}
```

---

### Admin Reports & Settings

#### GET /api/admin/reports

Get comprehensive platform reports and analytics.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Query Parameters:**

- `timeRange` (optional): Time range (7d, 30d, 90d) - default: 30d

**Response:**

```json
{
  "success": true,
  "data": {
    "userReports": {
      "totalUsers": 1250,
      "newUsersThisMonth": 85,
      "activeUsers": 750,
      "usersByRole": [
        { "role": "seeker", "count": 890 },
        { "role": "provider", "count": 320 },
        { "role": "admin", "count": 40 }
      ]
    },
    "listingReports": {
      "totalListings": 680,
      "activeListings": 520,
      "pendingApproval": 45,
      "averagePrice": 12500,
      "listingsByLocation": [
        { "location": "Bandra West, Mumbai", "count": 102 },
        { "location": "Andheri East, Mumbai", "count": 82 }
      ]
    },
    "bookingReports": {
      "totalBookings": 1840,
      "completedBookings": 1520,
      "totalRevenue": 2450000,
      "averageBookingValue": 55000,
      "bookingsByMonth": [{ "month": "Jan 2024", "count": 320, "revenue": 480000 }]
    },
    "activityReports": {
      "totalActivities": 5420,
      "topActions": [
        { "action": "login", "count": 1250 },
        { "action": "search", "count": 890 }
      ],
      "dailyActivity": [{ "date": "Jan 15", "count": 145 }]
    }
  }
}
```

#### GET /api/admin/settings

Get platform configuration settings.

**Headers:** `Authorization: Bearer <token>` (Admin only)

**Response:**

```json
{
  "success": true,
  "data": {
    "general": {
      "platformName": "BedSpace",
      "platformDescription": "Find comfortable and affordable bed spaces in Mumbai",
      "supportEmail": "support@bedspace.com",
      "maintenanceMode": false,
      "registrationEnabled": true
    },
    "booking": {
      "maxBookingDuration": 365,
      "minBookingDuration": 1,
      "cancellationPolicy": "Free cancellation up to 24 hours before check-in.",
      "autoApprovalEnabled": false,
      "bookingFee": 5.0
    },
    "verification": {
      "autoVerifyProviders": false,
      "requiredDocuments": ["Aadhaar Card", "PAN Card", "Property Documents", "Photo"],
      "verificationTimeout": 7
    },
    "notifications": {
      "emailNotifications": true,
      "smsNotifications": true,
      "pushNotifications": true,
      "adminAlerts": true
    },
    "security": {
      "passwordMinLength": 8,
      "sessionTimeout": 1440,
      "maxLoginAttempts": 5,
      "twoFactorRequired": false
    }
  }
}
```

#### PUT /api/admin/settings

Update platform configuration settings.

**Headers:**

- `Authorization: Bearer <token>` (Admin only)
- `Content-Type: application/json`

**Request Body:**

```json
{
  "general": {
    "platformName": "BedSpace",
    "platformDescription": "Updated description",
    "supportEmail": "support@bedspace.com",
    "maintenanceMode": false,
    "registrationEnabled": true
  }
  // ... other setting sections
}
```

**Response:**

```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    // Updated settings object
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **General endpoints**: 100 requests per minute
- **Admin endpoints**: 200 requests per minute

---

## Data Models

### User Model

```typescript
interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'seeker' | 'provider' | 'admin';
  isVerified: boolean;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}
```

### Listing Model

```typescript
interface Listing {
  _id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  type: 'private_room' | 'shared_room' | 'entire_place';
  amenities: string[];
  images: string[];
  provider: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### Booking Model

```typescript
interface Booking {
  _id: string;
  seeker: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  provider: {
    _id: string;
    name: string;
    email: string;
  };
  listing: {
    _id: string;
    title: string;
    location: string;
    price: number;
  };
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  checkIn: string;
  checkOut?: string;
  duration: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
}
```

---

## Getting Started with Postman

1. **Import the Collection**: Import `BedSpace_API_Collection.postman_collection.json`
2. **Set Base URL**: Update the `base_url` variable to your server URL
3. **Login**: Use the "Login User" request to get an authentication token
4. **Auto-token**: The collection automatically saves the token for subsequent requests
5. **Test Endpoints**: All endpoints are organized by category for easy testing

---

## Support

For API support or questions:

- **Email**: dev@bedspace.com
- **Documentation**: This file
- **Postman Collection**: Use the provided collection for testing

---

---

## Environment Setup

### Prerequisites

- Node.js 18+
- MongoDB 5.0+
- MinIO (for file storage)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd bedspace

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/bedspace

# JWT
JWT_SECRET=your-super-secret-jwt-key

# MinIO (File Storage)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=bedspace-uploads

# App
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Default Admin Account

```
Email: admin@bedspace.com
Password: admin123
```

_Last updated: January 2024_
