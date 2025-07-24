# Band Venue Review - Backend API

Complete Node.js backend implementation for the venue ownership system.

## ✅ Implementation Status

### **🎯 COMPLETE - Venue Ownership System**

All venue ownership functionality has been successfully implemented:

### **Database Architecture**
- ✅ SQLite database for development (with PostgreSQL support ready)
- ✅ Complete schema with users, venue_claims, venue_owners, venue_edits, etc.
- ✅ Sample data with admin user and 3 venues
- ✅ Database adapter supporting both SQLite and PostgreSQL

### **API Endpoints**

#### **User Management** (`/api/user/`)
- ✅ `GET /profile` - Get user profile with owned venues and pending claims
- ✅ `PUT /profile` - Update user profile and notification preferences

#### **Venue Claims** (`/api/claims/`)
- ✅ `POST /submit` - Submit venue ownership/management claim
- ✅ `GET /user` - Get user's claims
- ✅ `GET /pending` - Get pending claims (admin only)
- ✅ `PUT /:id/review` - Review claim (admin only)

#### **Venue Management** (`/api/venues/`)
- ✅ `GET /owned` - Get venues owned by user
- ✅ `GET /:id/ownership` - Get venue ownership details
- ✅ `PUT /:id` - Update venue information (with permissions check)
- ✅ `GET /:id/reviews` - Get venue reviews (owners only)
- ✅ `POST /:venueId/reviews/:reviewId/respond` - Respond to reviews

### **Authentication & Security**
- ✅ Firebase Auth integration with automatic user sync
- ✅ Role-based permissions (owner, manager, editor)
- ✅ Admin access control
- ✅ Request validation with Joi
- ✅ Rate limiting and security headers

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Set Up Database
```bash
# Initialize SQLite database with venue ownership tables
node src/database/migrate-sqlite.js
```

### 3. Configure Environment
```bash
# Copy and update environment variables
cp .env.example .env
# Add your Firebase credentials to .env
```

### 4. Start Development Server
```bash
npm run dev
# or
node src/server.js
```

The server will start on `http://localhost:3001`

## 🔧 Environment Variables

Required variables for `.env`:

```env
# Node.js Configuration
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=sqlite:///bandvenuereview_dev.db

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Admin Configuration
ADMIN_EMAILS=admin@bandvenuereview.ie

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

## 📊 Database Schema

### Core Tables:
- **`users`** - User profiles with Firebase sync
- **`venues`** - Venue information
- **`venue_claims`** - Ownership/management claims
- **`venue_owners`** - Approved venue ownership with roles/permissions
- **`venue_edits`** - Edit history tracking
- **`reviews`** - User reviews
- **`review_responses`** - Owner responses to reviews

## 🔐 Authentication Flow

1. **Frontend** sends Firebase ID token in Authorization header
2. **Backend** verifies token with Firebase Admin SDK
3. **User Sync** creates/updates user in local database
4. **Permissions** checked based on venue ownership and roles

## 🎯 API Testing

### Health Check
```bash
curl http://localhost:3001/health
```

### Test User Profile (requires Firebase token)
```bash
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
     http://localhost:3001/api/user/profile
```

## 🚀 Production Deployment

### Switch to PostgreSQL
1. Update `DATABASE_URL` in .env:
```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

2. Run PostgreSQL migration:
```bash
node src/database/init-venue-ownership.js
```

### Firebase Setup
1. Create Firebase project
2. Enable Authentication
3. Download service account key
4. Add credentials to environment variables

## 📁 Project Structure

```
backend/
├── src/
│   ├── routes/
│   │   ├── user.js          # User profile management
│   │   ├── claims.js        # Venue ownership claims
│   │   ├── venues.js        # Venue management
│   │   ├── auth.js          # Authentication (existing)
│   │   ├── bands.js         # Band management (existing)
│   │   └── admin.js         # Admin functions (existing)
│   ├── middleware/
│   │   ├── auth.js          # Firebase Auth + user sync
│   │   └── errorHandler.js  # Error handling (existing)
│   ├── database/
│   │   ├── db-adapter.js           # Multi-database adapter
│   │   ├── migrate-sqlite.js       # SQLite migration
│   │   └── init-venue-ownership.js # PostgreSQL migration
│   └── server.js            # Main server setup
├── package.json
├── .env.example
└── README.md
```

## 🔗 Integration with Frontend

The backend is fully compatible with the React components created:

- **`VenueClaimButton.js`** → `/api/claims/submit`
- **`VenueOwnerDashboard.js`** → `/api/venues/owned`, `/api/user/profile`
- **`AdminClaimsManager.js`** → `/api/claims/pending`, `/api/claims/:id/review`
- **`UserProfile.js`** → `/api/user/profile`

## 📝 Sample Data

The migration includes:
- 1 admin user (`admin@bandvenuereview.ie`)
- 3 sample venues (Olympia Theatre, Vicar Street, Cyprus Avenue)

## ⚡ Next Steps

1. **Add Firebase Credentials** to `.env` file
2. **Test API Endpoints** with your frontend
3. **Deploy to Production** with PostgreSQL
4. **Add Email Notifications** for claim updates
5. **Implement File Uploads** for business documents

---

## 🎉 System Complete

The venue ownership system is now **fully implemented** and ready for integration with your React frontend components!
