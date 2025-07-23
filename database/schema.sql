-- Band Venue Review Website - PostgreSQL Database Schema
-- This schema supports the comprehensive bands system with gigs and reviews

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced with Firebase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    photo_url TEXT,
    user_type VARCHAR(20) DEFAULT 'fan' CHECK (user_type IN ('fan', 'band', 'venue', 'promoter')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Venues table (existing from venue review system)
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    county VARCHAR(50) NOT NULL,
    country VARCHAR(50) DEFAULT 'Ireland',
    phone VARCHAR(20),
    email VARCHAR(255),
    website TEXT,
    capacity INTEGER,
    venue_type VARCHAR(50) CHECK (venue_type IN ('pub', 'club', 'concert_hall', 'outdoor', 'festival', 'other')),
    description TEXT,
    facilities TEXT[], -- Array of facilities like 'sound_system', 'lighting', 'parking'
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    google_maps_url TEXT,
    social_links JSONB, -- Social media links
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bands table
CREATE TABLE bands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    bio TEXT,
    formed_year INTEGER CHECK (formed_year >= 1900 AND formed_year <= EXTRACT(YEAR FROM CURRENT_DATE)),
    genres TEXT[] NOT NULL, -- Array of genres
    hometown VARCHAR(100),
    county VARCHAR(50),
    country VARCHAR(50) DEFAULT 'Ireland',
    member_count INTEGER CHECK (member_count > 0),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    website TEXT,
    social_links JSONB, -- JSON object with platform: url pairs
    profile_image_url TEXT,
    banner_image_url TEXT,
    photo_gallery_urls TEXT[], -- Array of photo URLs
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_level VARCHAR(20) DEFAULT 'none' CHECK (verification_level IN ('none', 'basic', 'verified', 'featured')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Band members (many-to-many relationship between users and bands)
CREATE TABLE band_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(100), -- e.g., 'vocalist', 'guitarist', 'drummer'
    is_primary_contact BOOLEAN DEFAULT FALSE,
    joined_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(band_id, user_id)
);

-- Gigs table
CREATE TABLE gigs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    title VARCHAR(300), -- Event title if different from band name
    description TEXT,
    gig_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    door_price DECIMAL(8, 2),
    ticket_url TEXT,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
    gig_type VARCHAR(30) DEFAULT 'regular' CHECK (gig_type IN ('regular', 'support', 'headline', 'festival', 'private')),
    expected_attendance INTEGER,
    age_restriction VARCHAR(10), -- e.g., '18+', 'All Ages'
    special_notes TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Supporting bands for gigs (many-to-many)
CREATE TABLE gig_supporting_bands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
    performance_order INTEGER, -- 1 for opener, 2 for second support, etc.
    set_duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gig_id, band_id)
);

-- Venue reviews by bands (bands reviewing venues they've played at)
CREATE TABLE venue_reviews_by_bands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    gig_id UUID REFERENCES gigs(id) ON DELETE SET NULL, -- Optional reference to specific gig
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    review_text TEXT NOT NULL,
    sound_quality_rating INTEGER CHECK (sound_quality_rating >= 1 AND sound_quality_rating <= 5),
    staff_rating INTEGER CHECK (staff_rating >= 1 AND staff_rating <= 5),
    payment_promptness_rating INTEGER CHECK (payment_promptness_rating >= 1 AND payment_promptness_rating <= 5),
    crowd_response_rating INTEGER CHECK (crowd_response_rating >= 1 AND crowd_response_rating <= 5),
    would_play_again BOOLEAN,
    pros TEXT[], -- Array of positive aspects
    cons TEXT[], -- Array of negative aspects
    recommended_for TEXT[], -- Array of band types/genres this venue suits
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(band_id, venue_id, gig_id) -- Prevent duplicate reviews for same gig
);

-- Band reviews by fans/users
CREATE TABLE band_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gig_id UUID REFERENCES gigs(id) ON DELETE SET NULL, -- Optional reference to specific gig
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    review_text TEXT NOT NULL,
    performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
    stage_presence_rating INTEGER CHECK (stage_presence_rating >= 1 AND stage_presence_rating <= 5),
    sound_quality_rating INTEGER CHECK (sound_quality_rating >= 1 AND sound_quality_rating <= 5),
    song_variety_rating INTEGER CHECK (song_variety_rating >= 1 AND song_variety_rating <= 5),
    would_recommend BOOLEAN,
    tags TEXT[], -- Array of descriptive tags
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(band_id, reviewer_id, gig_id) -- Prevent duplicate reviews for same gig
);

-- Review helpfulness votes
CREATE TABLE review_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL, -- Can reference either venue_reviews_by_bands or band_reviews
    review_type VARCHAR(20) NOT NULL CHECK (review_type IN ('venue_review', 'band_review')),
    voter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(review_id, review_type, voter_id) -- Prevent multiple votes from same user
);

-- Band followers (fans following bands)
CREATE TABLE band_followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_preferences JSONB DEFAULT '{"new_gigs": true, "new_releases": false, "band_updates": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(band_id, follower_id)
);

-- Setlists (optional feature for detailed gig information)
CREATE TABLE setlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
    songs JSONB NOT NULL, -- Array of objects with song info: [{"title": "Song Name", "order": 1, "duration_minutes": 4}]
    total_duration_minutes INTEGER,
    encore_songs JSONB, -- Optional encore songs
    notes TEXT,
    is_complete BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gig_id, band_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_venues_slug ON venues(slug);
CREATE INDEX idx_venues_city_county ON venues(city, county);
CREATE INDEX idx_venues_location ON venues(latitude, longitude);
CREATE INDEX idx_bands_slug ON bands(slug);
CREATE INDEX idx_bands_genres ON bands USING GIN(genres);
CREATE INDEX idx_bands_county ON bands(county);
CREATE INDEX idx_bands_verification_level ON bands(verification_level);
CREATE INDEX idx_band_members_band_id ON band_members(band_id);
CREATE INDEX idx_band_members_user_id ON band_members(user_id);
CREATE INDEX idx_gigs_band_id ON gigs(band_id);
CREATE INDEX idx_gigs_venue_id ON gigs(venue_id);
CREATE INDEX idx_gigs_date ON gigs(gig_date);
CREATE INDEX idx_gigs_status ON gigs(status);
CREATE INDEX idx_venue_reviews_by_bands_band_id ON venue_reviews_by_bands(band_id);
CREATE INDEX idx_venue_reviews_by_bands_venue_id ON venue_reviews_by_bands(venue_id);
CREATE INDEX idx_band_reviews_band_id ON band_reviews(band_id);
CREATE INDEX idx_band_reviews_reviewer_id ON band_reviews(reviewer_id);
CREATE INDEX idx_band_followers_band_id ON band_followers(band_id);
CREATE INDEX idx_band_followers_follower_id ON band_followers(follower_id);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bands_updated_at BEFORE UPDATE ON bands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gigs_updated_at BEFORE UPDATE ON gigs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venue_reviews_by_bands_updated_at BEFORE UPDATE ON venue_reviews_by_bands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_band_reviews_updated_at BEFORE UPDATE ON band_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_setlists_updated_at BEFORE UPDATE ON setlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update review helpful_votes counts
CREATE OR REPLACE FUNCTION update_review_helpful_votes()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.review_type = 'venue_review' THEN
        UPDATE venue_reviews_by_bands 
        SET helpful_votes = (
            SELECT COUNT(*) 
            FROM review_votes 
            WHERE review_id = NEW.review_id 
            AND review_type = 'venue_review' 
            AND is_helpful = true
        )
        WHERE id = NEW.review_id;
    ELSIF NEW.review_type = 'band_review' THEN
        UPDATE band_reviews 
        SET helpful_votes = (
            SELECT COUNT(*) 
            FROM review_votes 
            WHERE review_id = NEW.review_id 
            AND review_type = 'band_review' 
            AND is_helpful = true
        )
        WHERE id = NEW.review_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_review_votes_count 
AFTER INSERT OR UPDATE OR DELETE ON review_votes 
FOR EACH ROW EXECUTE FUNCTION update_review_helpful_votes();

-- Create function to generate slugs automatically
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(regexp_replace(
        regexp_replace(
            regexp_replace(input_text, '[^a-zA-Z0-9\s\-]', '', 'g'),
            '\s+', '-', 'g'
        ),
        '\-+', '-', 'g'
    ));
END;
$$ language 'plpgsql';

-- Create function to auto-generate unique slugs for bands
CREATE OR REPLACE FUNCTION ensure_unique_band_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    new_slug TEXT;
    counter INTEGER := 1;
BEGIN
    base_slug := generate_slug(NEW.name);
    new_slug := base_slug;
    
    -- Check if slug already exists
    WHILE EXISTS (SELECT 1 FROM bands WHERE slug = new_slug AND id != COALESCE(NEW.id, uuid_generate_v4())) LOOP
        new_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    NEW.slug := new_slug;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_band_slug_unique 
BEFORE INSERT OR UPDATE ON bands 
FOR EACH ROW EXECUTE FUNCTION ensure_unique_band_slug();

-- Create function to auto-generate unique slugs for venues
CREATE OR REPLACE FUNCTION ensure_unique_venue_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    new_slug TEXT;
    counter INTEGER := 1;
BEGIN
    base_slug := generate_slug(NEW.name);
    new_slug := base_slug;
    
    -- Check if slug already exists
    WHILE EXISTS (SELECT 1 FROM venues WHERE slug = new_slug AND id != COALESCE(NEW.id, uuid_generate_v4())) LOOP
        new_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    NEW.slug := new_slug;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_venue_slug_unique 
BEFORE INSERT OR UPDATE ON venues 
FOR EACH ROW EXECUTE FUNCTION ensure_unique_venue_slug();
