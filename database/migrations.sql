-- Migration scripts for Band Venue Review Website
-- Use these scripts to safely update the database schema in production

-- Migration 001: Add email verification fields
-- =============================================
-- Run date: TBD
-- Description: Add email verification tracking for users

BEGIN;

-- Add email verification columns to users table
ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN email_verification_token VARCHAR(255),
ADD COLUMN email_verification_expires_at TIMESTAMP WITH TIME ZONE;

-- Add index for verification token lookups
CREATE INDEX idx_users_verification_token ON users(email_verification_token) 
WHERE email_verification_token IS NOT NULL;

-- Update existing Firebase users to be verified (since Firebase handles email verification)
UPDATE users SET email_verified = TRUE WHERE firebase_uid IS NOT NULL;

COMMIT;

-- Migration 002: Add band image upload tracking
-- ============================================
-- Run date: TBD
-- Description: Track image uploads and add moderation fields

BEGIN;

-- Add image moderation fields to bands table
ALTER TABLE bands 
ADD COLUMN profile_image_moderated BOOLEAN DEFAULT TRUE,
ADD COLUMN banner_image_moderated BOOLEAN DEFAULT TRUE,
ADD COLUMN image_upload_count INTEGER DEFAULT 0,
ADD COLUMN last_image_upload TIMESTAMP WITH TIME ZONE;

-- Add trigger to update image upload tracking
CREATE OR REPLACE FUNCTION update_band_image_tracking()
RETURNS TRIGGER AS $$
BEGIN
    -- If profile image changed
    IF OLD.profile_image_url IS DISTINCT FROM NEW.profile_image_url THEN
        NEW.image_upload_count := OLD.image_upload_count + 1;
        NEW.last_image_upload := CURRENT_TIMESTAMP;
        NEW.profile_image_moderated := FALSE;
    END IF;
    
    -- If banner image changed
    IF OLD.banner_image_url IS DISTINCT FROM NEW.banner_image_url THEN
        NEW.image_upload_count := OLD.image_upload_count + 1;
        NEW.last_image_upload := CURRENT_TIMESTAMP;
        NEW.banner_image_moderated := FALSE;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER track_band_image_uploads 
BEFORE UPDATE ON bands 
FOR EACH ROW EXECUTE FUNCTION update_band_image_tracking();

COMMIT;

-- Migration 003: Add venue booking system integration
-- =================================================
-- Run date: TBD
-- Description: Add fields to support venue booking system

BEGIN;

-- Add booking-related fields to venues table
ALTER TABLE venues 
ADD COLUMN booking_email VARCHAR(255),
ADD COLUMN booking_phone VARCHAR(20),
ADD COLUMN booking_requirements TEXT,
ADD COLUMN requires_advance_booking BOOLEAN DEFAULT TRUE,
ADD COLUMN min_advance_days INTEGER DEFAULT 30,
ADD COLUMN max_advance_days INTEGER DEFAULT 365;

-- Add booking-related fields to gigs table
ALTER TABLE gigs 
ADD COLUMN booking_reference VARCHAR(100),
ADD COLUMN booking_status VARCHAR(20) DEFAULT 'pending' 
    CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed')),
ADD COLUMN booking_notes TEXT,
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'deposit_paid', 'paid', 'overdue', 'refunded')),
ADD COLUMN payment_amount DECIMAL(8, 2),
ADD COLUMN payment_due_date DATE;

-- Add indexes for booking queries
CREATE INDEX idx_gigs_booking_reference ON gigs(booking_reference) 
WHERE booking_reference IS NOT NULL;
CREATE INDEX idx_gigs_booking_status ON gigs(booking_status);
CREATE INDEX idx_gigs_payment_status ON gigs(payment_status);

COMMIT;

-- Migration 004: Add band genre standardization
-- ===========================================
-- Run date: TBD
-- Description: Create standardized genre list and migrate existing data

BEGIN;

-- Create genres reference table
CREATE TABLE genres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    parent_genre_id UUID REFERENCES genres(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard genres
INSERT INTO genres (name, slug, description) VALUES
('Rock', 'rock', 'Rock music and its subgenres'),
('Folk', 'folk', 'Traditional and contemporary folk music'),
('Traditional', 'traditional', 'Traditional Irish and Celtic music'),
('Pop', 'pop', 'Popular music'),
('Alternative', 'alternative', 'Alternative and indie music'),
('Electronic', 'electronic', 'Electronic music and dance'),
('Jazz', 'jazz', 'Jazz and related genres'),
('Blues', 'blues', 'Blues music'),
('Country', 'country', 'Country and americana'),
('Metal', 'metal', 'Heavy metal and subgenres'),
('Punk', 'punk', 'Punk rock and related styles'),
('Acoustic', 'acoustic', 'Acoustic performances'),
('Celtic', 'celtic', 'Celtic music traditions'),
('World', 'world', 'World music and fusion'),
('Covers', 'covers', 'Cover bands and tribute acts');

-- Create band_genres junction table for many-to-many relationship
CREATE TABLE band_genres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
    genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(band_id, genre_id)
);

-- Migrate existing genre data
INSERT INTO band_genres (band_id, genre_id)
SELECT DISTINCT 
    b.id,
    g.id
FROM bands b,
UNNEST(b.genres) AS genre_name
JOIN genres g ON LOWER(g.name) = LOWER(genre_name);

-- Add index for genre queries
CREATE INDEX idx_band_genres_band_id ON band_genres(band_id);
CREATE INDEX idx_band_genres_genre_id ON band_genres(genre_id);

-- Note: Keep the old genres array column for now, will be removed in a future migration
-- after confirming the new system works correctly

COMMIT;

-- Migration 005: Add user activity tracking
-- =======================================
-- Run date: TBD
-- Description: Track user activity for engagement metrics

BEGIN;

-- Create user activity tracking table
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for activity queries
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at);

-- Add last activity tracking to users table
ALTER TABLE users 
ADD COLUMN last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN activity_score INTEGER DEFAULT 0;

-- Create function to update user last activity
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET 
        last_activity_at = CURRENT_TIMESTAMP,
        activity_score = activity_score + 1
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_last_activity 
AFTER INSERT ON user_activities 
FOR EACH ROW EXECUTE FUNCTION update_user_activity();

COMMIT;

-- Migration 006: Add full-text search capabilities
-- ==============================================
-- Run date: TBD
-- Description: Add full-text search indexes for bands and venues

BEGIN;

-- Add text search vectors to bands table
ALTER TABLE bands 
ADD COLUMN search_vector tsvector;

-- Create function to update band search vector
CREATE OR REPLACE FUNCTION update_band_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.hometown, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.genres, ' '), '')), 'B');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update search vector
CREATE TRIGGER update_bands_search_vector 
BEFORE INSERT OR UPDATE ON bands 
FOR EACH ROW EXECUTE FUNCTION update_band_search_vector();

-- Update existing records
UPDATE bands SET search_vector = 
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(bio, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(hometown, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(genres, ' '), '')), 'B');

-- Create GIN index for full-text search
CREATE INDEX idx_bands_search_vector ON bands USING GIN(search_vector);

-- Add similar functionality for venues
ALTER TABLE venues 
ADD COLUMN search_vector tsvector;

CREATE OR REPLACE FUNCTION update_venue_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.county, '')), 'C');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_venues_search_vector 
BEFORE INSERT OR UPDATE ON venues 
FOR EACH ROW EXECUTE FUNCTION update_venue_search_vector();

UPDATE venues SET search_vector = 
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(city, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(county, '')), 'C');

CREATE INDEX idx_venues_search_vector ON venues USING GIN(search_vector);

COMMIT;

-- Migration 007: Add content moderation system
-- ==========================================
-- Run date: TBD
-- Description: Add content moderation for reviews and band profiles

BEGIN;

-- Create moderation table
CREATE TABLE content_moderation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type VARCHAR(50) NOT NULL, -- 'band_review', 'venue_review', 'band_profile', etc.
    content_id UUID NOT NULL,
    moderation_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
    flagged_reason VARCHAR(100),
    moderator_id UUID REFERENCES users(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for moderation queries
CREATE INDEX idx_content_moderation_type_id ON content_moderation(content_type, content_id);
CREATE INDEX idx_content_moderation_status ON content_moderation(moderation_status);
CREATE INDEX idx_content_moderation_created_at ON content_moderation(created_at);

-- Add moderation fields to reviews
ALTER TABLE band_reviews 
ADD COLUMN requires_moderation BOOLEAN DEFAULT FALSE,
ADD COLUMN moderation_flags TEXT[];

ALTER TABLE venue_reviews_by_bands 
ADD COLUMN requires_moderation BOOLEAN DEFAULT FALSE,
ADD COLUMN moderation_flags TEXT[];

-- Create function to auto-flag potentially problematic content
CREATE OR REPLACE FUNCTION check_content_for_moderation()
RETURNS TRIGGER AS $$
DECLARE
    flagged_words TEXT[] := ARRAY['spam', 'fake', 'inappropriate']; -- Add more as needed
    word TEXT;
    content_text TEXT;
BEGIN
    -- Combine title and review text
    content_text := LOWER(COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.review_text, ''));
    
    -- Check for flagged words
    FOREACH word IN ARRAY flagged_words LOOP
        IF content_text LIKE '%' || word || '%' THEN
            NEW.requires_moderation := TRUE;
            NEW.moderation_flags := array_append(COALESCE(NEW.moderation_flags, ARRAY[]::TEXT[]), 'contains_flagged_word');
            EXIT;
        END IF;
    END LOOP;
    
    -- Flag very short reviews (potential spam)
    IF LENGTH(COALESCE(NEW.review_text, '')) < 20 THEN
        NEW.requires_moderation := TRUE;
        NEW.moderation_flags := array_append(COALESCE(NEW.moderation_flags, ARRAY[]::TEXT[]), 'very_short_review');
    END IF;
    
    -- Flag very high/low ratings without much text (potential fake)
    IF (NEW.rating = 1 OR NEW.rating = 5) AND LENGTH(COALESCE(NEW.review_text, '')) < 50 THEN
        NEW.requires_moderation := TRUE;
        NEW.moderation_flags := array_append(COALESCE(NEW.moderation_flags, ARRAY[]::TEXT[]), 'extreme_rating_short_text');
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply moderation check to both review types
CREATE TRIGGER check_band_review_moderation 
BEFORE INSERT OR UPDATE ON band_reviews 
FOR EACH ROW EXECUTE FUNCTION check_content_for_moderation();

CREATE TRIGGER check_venue_review_moderation 
BEFORE INSERT OR UPDATE ON venue_reviews_by_bands 
FOR EACH ROW EXECUTE FUNCTION check_content_for_moderation();

COMMIT;

-- Rollback scripts (use carefully!)
-- ================================

-- Rollback Migration 007
-- DROP TRIGGER IF EXISTS check_venue_review_moderation ON venue_reviews_by_bands;
-- DROP TRIGGER IF EXISTS check_band_review_moderation ON band_reviews;
-- DROP FUNCTION IF EXISTS check_content_for_moderation();
-- ALTER TABLE venue_reviews_by_bands DROP COLUMN IF EXISTS moderation_flags, DROP COLUMN IF EXISTS requires_moderation;
-- ALTER TABLE band_reviews DROP COLUMN IF EXISTS moderation_flags, DROP COLUMN IF EXISTS requires_moderation;
-- DROP TABLE IF EXISTS content_moderation;

-- Rollback Migration 006
-- DROP INDEX IF EXISTS idx_venues_search_vector;
-- DROP INDEX IF EXISTS idx_bands_search_vector;
-- DROP TRIGGER IF EXISTS update_venues_search_vector ON venues;
-- DROP TRIGGER IF EXISTS update_bands_search_vector ON bands;
-- DROP FUNCTION IF EXISTS update_venue_search_vector();
-- DROP FUNCTION IF EXISTS update_band_search_vector();
-- ALTER TABLE venues DROP COLUMN IF EXISTS search_vector;
-- ALTER TABLE bands DROP COLUMN IF EXISTS search_vector;
