# 🚀 New Architecture Setup Guide

## Overview
We've created a new hybrid authentication system that separates concerns:
- **Firebase Auth**: User identity only
- **Backend API**: Band ownership and permissions
- **PostgreSQL**: Fast, reliable data storage

## 🏗️ Architecture Benefits

### ✅ **Performance Improvements**
- No more 28+ second Firestore queries
- Database optimized for band ownership queries  
- Server-side caching capabilities
- No "client is offline" issues

### ✅ **Better Security**
- Server-side token verification
- Centralized permission logic
- SQL injection protection
- Rate limiting built-in

### ✅ **Scalability**
- Standard database operations
- Easy to add complex queries
- Better debugging tools
- Horizontal scaling possible

## 📦 **What's Been Created**

### Backend API (`/backend/`)
```
backend/
├── src/
│   ├── server.js              # Express server setup
│   ├── middleware/
│   │   ├── auth.js            # Firebase token verification
│   │   └── errorHandler.js    # Error handling
│   ├── routes/
│   │   ├── auth.js            # Auth endpoints
│   │   ├── bands.js           # Band operations
│   │   └── admin.js           # Admin functions
│   ├── database/
│   │   └── db.js              # PostgreSQL connection
│   └── migrate.js             # Database setup
├── package.json               # Dependencies
└── .env.example               # Environment variables
```

### Frontend Updates
- `apiClient.ts` - New API client for backend communication
- `BandClaimModalV2.tsx` - Updated modal using API instead of Firestore

## 🛠️ **Setup Instructions**

### 1. **Install PostgreSQL**
```bash
# macOS with Homebrew
brew install postgresql
brew services start postgresql

# Create database
createdb band_review_db
```

### 2. **Setup Backend**
```bash
cd backend
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your settings:
# - DATABASE_URL=postgresql://username:password@localhost:5432/band_review_db
# - Firebase service account path or credentials
# - ALLOWED_ORIGINS with your frontend URL

# Run database migration
npm run db:migrate

# Start development server
npm run dev
```

### 3. **Update Frontend Environment**
```bash
# Add to frontend/.env.local
REACT_APP_API_URL=http://localhost:3001/api
```

### 4. **Firebase Service Account Setup**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate new private key (downloads JSON file)
3. Place file in `backend/config/firebase-service-account.json`
4. OR set environment variables in `.env`

## 🔄 **Migration Strategy**

### Phase 1: Parallel Systems (Current)
- Keep existing Firestore system running
- Add new API backend alongside
- Test with BandClaimModalV2

### Phase 2: Gradual Migration
- Replace BandClaimModal with BandClaimModalV2
- Update BandEditForm to use API
- Migrate any existing Firestore data

### Phase 3: Complete Transition
- Remove all Firestore dependencies
- Update all components to use API
- Remove bandUserService.ts

## 📡 **API Endpoints**

### Authentication
- `POST /api/auth/verify` - Verify Firebase token & sync user
- `GET /api/auth/me` - Get current user profile

### Band Operations
- `POST /api/bands/:bandId/claim` - Submit band claim
- `GET /api/bands/:bandId/ownership` - Check ownership
- `GET /api/bands/my-bands` - Get user's bands
- `GET /api/bands/my-claims` - Get user's claims

### Admin Functions
- `GET /api/admin/claims` - List pending claims
- `POST /api/admin/claims/:id/approve` - Approve claim
- `POST /api/admin/claims/:id/reject` - Reject claim
- `GET /api/admin/stats` - Dashboard statistics

## 🧪 **Testing the New System**

### 1. **Start Backend**
```bash
cd backend
npm run dev
# Should see: "🚀 Backend server running on port 3001"
```

### 2. **Test API Health**
```bash
curl http://localhost:3001/health
# Should return: {"status":"OK","timestamp":"..."}
```

### 3. **Test Authentication**
```bash
# Get Firebase token from browser (F12 → Application → IndexedDB)
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
     http://localhost:3001/api/auth/verify
```

### 4. **Update Frontend Components**
Replace BandClaimModal with BandClaimModalV2 in BandsPage.tsx

## 🚀 **Immediate Benefits**

Once you set this up, you'll get:
- ✅ **Instant performance improvement** - no more 28s queries
- ✅ **No more "client is offline" errors**
- ✅ **Reliable band claim submissions**
- ✅ **Better error messages and debugging**
- ✅ **Admin dashboard for managing claims**

## 🤔 **Need Help?**

If you run into any issues:
1. Check backend logs for detailed error messages
2. Verify PostgreSQL is running: `pg_isready`
3. Test API endpoints with curl/Postman
4. Check Firebase service account permissions

The new system is designed to be much more reliable and performant than the current Firestore-only approach!
