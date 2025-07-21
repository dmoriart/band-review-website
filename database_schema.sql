-- BandVenueReview.ie Database Schema for Supabase PostgreSQL
-- Run this script in your Supabase SQL editor to create the database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (bands and venue owners)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('band', 'venue')),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    website VARCHAR(200),
    bio TEXT,
    profile_image VARCHAR(500),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);

-- Bands table (additional info for band users)
CREATE TABLE bands (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    genre VARCHAR(100),
    member_count INTEGER,
    formation_year INTEGER,
    location VARCHAR(100),
    social_links JSONB,
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- Venues table
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    county VARCHAR(50) NOT NULL,
    eircode VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(120),
    website VARCHAR(200),
    capacity INTEGER,
    venue_type VARCHAR(50),
    primary_genres JSONB,
    facilities JSONB,
    description TEXT,
    images JSONB,
    claimed BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    average_rating DECIMAL(3,1) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for venues
CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_venues_county ON venues(county);
CREATE INDEX idx_venues_average_rating ON venues(average_rating);
CREATE INDEX idx_venues_venue_type ON venues(venue_type);

-- Reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    performance_date DATE NOT NULL,
    event_name VARCHAR(200),
    audience_size VARCHAR(50),
    sound_quality INTEGER NOT NULL CHECK (sound_quality >= 1 AND sound_quality <= 5),
    hospitality INTEGER NOT NULL CHECK (hospitality >= 1 AND hospitality <= 5),
    payment_promptness INTEGER NOT NULL CHECK (payment_promptness >= 1 AND payment_promptness <= 5),
    crowd_engagement INTEGER NOT NULL CHECK (crowd_engagement >= 1 AND crowd_engagement <= 5),
    facilities_rating INTEGER NOT NULL CHECK (facilities_rating >= 1 AND facilities_rating <= 5),
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    title VARCHAR(200) NOT NULL,
    review_text TEXT NOT NULL,
    pros TEXT,
    cons TEXT,
    would_return BOOLEAN NOT NULL,
    recommended_for JSONB,
    verified_performance BOOLEAN DEFAULT FALSE,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(band_id, venue_id) -- Prevent duplicate reviews from same band
);

-- Create indexes for reviews
CREATE INDEX idx_reviews_venue_id ON reviews(venue_id);
CREATE INDEX idx_reviews_band_id ON reviews(band_id);
CREATE INDEX idx_reviews_performance_date ON reviews(performance_date);
CREATE INDEX idx_reviews_overall_rating ON reviews(overall_rating);

-- Genres table
CREATE TABLE genres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- Create function to update venue ratings automatically
CREATE OR REPLACE FUNCTION update_venue_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE venues 
    SET 
        average_rating = (
            SELECT ROUND(AVG(overall_rating), 1)
            FROM reviews 
            WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)
        ),
        review_count = (
            SELECT COUNT(*)
            FROM reviews 
            WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.venue_id, OLD.venue_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update venue ratings
CREATE TRIGGER trigger_update_venue_rating_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_venue_rating();

CREATE TRIGGER trigger_update_venue_rating_update
    AFTER UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_venue_rating();

CREATE TRIGGER trigger_update_venue_rating_delete
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_venue_rating();

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_venues_updated_at
    BEFORE UPDATE ON venues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample genres
INSERT INTO genres (name, description) VALUES
('Rock', 'Rock music including classic rock, hard rock, and alternative'),
('Folk', 'Traditional and contemporary folk music'),
('Indie', 'Independent music across various sub-genres'),
('Electronic', 'Electronic music including techno, house, and ambient'),
('Traditional', 'Traditional Irish music and Celtic sounds'),
('Jazz', 'Jazz and blues music'),
('Pop', 'Popular music and mainstream hits'),
('Punk', 'Punk rock and hardcore music'),
('Metal', 'Heavy metal and its sub-genres'),
('Country', 'Country and western music');

-- Insert sample venues
INSERT INTO venues (name, address, city, county, eircode, phone, website, capacity, venue_type, primary_genres, facilities, description) VALUES
('Whelan''s', '25 Wexford Street', 'Dublin', 'Dublin', 'D02 H527', '+353 1 478 0766', 'https://www.whelans.com', 300, 'live_music_venue', '["rock", "indie", "folk"]', '["professional_sound", "lighting", "bar", "green_room", "merchandise_area"]', 'Dublin''s premier live music venue since 1989. Known for discovering new talent and hosting intimate gigs.'),
('The Button Factory', 'Curved Street, Temple Bar', 'Dublin', 'Dublin', 'D02 HN24', '+353 1 670 9202', NULL, 450, 'club', '["electronic", "indie", "rock"]', '["professional_sound", "lighting", "bar", "late_license"]', 'Intimate venue in the heart of Temple Bar, perfect for both emerging and established acts.'),
('Cyprus Avenue', 'Caroline Street', 'Cork', 'Cork', NULL, '+353 21 427 6165', 'https://www.cyprusavenue.ie', 200, 'live_music_venue', '["indie", "folk", "rock"]', '["sound_system", "bar", "parking"]', 'Cork''s beloved independent music venue supporting local and touring artists.'),
('Monroe''s Tavern', 'Dominick Street Upper', 'Galway', 'Galway', NULL, '+353 91 583 397', NULL, 150, 'pub', '["traditional", "folk", "rock"]', '["sound_system", "bar", "traditional_session_space"]', 'Historic Galway pub hosting traditional sessions and contemporary acts.'),
('The Workman''s Club', '10 Wellington Quay', 'Dublin', 'Dublin', 'D02 XH91', '+353 1 670 6692', 'https://www.theworkmansclub.com', 180, 'club', '["indie", "electronic", "alternative"]', '["professional_sound", "lighting", "bar", "late_license", "roof_terrace"]', 'Multi-level venue with different spaces for intimate gigs and club nights.');

-- Row Level Security (RLS) policies for security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Policies for venues table
CREATE POLICY "Anyone can view venues" ON venues FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Venue owners can update their venues" ON venues FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Venue owners can insert venues" ON venues FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policies for reviews table
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Bands can create reviews" ON reviews FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM bands WHERE bands.id = band_id AND bands.user_id = auth.uid())
);
CREATE POLICY "Band authors can update their reviews" ON reviews FOR UPDATE USING (
    EXISTS (SELECT 1 FROM bands WHERE bands.id = band_id AND bands.user_id = auth.uid())
);

-- Policies for genres table
CREATE POLICY "Anyone can view genres" ON genres FOR SELECT TO authenticated, anon USING (true);

-- Create a view for public venue data with review stats
CREATE VIEW public_venues AS
SELECT 
    v.*,
    COUNT(r.id) as actual_review_count,
    ROUND(AVG(r.overall_rating), 1) as calculated_average_rating
FROM venues v
LEFT JOIN reviews r ON v.id = r.venue_id
GROUP BY v.id;

-- Grant permissions
GRANT SELECT ON public_venues TO authenticated, anon;
GRANT SELECT ON genres TO authenticated, anon;

-- Comment on tables for documentation
COMMENT ON TABLE users IS 'Base user table for both band members and venue owners';
COMMENT ON TABLE bands IS 'Additional information for band/artist users';
COMMENT ON TABLE venues IS 'Live music venues across Ireland';
COMMENT ON TABLE reviews IS 'Reviews of venues written by bands after performances';
COMMENT ON TABLE genres IS 'Music genres for categorization';

-- Create sample admin user (change password in production!)
-- This is just for development/testing
INSERT INTO users (email, password_hash, user_type, name, bio, verified) VALUES
('admin@bandvenuereview.ie', 'pbkdf2:sha256:260000$your_salt_here$your_hash_here', 'venue', 'BandVenueReview.ie Admin', 'Platform administrator', true);

COMMENT ON DATABASE postgres IS 'BandVenueReview.ie - Irish live music venue review platform database';
