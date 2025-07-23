# Bands API Endpoints

This document outlines the API endpoints needed for the bands functionality.

## Base URL
```
https://band-review-website.onrender.com/api
```

## Endpoints

### GET /bands
Get a list of all bands with pagination support.

**Parameters:**
- `page` (optional, default: 1) - Page number
- `per_page` (optional, default: 20) - Number of bands per page
- `genre` (optional) - Filter by genre
- `location` (optional) - Filter by location
- `verified` (optional) - Filter verified bands only (true/false)
- `search` (optional) - Search bands by name, bio, or location

**Response:**
```json
{
  "bands": [
    {
      "id": "string",
      "name": "string",
      "bio": "string",
      "genre": ["string"],
      "location": "string",
      "formed_year": "number",
      "social_links": {
        "website": "string",
        "spotify": "string",
        "youtube": "string",
        "instagram": "string",
        "facebook": "string",
        "twitter": "string",
        "bandcamp": "string",
        "soundcloud": "string"
      },
      "profile_image": "string",
      "banner_image": "string",
      "upcoming_gigs": [
        {
          "id": "string",
          "venue_name": "string",
          "venue_id": "string",
          "date": "string",
          "time": "string",
          "ticket_price": "number",
          "ticket_url": "string"
        }
      ],
      "past_reviews": [
        {
          "id": "string",
          "venue_name": "string",
          "venue_id": "string",
          "date": "string",
          "rating": "number",
          "review": "string"
        }
      ],
      "photos": ["string"],
      "verified": "boolean",
      "created_at": "string",
      "updated_at": "string"
    }
  ],
  "total": "number",
  "page": "number",
  "per_page": "number",
  "pages": "number"
}
```

### GET /bands/:id
Get detailed information about a specific band.

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "bio": "string",
  "genre": ["string"],
  "location": "string",
  "formed_year": "number",
  "social_links": {
    "website": "string",
    "spotify": "string",
    "youtube": "string",
    "instagram": "string",
    "facebook": "string",
    "twitter": "string",
    "bandcamp": "string",
    "soundcloud": "string"
  },
  "profile_image": "string",    
  "banner_image": "string",
  "upcoming_gigs": [
    {
      "id": "string",
      "venue_name": "string",
      "venue_id": "string",
      "date": "string",
      "time": "string",
      "ticket_price": "number",
      "ticket_url": "string"
    }
  ],
  "past_reviews": [
    {
      "id": "string",
      "venue_name": "string",
      "venue_id": "string",
      "date": "string",
      "rating": "number",
      "review": "string"
    }
  ],
  "photos": ["string"],
  "verified": "boolean",
  "created_at": "string",
  "updated_at": "string"
}
```

### POST /bands
Create a new band profile (requires authentication).

**Request Body:**
```json
{
  "name": "string",
  "bio": "string",
  "genre": ["string"],
  "location": "string",
  "formed_year": "number",
  "social_links": {
    "website": "string",
    "spotify": "string",
    "youtube": "string",
    "instagram": "string",
    "facebook": "string",
    "twitter": "string",
    "bandcamp": "string",
    "soundcloud": "string"
  }
}
```

### PUT /bands/:id
Update band profile (requires authentication and ownership).

**Request Body:** Same as POST /bands

### DELETE /bands/:id
Delete band profile (requires authentication and ownership).

### POST /bands/:id/photos
Upload photos for a band (requires authentication and ownership).

**Request:** Multipart form data with image files

### GET /bands/:id/gigs
Get upcoming gigs for a specific band.

### POST /bands/:id/gigs
Create a new gig for a band (requires authentication and ownership).

**Request Body:**
```json
{
  "venue_id": "string",
  "date": "string",
  "time": "string",
  "ticket_price": "number",
  "ticket_url": "string"
}
```

### GET /bands/:id/reviews
Get venue reviews written by a specific band.

### POST /bands/:id/reviews
Create a new venue review (requires authentication and ownership).

**Request Body:**
```json
{
  "venue_id": "string",
  "rating": "number",
  "review": "string",
  "gig_date": "string"
}
```

## Database Schema

## Database Schema

The comprehensive PostgreSQL database schema is now implemented in `/database/schema.sql`. Key tables include:

### Core Tables
- **users** - User accounts synced with Firebase Auth
- **venues** - Venue information (from existing venue review system)  
- **bands** - Band profiles and information
- **band_members** - Many-to-many relationship between users and bands
- **gigs** - Concert/performance events
- **venue_reviews_by_bands** - Reviews of venues written by bands
- **band_reviews** - Reviews of bands written by fans
- **band_followers** - Fans following bands for notifications

### Database Setup
To set up the complete database schema:

```bash
# Make setup script executable
chmod +x database/setup.sh

# Run the automated setup (includes sample data option)
./database/setup.sh --sample-data

# Or manually run the SQL files
psql -U your_username -d band_venue_review -f database/schema.sql
psql -U your_username -d band_venue_review -f database/sample_data.sql
```

See `/database/README.md` for detailed setup instructions, performance optimization, and security considerations.

### band_gigs table
```sql
CREATE TABLE band_gigs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id),
  date DATE NOT NULL,
  time TIME,
  ticket_price DECIMAL(10,2),
  ticket_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### band_venue_reviews table
```sql
CREATE TABLE band_venue_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id),
  rating DECIMAL(2,1) CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  gig_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Integration Notes

### CMS Integration
Like the previous sticknpoketest project, bands should be able to:
1. Register and claim their profile
2. Update their information through a simple CMS interface
3. Upload photos and manage their media
4. Track their gigs and reviews
5. Connect their social media accounts

### Cross-referencing with Venues
- Bands can review venues they've played at
- Venues can display bands that have played there
- Gigs link bands to venues with specific dates
- Reviews create a feedback loop between bands and venues

### Authentication Integration
- Uses Firebase Auth for user authentication
- Band profiles are linked to user accounts
- Only authenticated band owners can edit their profiles
- Verification system for established bands
