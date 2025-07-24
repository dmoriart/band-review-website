const { query } = require('./db-adapter');

/**
 * Initialize venue ownership system tables
 */
const initVenueOwnershipTables = async () => {
  try {
    console.log('🔧 Creating venue ownership system tables...');
    
    // Create users table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        firebase_uid VARCHAR(128) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(100),
        bio TEXT,
        location VARCHAR(100),
        website VARCHAR(255),
        profile_picture_url TEXT,
        notification_preferences JSONB DEFAULT '{
          "email_venue_updates": true,
          "email_review_responses": true,
          "email_claim_updates": true,
          "email_marketing": false
        }'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create venue_claims table
    await query(`
      CREATE TABLE IF NOT EXISTS venue_claims (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        venue_id INTEGER NOT NULL,
        venue_name VARCHAR(200) NOT NULL,
        claim_type VARCHAR(20) CHECK (claim_type IN ('ownership', 'management')) DEFAULT 'ownership',
        verification_data JSONB,
        business_documents JSONB DEFAULT '[]'::jsonb,
        additional_notes TEXT,
        status VARCHAR(30) CHECK (status IN ('pending', 'approved', 'rejected', 'requires_verification')) DEFAULT 'pending',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        reviewed_by INTEGER REFERENCES users(id),
        admin_notes TEXT,
        rejection_reason TEXT
      );
    `);
    
    // Create venue_owners table
    await query(`
      CREATE TABLE IF NOT EXISTS venue_owners (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        venue_id INTEGER NOT NULL,
        role VARCHAR(20) CHECK (role IN ('owner', 'manager', 'editor')) DEFAULT 'owner',
        permissions JSONB DEFAULT '["edit", "respond_to_reviews"]'::jsonb,
        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        granted_by INTEGER REFERENCES users(id),
        UNIQUE(user_id, venue_id)
      );
    `);
    
    // Create venue_edits table
    await query(`
      CREATE TABLE IF NOT EXISTS venue_edits (
        id SERIAL PRIMARY KEY,
        venue_id INTEGER NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        edit_type VARCHAR(50) NOT NULL,
        changes JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create venue_verifications table
    await query(`
      CREATE TABLE IF NOT EXISTS venue_verifications (
        id SERIAL PRIMARY KEY,
        venue_id INTEGER NOT NULL,
        verification_type VARCHAR(50) NOT NULL,
        verification_data JSONB,
        verified_by INTEGER REFERENCES users(id),
        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) CHECK (status IN ('verified', 'failed', 'pending')) DEFAULT 'verified'
      );
    `);
    
    // Create reviews table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        venue_id INTEGER NOT NULL,
        band_id INTEGER,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
        title VARCHAR(200),
        review_text TEXT,
        performance_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create review_responses table
    await query(`
      CREATE TABLE IF NOT EXISTS review_responses (
        id SERIAL PRIMARY KEY,
        review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        response TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create venues table if it doesn't exist (basic structure)
    await query(`
      CREATE TABLE IF NOT EXISTS venues (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        address VARCHAR(300),
        city VARCHAR(100),
        county VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(255),
        website VARCHAR(255),
        capacity INTEGER,
        venue_type VARCHAR(100),
        equipment_provided JSONB DEFAULT '[]'::jsonb,
        social_media JSONB DEFAULT '{}'::jsonb,
        main_image TEXT,
        review_count INTEGER DEFAULT 0,
        average_rating DECIMAL(3,2) DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create indexes for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_venue_claims_user_id ON venue_claims(user_id);
      CREATE INDEX IF NOT EXISTS idx_venue_claims_venue_id ON venue_claims(venue_id);
      CREATE INDEX IF NOT EXISTS idx_venue_claims_status ON venue_claims(status);
      CREATE INDEX IF NOT EXISTS idx_venue_owners_user_id ON venue_owners(user_id);
      CREATE INDEX IF NOT EXISTS idx_venue_owners_venue_id ON venue_owners(venue_id);
      CREATE INDEX IF NOT EXISTS idx_venue_edits_venue_id ON venue_edits(venue_id);
      CREATE INDEX IF NOT EXISTS idx_venue_edits_user_id ON venue_edits(user_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_venue_id ON reviews(venue_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
      CREATE INDEX IF NOT EXISTS idx_review_responses_review_id ON review_responses(review_id);
    `);
    
    console.log('✅ Venue ownership system tables created successfully');
    
  } catch (error) {
    console.error('❌ Error creating venue ownership tables:', error);
    throw error;
  }
};

/**
 * Add sample data for testing
 */
const addSampleData = async () => {
  try {
    console.log('🔧 Adding sample data...');
    
    // Check if we already have sample data
    const existingUsers = await query('SELECT COUNT(*) FROM users');
    if (parseInt(existingUsers.rows[0].count) > 0) {
      console.log('📊 Sample data already exists, skipping...');
      return;
    }
    
    // Add sample admin user
    await query(`
      INSERT INTO users (
        firebase_uid, email, display_name, bio, created_at
      ) VALUES (
        'sample-admin-uid',
        'admin@bandvenuereview.ie',
        'Admin User',
        'System administrator for BandVenueReview.ie',
        CURRENT_TIMESTAMP
      ) ON CONFLICT (firebase_uid) DO NOTHING;
    `);
    
    // Add sample venues
    await query(`
      INSERT INTO venues (name, description, address, city, county, capacity, venue_type)
      VALUES 
        ('The Olympia Theatre', 'Historic Dublin venue hosting live music and theater', '72 Dame St, Dublin 2', 'Dublin', 'Dublin', 1400, 'Theater'),
        ('Vicar Street', 'Intimate Dublin venue known for great acoustics', '58-59 Thomas St, Dublin 8', 'Dublin', 'Dublin', 1050, 'Concert Hall'),
        ('Cyprus Avenue', 'Cork''s premier live music venue', 'Caroline St, Cork', 'Cork', 'Cork', 250, 'Music Venue')
      ON CONFLICT DO NOTHING;
    `);
    
    console.log('✅ Sample data added successfully');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
    throw error;
  }
};

/**
 * Run database migration
 */
const runMigration = async () => {
  try {
    console.log('🚀 Starting venue ownership system migration...');
    
    await initVenueOwnershipTables();
    await addSampleData();
    
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update your .env file with the required environment variables');
    console.log('2. Start the server with: npm run dev');
    console.log('3. Test the API endpoints with your frontend');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = {
  initVenueOwnershipTables,
  addSampleData,
  runMigration
};
