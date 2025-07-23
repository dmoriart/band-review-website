# Backend API Development Guide

This guide covers the comprehensive REST API backend for the Band Venue Review platform.

## Overview

The backend API provides a complete RESTful interface for:
- **Band Discovery System** - Search, filter, and explore Irish bands
- **Gigs Management** - Create and manage live music events
- **Dual Review System** - Bands review venues, fans review bands
- **User Management** - Firebase Authentication integration
- **Band Followers** - Notification and engagement system
- **Search & Analytics** - Global search and platform statistics

## Quick Start

### 1. Setup Development Environment

```bash
# Navigate to backend directory
cd backend

# Run automated setup script
chmod +x setup_bands.sh
./setup_bands.sh
```

### 2. Manual Setup (Alternative)

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your database and Firebase credentials

# Setup database
export FLASK_APP=app_bands.py
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

# Start development server
flask run
```

### 3. Database Setup

The API integrates with the PostgreSQL schema created in the `/database` directory:

```bash
# First, set up the PostgreSQL database
cd ../database
./setup.sh --sample-data

# Then configure the API to connect
cd ../backend
# Update .env with database credentials from database setup
export DATABASE_URL="postgresql://band_app_user:YOUR_PASSWORD@localhost:5432/band_venue_review"
```

## API Architecture

### Core Components

1. **`models_bands.py`** - Enhanced SQLAlchemy models matching PostgreSQL schema
2. **`auth_firebase.py`** - Firebase Authentication integration and decorators
3. **`bands_api.py`** - Complete REST API routes and business logic
4. **`app_bands.py`** - Flask application factory and configuration
5. **`config_bands.py`** - Environment-specific configuration

### Authentication Flow

```python
# Firebase Token → User Sync → Database Record
@firebase_auth_required
def create_band():
    current_user = get_current_user()  # Synced from Firebase
    # User automatically created/updated in local database
```

### Permission System

```python
# Role-based access control
@band_member_required  # Must be a band member
@band_access_required(band_id_param='slug')  # Must be member of specific band
```

## API Endpoints

### Bands Management

#### List Bands
```http
GET /api/bands?genres=rock,folk&county=Dublin&verification_level=verified&page=1&per_page=20&sort_by=name&sort_order=asc&search=wilde
```

**Response:**
```json
{
  "bands": [
    {
      "id": "uuid",
      "name": "The Wilde Rovers",
      "slug": "the-wilde-rovers",
      "bio": "Traditional Irish folk band...",
      "genres": ["folk", "traditional"],
      "hometown": "Galway",
      "county": "Galway",
      "verification_level": "verified",
      "follower_count": 245,
      "total_gigs": 28,
      "average_rating": 4.7,
      "upcoming_gigs": [...],
      "social_links": {
        "spotify": "https://open.spotify.com/artist/...",
        "instagram": "https://instagram.com/wilderovers"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 5,
    "total": 98,
    "has_next": true
  }
}
```

#### Get Band Details
```http
GET /api/bands/the-wilde-rovers
```

**Response includes:**
- Complete band information
- Band members (if not anonymous)
- Upcoming gigs (next 10)
- Recent reviews (last 5)
- Venue reviews written by band
- User follow status (if authenticated)

#### Create Band
```http
POST /api/bands
Authorization: Bearer <firebase_token>
Content-Type: application/json

{
  "name": "New Band Name",
  "genres": ["rock", "indie"],
  "bio": "We are a rock band from Dublin...",
  "formed_year": 2020,
  "hometown": "Dublin",
  "county": "Dublin",
  "member_count": 4,
  "contact_email": "booking@newband.ie",
  "website": "https://newband.ie",
  "social_links": {
    "spotify": "https://open.spotify.com/artist/...",
    "instagram": "https://instagram.com/newband"
  },
  "creator_role": "Lead Vocalist"
}
```

#### Update Band
```http
PUT /api/bands/new-band-name
Authorization: Bearer <firebase_token>
Content-Type: application/json

{
  "bio": "Updated biography...",
  "social_links": {
    "spotify": "https://open.spotify.com/artist/updated",
    "youtube": "https://youtube.com/newband"
  }
}
```

### Gigs Management

#### List Gigs
```http
GET /api/gigs?band=the-wilde-rovers&venue=the-crane-bar&date_from=2024-08-01&date_to=2024-12-31&status=confirmed,scheduled&county=Galway
```

#### Create Gig
```http
POST /api/gigs
Authorization: Bearer <firebase_token>
Content-Type: application/json

{
  "band_id": "uuid",
  "venue_id": "uuid",
  "title": "Summer Folk Night",
  "description": "An evening of traditional Irish music",
  "gig_date": "2024-08-15",
  "start_time": "21:00",
  "door_price": 15.00,
  "ticket_url": "https://tickets.example.com/event",
  "status": "confirmed",
  "gig_type": "headline",
  "age_restriction": "18+",
  "supporting_bands": ["uuid1", "uuid2"]
}
```

### Reviews System

#### Band Reviews (by fans)
```http
GET /api/reviews/bands?band=the-wilde-rovers
POST /api/reviews/bands
```

#### Venue Reviews by Bands
```http
GET /api/reviews/venues?venue=the-crane-bar&band=the-wilde-rovers
POST /api/reviews/venues
```

**Create Band Review:**
```json
{
  "band_id": "uuid",
  "gig_id": "uuid",
  "rating": 5,
  "title": "Absolutely brilliant performance",
  "review_text": "Fantastic show with great energy...",
  "performance_rating": 5,
  "stage_presence_rating": 5,
  "sound_quality_rating": 4,
  "song_variety_rating": 4,
  "would_recommend": true,
  "tags": ["energetic", "traditional", "engaging"]
}
```

**Create Venue Review by Band:**
```json
{
  "band_id": "uuid",
  "venue_id": "uuid",
  "gig_id": "uuid",
  "rating": 4,
  "title": "Great venue for folk music",
  "review_text": "Excellent acoustics and professional staff...",
  "sound_quality_rating": 5,
  "staff_rating": 4,
  "payment_promptness_rating": 5,
  "crowd_response_rating": 4,
  "would_play_again": true,
  "pros": ["Great acoustics", "Professional staff", "Engaged audience"],
  "cons": ["Limited parking"],
  "recommended_for": ["folk", "acoustic", "traditional"]
}
```

### Band Followers

#### Follow Band
```http
POST /api/bands/the-wilde-rovers/follow
Authorization: Bearer <firebase_token>
```

#### Unfollow Band
```http
DELETE /api/bands/the-wilde-rovers/unfollow
Authorization: Bearer <firebase_token>
```

### Search & Analytics

#### Global Search
```http
GET /api/search?q=wilde rovers traditional
```

**Response:**
```json
{
  "query": "wilde rovers traditional",
  "results": {
    "bands": [...],
    "venues": [...],
    "gigs": [...]
  },
  "total_results": 15
}
```

#### Platform Statistics
```http
GET /api/stats
```

**Response:**
```json
{
  "total_bands": 1247,
  "total_venues": 342,
  "total_gigs": 2891,
  "upcoming_gigs": 156,
  "total_reviews": 4562,
  "verified_bands": 89,
  "popular_genres": [
    {"genre": "rock", "count": 234},
    {"genre": "folk", "count": 189},
    {"genre": "traditional", "count": 167}
  ]
}
```

## Authentication Integration

### Firebase Setup

1. **Service Account Key**
```bash
# Download from Firebase Console → Project Settings → Service Accounts
# Save as firebase-service-account.json
```

2. **Environment Variables**
```bash
FIREBASE_PROJECT_ID=project-767641273466
FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json
# OR for production:
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

### User Synchronization

Firebase users are automatically synced to the local database:

```python
# Firebase token verification → User sync → Database record
{
  "firebase_uid": "unique_firebase_id",
  "email": "user@example.com",
  "display_name": "John Doe",
  "photo_url": "https://...",
  "user_type": "fan",  # fan, band, venue, promoter
  "is_verified": false
}
```

## Database Integration

### Connection Configuration

```python
# config_bands.py
SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_size': 20,
    'pool_timeout': 30,
    'pool_recycle': 1800,
    'max_overflow': 40,
    'pool_pre_ping': True
}
```

### Model Relationships

```python
# models_bands.py - Key relationships
class Band(db.Model):
    members = db.relationship('BandMember', back_populates='band')
    gigs = db.relationship('Gig', back_populates='band')
    followers = db.relationship('BandFollower', back_populates='band')
    
class Gig(db.Model):
    band = db.relationship('Band', back_populates='gigs')
    venue = db.relationship('Venue', back_populates='gigs')
    supporting_bands = db.relationship('GigSupportingBand')
```

## Development Tools

### Database Migrations

```bash
# Initialize migrations
flask db init

# Create migration
flask db migrate -m "Description of changes"

# Apply migration
flask db upgrade

# Rollback migration
flask db downgrade
```

### Testing Endpoints

```bash
# Health check
curl http://localhost:5000/health

# API info
curl http://localhost:5000/api/info

# List bands
curl "http://localhost:5000/api/bands?genres=folk&county=Galway"

# Get band details
curl http://localhost:5000/api/bands/the-wilde-rovers

# Search
curl "http://localhost:5000/api/search?q=traditional music"

# Platform stats
curl http://localhost:5000/api/stats
```

### Authenticated Requests

```bash
# Get Firebase token from frontend
TOKEN="firebase_id_token_here"

# Create band
curl -X POST http://localhost:5000/api/bands \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \  
  -d '{"name":"Test Band","genres":["rock"]}'

# Follow band
curl -X POST http://localhost:5000/api/bands/test-band/follow \
  -H "Authorization: Bearer $TOKEN"
```

## Deployment

### Production Configuration

```bash
# Environment variables for production
FLASK_CONFIG=production
DATABASE_URL=postgresql://user:pass@host:port/db
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
SECRET_KEY=secure-random-secret
JWT_SECRET_KEY=another-secure-secret
CORS_ORIGINS=https://bandvenuereview.netlify.app
```

### Gunicorn Configuration

```python
# gunicorn.conf.py
bind = "0.0.0.0:5000"
workers = 4
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
```

### Docker Support

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["gunicorn", "-c", "gunicorn.conf.py", "app_bands:app"]
```

## Monitoring & Logging

### Health Endpoints

- `GET /health` - Basic health check with database status
- `GET /api/info` - API information and available endpoints

### Logging Configuration

```python
# Structured logging for production
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### Error Handling

All endpoints include comprehensive error handling:
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource doesn't exist)
- 500: Internal Server Error (logged for debugging)

## Performance Considerations

### Database Optimization

- Comprehensive indexing on all major query patterns
- Connection pooling for high concurrency
- Query optimization with proper joins and filtering
- Pagination on all list endpoints

### Caching Strategy

```python
# Redis caching for frequently accessed data
from flask_caching import Cache

cache = Cache(app, config={
    'CACHE_TYPE': 'redis',
    'CACHE_REDIS_URL': os.environ.get('REDIS_URL')
})

@cache.memoize(timeout=300)
def get_popular_bands():
    # Cached for 5 minutes
    return Band.query.filter_by(verification_level='featured').all()
```

### Rate Limiting

```python
from flask_limiter import Limiter

limiter = Limiter(
    app,
    key_func=lambda: get_current_user().id if get_current_user() else request.remote_addr,
    default_limits=["100 per hour"]
)

@limiter.limit("10 per minute")
@firebase_auth_required
def create_band():
    # Limited endpoint
    pass
```

This comprehensive backend API provides all the functionality needed for the bands discovery platform, with proper authentication, permissions, and integration with both the PostgreSQL database and Firebase authentication system.
