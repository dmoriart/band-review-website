-- Venue Ownership and Claims Database Schema
-- This extends the existing database to support venue claiming and ownership management

-- Users table to store app-specific user data alongside Firebase Auth
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    profile_image_url TEXT,
    phone VARCHAR(50),
    verified_email BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- User roles and permissions
    role VARCHAR(50) DEFAULT 'user', -- 'user', 'venue_owner', 'moderator', 'admin'
    permissions JSONB DEFAULT '[]'::jsonb -- Additional granular permissions
);

-- Venue claims table for managing ownership requests
CREATE TABLE venue_claims (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    venue_id VARCHAR(255) NOT NULL, -- References CMS venue slug/ID
    
    -- Claim details
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'requires_verification'
    claim_type VARCHAR(50) DEFAULT 'ownership', -- 'ownership', 'management', 'staff'
    
    -- Verification information provided by claimer
    verification_data JSONB DEFAULT '{}'::jsonb, -- Phone, website, social links, etc.
    business_documents TEXT[], -- URLs to uploaded documents (business license, etc.)
    additional_notes TEXT,
    
    -- Administrative fields
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id),
    admin_notes TEXT,
    rejection_reason TEXT,
    
    -- Contact verification
    phone_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    website_verified BOOLEAN DEFAULT FALSE,
    
    UNIQUE(user_id, venue_id) -- Prevent duplicate claims
);

-- Venue ownership/management relationships
CREATE TABLE venue_owners (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    venue_id VARCHAR(255) NOT NULL, -- References CMS venue slug/ID
    
    -- Role and permissions
    role VARCHAR(50) DEFAULT 'owner', -- 'owner', 'manager', 'editor', 'staff'
    permissions JSONB DEFAULT '[]'::jsonb, -- Specific permissions for this venue
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE, -- Only one primary owner per venue
    
    -- Timestamps
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by INTEGER REFERENCES users(id),
    expires_at TIMESTAMP, -- Optional expiration for temporary access
    
    UNIQUE(user_id, venue_id, role)
);

-- Venue edit history for tracking changes
CREATE TABLE venue_edits (
    id SERIAL PRIMARY KEY,
    venue_id VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    
    -- Change tracking
    field_name VARCHAR(100) NOT NULL, -- 'name', 'description', 'contact', etc.
    old_value JSONB,
    new_value JSONB,
    change_type VARCHAR(50) DEFAULT 'update', -- 'create', 'update', 'delete'
    
    -- Administrative
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    
    -- Moderation
    requires_approval BOOLEAN DEFAULT FALSE,
    rejection_reason TEXT
);

-- Venue verification requests (for venues to get verified badges)
CREATE TABLE venue_verifications (
    id SERIAL PRIMARY KEY,
    venue_id VARCHAR(255) NOT NULL,
    requested_by INTEGER REFERENCES users(id),
    
    -- Verification requirements
    business_license_url TEXT,
    tax_registration_url TEXT,
    utility_bill_url TEXT,
    social_media_verification JSONB DEFAULT '{}'::jsonb,
    website_verification_code VARCHAR(100),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'requires_more_info'
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id),
    admin_notes TEXT,
    
    -- Verification badge expiry
    verified_until TIMESTAMP
);

-- Notification preferences for venue owners
CREATE TABLE venue_owner_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    venue_id VARCHAR(255) NOT NULL,
    
    -- Notification types
    new_reviews BOOLEAN DEFAULT TRUE,
    review_responses BOOLEAN DEFAULT TRUE,
    venue_updates BOOLEAN DEFAULT TRUE,
    claim_status BOOLEAN DEFAULT TRUE,
    verification_status BOOLEAN DEFAULT TRUE,
    system_announcements BOOLEAN DEFAULT TRUE,
    
    -- Delivery preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    in_app_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, venue_id)
);

-- Indexes for performance
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_venue_claims_user_venue ON venue_claims(user_id, venue_id);
CREATE INDEX idx_venue_claims_status ON venue_claims(status);
CREATE INDEX idx_venue_owners_venue ON venue_owners(venue_id);
CREATE INDEX idx_venue_owners_user ON venue_owners(user_id);
CREATE INDEX idx_venue_owners_active ON venue_owners(venue_id, is_active);
CREATE INDEX idx_venue_edits_venue ON venue_edits(venue_id);
CREATE INDEX idx_venue_edits_user ON venue_edits(user_id);
CREATE INDEX idx_venue_verifications_venue ON venue_verifications(venue_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venue_owner_notifications_updated_at BEFORE UPDATE ON venue_owner_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO users (firebase_uid, email, display_name, role) VALUES 
('test-firebase-uid-1', 'owner@theacademydublin.com', 'The Academy Dublin', 'venue_owner'),
('test-firebase-uid-2', 'manager@vicarstreet.ie', 'Vicar Street Manager', 'user'),
('test-firebase-uid-3', 'admin@bandvenuereview.ie', 'Site Admin', 'admin');

-- Sample venue claim
INSERT INTO venue_claims (user_id, venue_id, verification_data, additional_notes) VALUES 
(1, 'the-academy', '{"website": "https://theacademydublin.com", "phone": "+353 1 877 9999", "social_facebook": "https://facebook.com/theacademydublin"}', 'I am the general manager of The Academy Dublin and would like to claim this venue to keep our information updated.');

-- Comments explaining the system
COMMENT ON TABLE users IS 'App-specific user data extending Firebase Auth';
COMMENT ON TABLE venue_claims IS 'Venue ownership claim requests and their approval workflow';
COMMENT ON TABLE venue_owners IS 'Approved venue ownership/management relationships';
COMMENT ON TABLE venue_edits IS 'History of venue information changes for moderation and tracking';
COMMENT ON TABLE venue_verifications IS 'Venue verification badge requests and approval process';
COMMENT ON TABLE venue_owner_notifications IS 'Notification preferences for venue owners';
