# 🎵 BandVenueReview.ie - Technical Documentation

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Features & Capabilities](#features--capabilities)
- [Code Structure](#code-structure)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Authentication System](#authentication-system)
- [Admin Panel](#admin-panel)
- [Deployment](#deployment)
- [Development Guide](#development-guide)

## Overview

BandVenueReview.ie is a full-stack web application designed to connect Irish musicians with live music venues. The platform allows bands to review venues after performances, helping other artists make informed decisions about where to perform.

### Technology Stack
- **Frontend**: React 18+ with TypeScript
- **Backend**: Flask 3.1.1 (Python)
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT tokens with custom decorators
- **Deployment**: Netlify (frontend) + Render.com (backend)
- **Styling**: Custom CSS with glassmorphism effects

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   Flask API     │    │   Database      │
│   (Netlify)     │◄──►│   (Render.com)  │◄──►│   (SQLite/PG)   │
│                 │    │                 │    │                 │
│ - Components    │    │ - Routes        │    │ - Venues        │
│ - State Mgmt    │    │ - Models        │    │ - Users         │
│ - API Calls     │    │ - Auth          │    │ - Reviews       │
│ - Admin Panel   │    │ - Admin APIs    │    │ - Genres        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Features & Capabilities

### 🎸 Core User Features

#### **Venue Discovery**
- Browse Irish venues by location, genre, capacity
- Filter by verified status and ratings
- View detailed venue information including:
  - Capacity and venue type
  - Contact information and website
  - Facilities (sound system, parking, etc.)
  - Average ratings from band reviews
  - Geographic information (city, county)

#### **Venue Information Display**
- Real-time venue data from Irish music scene
- Venue classifications: pubs, clubs, arenas, halls
- Genre preferences for each venue
- Contact details and booking information

### 🛠️ Admin Panel Features

#### **Dashboard Overview**
- Real-time statistics dashboard
- Total counts: venues, users, bands, reviews
- Verification status tracking
- Recent activity monitoring
- Visual status indicators (✅ verified, ⏳ pending)

#### **Venue Management**
- Complete venue directory with pagination
- Search and filter functionality
- Quick verification controls
- Edit venue details:
  - Basic information (name, address, capacity)
  - Contact details (phone, website, email)
  - Venue type and genre preferences
  - Facilities and descriptions
- Delete venues with cascade review removal

#### **User Management**
- User directory with type indicators (🎸 Band, 🏛️ Venue)
- User verification system
- Search by name or email
- Filter by user type and verification status
- Account status management

#### **Review Moderation**
- Review management interface
- Delete inappropriate or fake reviews
- Rating visualization with star display
- Review timeline tracking
- Venue-specific review filtering

### 🔐 Authentication System

#### **Admin Access**
- Secure admin login portal
- Token-based authentication
- Role-based access control
- Session management with logout
- Admin-only route protection

## Code Structure

### Frontend Architecture (`/frontend/src/`)

#### **App.tsx - Main Application**
```typescript
// State Management
const [venues, setVenues] = useState<Venue[]>([]);
const [currentView, setCurrentView] = useState<'home' | 'venues' | 'login' | 'admin'>('home');
const [isAdmin, setIsAdmin] = useState<boolean>(false);

// Core Functions
- checkApiHealth(): Monitors backend connectivity
- fetchVenues(): Retrieves venue data with pagination
- handleAdminLogin(): Processes admin authentication
- renderHome/Venues/Login/AdminLogin(): View controllers
```

#### **AdminPanel.tsx - Admin Interface**
```typescript
// Admin State Management
const [stats, setStats] = useState<AdminStats | null>(null);
const [activeTab, setActiveTab] = useState<'dashboard' | 'venues' | 'users' | 'reviews'>('dashboard');

// API Operations
- fetchWithAuth(): Authenticated API requests
- loadStats/Venues/Users/Reviews(): Data loading
- updateVenue/User(): Record modification
- deleteVenue/Review(): Record deletion
```

#### **Styling (App.css)**
- Responsive design with mobile-first approach
- Dark theme with glassmorphism effects
- Admin panel styling with tabbed interface
- Custom components: buttons, forms, tables, cards

### Backend Architecture (`/backend/`)

#### **app_simple.py - Production Flask App**
```python
# Route Structure
/api/health              # Health check endpoint
/api/debug               # Debug information
/api/venues              # Public venue listing
/api/venues/<id>         # Individual venue details
/api/genres              # Music genre listing
/api/auth/login          # Admin authentication

# Admin Routes (Protected)
/api/admin/stats         # Dashboard statistics
/api/admin/venues        # Venue management
/api/admin/users         # User management  
/api/admin/reviews       # Review moderation
```

#### **models.py - Database Models**
```python
# Core Models
class User(db.Model):          # Base user accounts
class Band(db.Model):          # Band-specific data
class Venue(db.Model):         # Venue information
class Review(db.Model):        # Band venue reviews
class Genre(db.Model):         # Music genres

# Model Features
- UUID primary keys for security
- Timestamp tracking (created_at, updated_at)
- Relationship mapping between entities
- JSON serialization methods
- Password hashing for security
```

#### **auth.py - Authentication System**
```python
# Decorators
@token_required           # Basic JWT validation
@admin_required          # Admin access control
@band_required           # Band user validation
@venue_owner_required    # Venue owner validation

# Validation Functions
validate_user_data()     # User registration validation
validate_review_data()   # Review submission validation
```

#### **config.py - Configuration Management**
```python
# Environment-based configuration
class DevelopmentConfig:     # Local development
class ProductionConfig:      # Live deployment
class TestingConfig:         # Unit testing

# Features
- Database URL management
- Security key configuration
- CORS origin settings
- Debug mode control
```

## API Documentation

### Public Endpoints

#### `GET /api/health`
Returns API health status and basic metrics.
```json
{
  "status": "healthy",
  "service": "BandVenueReview.ie API",
  "version": "1.0.0",
  "venues": 5,
  "database": "connected"
}
```

#### `GET /api/venues`
Retrieves paginated venue listings with optional filters.
```json
{
  "venues": [...],
  "total": 5,
  "current_page": 1,
  "pages": 1
}
```

#### `GET /api/genres`
Returns available music genres.
```json
{
  "genres": ["Rock", "Indie", "Folk", "Electronic", ...]
}
```

### Admin Endpoints (Authentication Required)

#### `POST /api/auth/login`
Admin authentication endpoint.
```json
// Request
{
  "email": "admin@bandvenuereview.ie",
  "password": "admin123"
}

// Response
{
  "message": "Login successful",
  "user": {...},
  "access_token": "admin-token-..."
}
```

#### `GET /api/admin/stats`
Dashboard statistics for admin panel.
```json
{
  "total_venues": 5,
  "total_users": 0,
  "total_bands": 0,
  "total_reviews": 0,
  "verified_venues": 5,
  "unverified_venues": 0,
  "recent_venues": [...],
  "recent_users": [...],
  "recent_reviews": [...]
}
```

#### `GET /api/admin/venues`
Admin venue management with search and pagination.
```json
{
  "venues": [...],
  "total": 5,
  "pages": 1,
  "current_page": 1,
  "per_page": 50
}
```

#### `PUT /api/admin/venues/<venue_id>`
Update venue information (admin only).
```json
// Request
{
  "name": "Updated Venue Name",
  "verified": true,
  "capacity": 300
}

// Response
{
  "message": "Venue updated successfully",
  "venue": {...}
}
```

## Database Schema

### Core Tables

#### **users**
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `password_hash` (String)
- `user_type` (String: 'band' | 'venue')
- `name` (String)
- `verified` (Boolean)
- `created_at` / `updated_at` (Timestamp)

#### **venues**
- `id` (UUID, Primary Key)
- `name` (String)
- `address`, `city`, `county` (String)
- `capacity` (Integer)
- `venue_type` (String)
- `verified` (Boolean)
- `primary_genres` (JSON Array)
- `facilities` (JSON Array)
- `contact information` (phone, email, website)

#### **bands**
- `id` (UUID, Primary Key)
- `user_id` (Foreign Key → users)
- `genre`, `location` (String)
- `member_count` (Integer)
- `formation_year` (Integer)

#### **reviews**
- `id` (UUID, Primary Key)
- `venue_id` (Foreign Key → venues)
- `band_id` (Foreign Key → bands)
- `ratings` (sound_quality, hospitality, payment_promptness, etc.)
- `title`, `review_text` (String)
- `overall_rating` (Integer 1-5)

### Sample Data
The database is seeded with 5 Irish venues:
- **Whelan's** (Dublin) - Independent music venue
- **Cyprus Avenue** (Cork) - Live music venue
- **Button Factory** (Dublin) - Electronic/alternative venue
- **Monroe's Tavern** (Galway) - Traditional pub with sessions
- **The Workman's Club** (Dublin) - Multi-level venue

## Authentication System

### Admin Authentication Flow
1. **Login Request**: Admin submits credentials via `/api/auth/login`
2. **Validation**: Server validates against admin credentials
3. **Token Generation**: Simple token created for session management
4. **Frontend Storage**: Token stored in React state
5. **Request Authorization**: Token included in API requests
6. **Route Protection**: Admin routes validate token

### Security Features
- **Password Protection**: Admin credentials required
- **Token Validation**: All admin requests validated
- **Route Protection**: Admin decorators protect sensitive endpoints
- **Session Management**: Logout clears tokens and redirects

## Admin Panel

### Technical Implementation

#### **Component Structure**
```typescript
AdminPanel
├── AdminHeader (title, logout)
├── AdminNav (tab navigation)
└── AdminContent
    ├── Dashboard (stats, recent activity)
    ├── VenueManagement (CRUD operations)
    ├── UserManagement (verification, search)
    └── ReviewModeration (delete, filter)
```

#### **State Management**
- Real-time data loading with useEffect hooks
- Tab-based navigation with conditional rendering
- Error handling and loading states
- Optimistic updates with server confirmation

#### **API Integration**
- Authenticated requests with Bearer token
- CRUD operations for all admin functions
- Error handling with user feedback
- Pagination and search functionality

### User Interface Features
- **Responsive Design**: Mobile and desktop optimized
- **Dark Theme**: Consistent with main site branding
- **Intuitive Navigation**: Tab-based interface
- **Real-time Updates**: Immediate feedback on actions
- **Status Indicators**: Visual verification status
- **Confirmation Dialogs**: Prevent accidental deletions

## Deployment

### Production URLs
- **Frontend**: https://bandvenuereview.netlify.app
- **Backend API**: https://band-review-website.onrender.com

### Deployment Architecture
```
GitHub Repository
├── Frontend Branch → Netlify (Auto-deploy)
└── Backend Branch → Render.com (Auto-deploy)
```

### Environment Configuration
#### **Frontend (Netlify)**
- Build Command: `npm run build`
- Publish Directory: `build`
- Node Version: 18+

#### **Backend (Render.com)**
- Build Command: `pip install -r requirements.txt`
- Start Command: `python app_simple.py`
- Python Version: 3.11+

### Database Configuration
- **Development**: SQLite (`bandvenuereview.db`)
- **Production**: SQLite (deployed with app)
- **Future**: PostgreSQL migration ready

## Development Guide

### Local Setup
```bash
# Clone repository
git clone https://github.com/dmoriart/band-review-website.git
cd band-review-website

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app_simple.py

# Frontend setup (new terminal)
cd frontend
npm install
npm start
```

### Development Workflow
1. **Feature Development**: Create feature branch
2. **Backend Changes**: Test with `app_simple.py`
3. **Frontend Changes**: Test with React development server
4. **Integration Testing**: Verify API connectivity
5. **Commit & Push**: Automatic deployment via Git hooks

### Testing Admin Panel
1. Start both frontend and backend servers
2. Navigate to admin panel via "🛠️ Admin" button
3. Login with: admin@bandvenuereview.ie / admin123
4. Test all CRUD operations
5. Verify responsive design on different screen sizes

### Code Quality Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting for consistency
- **Responsive Design**: Mobile-first approach
- **Error Handling**: Comprehensive try-catch blocks
- **Documentation**: Inline comments and docstrings

This documentation provides a complete overview of the BandVenueReview.ie platform's capabilities and technical implementation. The system is designed to be scalable, maintainable, and user-friendly for both end users and administrators.
