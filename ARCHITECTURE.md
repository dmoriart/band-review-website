# Band Review Website - New Authentication Architecture

## Overview
Moving from Firebase-only authentication to a hybrid approach:
- **Firebase Auth**: User identity verification only
- **Backend Database**: Band ownership and permissions storage
- **API-based**: All band operations go through backend endpoints

## Architecture Components

### 1. Backend API (Node.js/Express + PostgreSQL/MongoDB)
```
/api/auth/verify          - Verify Firebase token
/api/bands/:id/claim      - Submit band claim request
/api/bands/:id/ownership  - Check if user can edit band
/api/bands/:id/edit       - Update band information
/api/admin/claims         - List pending claims (admin only)
/api/admin/claims/:id/approve - Approve/reject claims
```

### 2. Database Schema
```sql
-- Users table (synced from Firebase Auth)
users (
  id VARCHAR PRIMARY KEY,           -- Firebase UID
  email VARCHAR UNIQUE,
  display_name VARCHAR,
  created_at TIMESTAMP,
  last_login TIMESTAMP
)

-- Band ownership relationships
band_ownership (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  band_id VARCHAR,                  -- Sanity band _id
  band_name VARCHAR,
  role ENUM('owner', 'editor'),
  status ENUM('pending', 'approved', 'rejected'),
  claim_method ENUM('email', 'social', 'manual'),
  verification_data JSONB,
  requested_at TIMESTAMP,
  approved_at TIMESTAMP,
  approved_by VARCHAR REFERENCES users(id)
)
```

### 3. Frontend Changes
- Remove direct Firestore operations
- Add API client for backend communication
- Send Firebase ID tokens with requests
- Handle backend responses for permissions

## Benefits
✅ **Performance**: No more slow Firestore queries
✅ **Scalability**: Database optimized for queries
✅ **Security**: Server-side permission validation
✅ **Flexibility**: Easy to add complex permission logic
✅ **Debugging**: Standard database query tools
✅ **Caching**: Can implement API response caching

## Implementation Plan
1. Set up backend API server
2. Create database and tables
3. Implement Firebase token verification
4. Build band ownership endpoints
5. Update frontend to use APIs
6. Migrate existing data (if any)
7. Deploy and test

## Migration Strategy
- Keep existing Firebase Auth for users
- Migrate any existing Firestore band relationships to new DB
- Update frontend gradually (feature by feature)
- Remove Firestore dependencies once migration complete
