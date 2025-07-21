# 🎵 BandVenueReview.ie API Documentation

## Base URL
- **Production**: `https://band-review-website.onrender.com/api`
- **Local Development**: `http://localhost:5000/api`

## Authentication
Admin endpoints require authentication via Bearer token:
```
Authorization: Bearer <token>
```

## Public Endpoints

### Health Check
```http
GET /health
```
**Description**: Check API status and basic metrics

**Response**:
```json
{
  "status": "healthy",
  "service": "BandVenueReview.ie API", 
  "version": "1.0.0",
  "venues": 5,
  "database": "connected"
}
```

### Debug Information
```http
GET /debug
```
**Description**: Get system debug information

**Response**:
```json
{
  "database": "SQLite: bandvenuereview.db",
  "tables": ["venues", "users", "bands", "reviews", "genres"],
  "venue_count": 5,
  "cors_enabled": true,
  "environment": "production"
}
```

### List Venues
```http
GET /venues
```
**Description**: Get paginated list of venues

**Query Parameters**:
- `page` (int): Page number (default: 1)
- `per_page` (int): Items per page (default: 6, max: 100)
- `genre` (string): Filter by genre
- `city` (string): Filter by city
- `verified` (boolean): Filter by verification status

**Response**:
```json
{
  "venues": [
    {
      "id": "uuid-string",
      "name": "Whelan's",
      "address": "25 Wexford Street", 
      "city": "Dublin",
      "county": "Dublin",
      "eircode": "D02 H527",
      "phone": "+353 1 478 0766",
      "email": "info@whelans.com",
      "website": "https://www.whelans.com",
      "capacity": 300,
      "venue_type": "live_music",
      "primary_genres": ["indie", "rock", "folk"],
      "facilities": ["professional_sound", "bar", "merchandise_area"],
      "description": "Dublin's most famous independent venue...",
      "images": ["https://example.com/image1.jpg"],
      "claimed": false,
      "verified": true,
      "average_rating": 4.5,
      "review_count": 0,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 5,
  "current_page": 1,
  "pages": 1
}
```

### Get Venue Details
```http
GET /venues/{venue_id}
```
**Description**: Get detailed information about a specific venue

**Path Parameters**:
- `venue_id` (string): UUID of the venue

**Response**:
```json
{
  "id": "uuid-string",
  "name": "Whelan's",
  "address": "25 Wexford Street",
  "city": "Dublin", 
  "county": "Dublin",
  "eircode": "D02 H527",
  "phone": "+353 1 478 0766",
  "email": "info@whelans.com",
  "website": "https://www.whelans.com",
  "capacity": 300,
  "venue_type": "live_music",
  "primary_genres": ["indie", "rock", "folk"],
  "facilities": ["professional_sound", "bar", "merchandise_area"],
  "description": "Dublin's most famous independent venue...",
  "images": ["https://example.com/image1.jpg"],
  "claimed": false,
  "verified": true,
  "average_rating": 4.5,
  "review_count": 0,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### List Genres
```http
GET /genres
```
**Description**: Get list of available music genres

**Response**:
```json
{
  "genres": [
    {
      "id": "uuid-string",
      "name": "Rock",
      "description": "Rock music genre",
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid-string", 
      "name": "Indie",
      "description": "Independent music genre",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Authentication Endpoint

### Admin Login
```http
POST /auth/login
```
**Description**: Authenticate admin user

**Request Body**:
```json
{
  "email": "admin@bandvenuereview.ie",
  "password": "admin123"
}
```

**Response**:
```json
{
  "message": "Login successful",
  "user": {
    "id": "admin-user-id",
    "email": "admin@bandvenuereview.ie",
    "user_type": "admin",
    "name": "Admin User",
    "verified": true
  },
  "access_token": "admin-token-..."
}
```

**Error Response**:
```json
{
  "error": "Invalid email or password"
}
```

## Admin Endpoints

All admin endpoints require authentication header:
```
Authorization: Bearer <admin_token>
```

### Admin Dashboard Stats
```http
GET /admin/stats
```
**Description**: Get dashboard statistics for admin panel

**Response**:
```json
{
  "total_venues": 5,
  "total_users": 0,
  "total_bands": 0,
  "total_reviews": 0,
  "verified_venues": 5,
  "unverified_venues": 0,
  "verified_users": 0,
  "unverified_users": 0,
  "recent_venues": [
    {
      "id": "uuid-string",
      "name": "Whelan's",
      "city": "Dublin",
      "verified": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "recent_users": [],
  "recent_reviews": []
}
```

### Admin Venue Management
```http
GET /admin/venues
```
**Description**: Get venues for admin management

**Query Parameters**:
- `page` (int): Page number (default: 1)
- `per_page` (int): Items per page (default: 50)
- `search` (string): Search venues by name, city, or county
- `status` (string): Filter by status ("all", "verified", "unverified")

**Response**:
```json
{
  "venues": [
    {
      "id": "uuid-string",
      "name": "Whelan's",
      "address": "25 Wexford Street",
      "city": "Dublin",
      "county": "Dublin",
      "capacity": 300,
      "venue_type": "live_music",
      "verified": true,
      "claimed": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 5,
  "pages": 1,
  "current_page": 1,
  "per_page": 50
}
```

### Update Venue
```http
PUT /admin/venues/{venue_id}
```
**Description**: Update venue information (admin only)

**Path Parameters**:
- `venue_id` (string): UUID of the venue

**Request Body**:
```json
{
  "name": "Updated Venue Name",
  "address": "New Address",
  "city": "Dublin",
  "county": "Dublin",
  "capacity": 350,
  "verified": true,
  "description": "Updated description"
}
```

**Response**:
```json
{
  "message": "Venue updated successfully",
  "venue": {
    "id": "uuid-string",
    "name": "Updated Venue Name",
    "address": "New Address",
    "verified": true,
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

### Delete Venue
```http
DELETE /admin/venues/{venue_id}
```
**Description**: Delete venue and associated reviews

**Path Parameters**:
- `venue_id` (string): UUID of the venue

**Response**:
```json
{
  "message": "Venue deleted successfully"
}
```

### Admin User Management
```http
GET /admin/users
```
**Description**: Get users for admin management

**Query Parameters**:
- `page` (int): Page number (default: 1)
- `per_page` (int): Items per page (default: 50)
- `search` (string): Search users by name or email
- `user_type` (string): Filter by type ("all", "band", "venue")
- `status` (string): Filter by status ("all", "verified", "unverified")

**Response**:
```json
{
  "users": [
    {
      "id": "uuid-string",
      "email": "user@example.com",
      "user_type": "band",
      "name": "Band Name",
      "verified": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 0,
  "pages": 0,
  "current_page": 1,
  "per_page": 50
}
```

### Update User
```http
PUT /admin/users/{user_id}
```
**Description**: Update user information (admin only)

**Path Parameters**:
- `user_id` (string): UUID of the user

**Request Body**:
```json
{
  "name": "Updated Name",
  "email": "new@example.com",
  "verified": true,
  "bio": "Updated bio"
}
```

**Response**:
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "uuid-string",
    "name": "Updated Name",
    "verified": true,
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

### Admin Review Management
```http
GET /admin/reviews
```
**Description**: Get reviews for admin moderation

**Query Parameters**:
- `page` (int): Page number (default: 1)
- `per_page` (int): Items per page (default: 50)
- `venue_id` (string): Filter reviews by venue

**Response**:
```json
{
  "reviews": [
    {
      "id": "uuid-string",
      "venue_id": "uuid-string",
      "band_id": "uuid-string",
      "title": "Great venue!",
      "review_text": "Amazing sound system and great staff...",
      "overall_rating": 5,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 0,
  "pages": 0,
  "current_page": 1,
  "per_page": 50
}
```

### Delete Review
```http
DELETE /admin/reviews/{review_id}
```
**Description**: Delete review (admin only)

**Path Parameters**:
- `review_id` (string): UUID of the review

**Response**:
```json
{
  "message": "Review deleted successfully"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Bad request",
  "message": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication failed",
  "message": "Invalid or missing authorization token"
}
```

### 403 Forbidden
```json
{
  "error": "Admin access required",
  "message": "This endpoint requires administrator privileges"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Venue not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

## Rate Limiting

Currently no rate limiting is implemented, but it's planned for future releases.

## CORS Policy

The API supports CORS for the following origins:
- `https://bandvenuereview.netlify.app`
- `http://localhost:3000` (development)

## Data Models

### Venue Model
```json
{
  "id": "string (UUID)",
  "name": "string",
  "address": "string",
  "city": "string", 
  "county": "string",
  "eircode": "string (optional)",
  "phone": "string (optional)",
  "email": "string (optional)",
  "website": "string (optional)",
  "capacity": "integer (optional)",
  "venue_type": "string",
  "primary_genres": "array of strings",
  "facilities": "array of strings",
  "description": "string (optional)",
  "images": "array of strings (optional)",
  "claimed": "boolean",
  "verified": "boolean",
  "average_rating": "float",
  "review_count": "integer",
  "created_at": "datetime (ISO 8601)",
  "updated_at": "datetime (ISO 8601)"
}
```

### User Model
```json
{
  "id": "string (UUID)",
  "email": "string",
  "user_type": "string (band|venue|admin)",
  "name": "string",
  "phone": "string (optional)",
  "website": "string (optional)",
  "bio": "string (optional)",
  "verified": "boolean",
  "created_at": "datetime (ISO 8601)",
  "updated_at": "datetime (ISO 8601)"
}
```

### Review Model
```json
{
  "id": "string (UUID)",
  "venue_id": "string (UUID)",
  "band_id": "string (UUID)",
  "title": "string",
  "review_text": "string",
  "overall_rating": "integer (1-5)",
  "sound_quality": "integer (1-5)",
  "hospitality": "integer (1-5)",
  "payment_promptness": "integer (1-5)",
  "crowd_engagement": "integer (1-5)",
  "facilities_rating": "integer (1-5)",
  "performance_date": "date",
  "would_return": "boolean",
  "created_at": "datetime (ISO 8601)",
  "updated_at": "datetime (ISO 8601)"
}
```

### Genre Model
```json
{
  "id": "string (UUID)",
  "name": "string",
  "description": "string (optional)",
  "created_at": "datetime (ISO 8601)"
}
```

## Example Usage

### JavaScript/React Example
```javascript
// Get all venues
const response = await fetch('https://band-review-website.onrender.com/api/venues');
const data = await response.json();
console.log(data.venues);

// Admin login
const loginResponse = await fetch('https://band-review-website.onrender.com/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@bandvenuereview.ie',
    password: 'admin123'
  })
});
const loginData = await loginResponse.json();
const token = loginData.access_token;

// Make authenticated admin request
const adminResponse = await fetch('https://band-review-website.onrender.com/api/admin/stats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const adminData = await adminResponse.json();
```

### cURL Examples
```bash
# Get health status
curl https://band-review-website.onrender.com/api/health

# Get venues
curl https://band-review-website.onrender.com/api/venues

# Admin login
curl -X POST https://band-review-website.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bandvenuereview.ie","password":"admin123"}'

# Get admin stats (replace TOKEN with actual token)
curl https://band-review-website.onrender.com/api/admin/stats \
  -H "Authorization: Bearer TOKEN"
```

This API documentation covers all current endpoints and functionality of the BandVenueReview.ie platform.
