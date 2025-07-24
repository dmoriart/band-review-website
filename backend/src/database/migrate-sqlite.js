const { query, isSQLite } = require('./db-adapter');

/**
 * Initialize venue ownership system tables for SQLite
 */
const initSQLiteTables = async () => {
  try {
    console.log('🔧 Creating SQLite venue ownership system tables...');
    
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        display_name TEXT,
        bio TEXT,
        location TEXT,
        website TEXT,
        profile_picture_url TEXT,
        notification_preferences TEXT DEFAULT '{"email_venue_updates": true, "email_review_responses": true, "email_claim_updates": true, "email_marketing": false}',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        last_login_at TEXT DEFAULT (datetime('now'))
      );
    `);
    
    // Create venue_claims table
    await query(`
      CREATE TABLE IF NOT EXISTS venue_claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        venue_id INTEGER NOT NULL,
        venue_name TEXT NOT NULL,
        claim_type TEXT CHECK (claim_type IN ('ownership', 'management')) DEFAULT 'ownership',
        verification_data TEXT,
        business_documents TEXT DEFAULT '[]',
        additional_notes TEXT,
        status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'requires_verification')) DEFAULT 'pending',
        submitted_at TEXT DEFAULT (datetime('now')),
        reviewed_at TEXT,
        reviewed_by INTEGER,
        admin_notes TEXT,
        rejection_reason TEXT
      );
    `);
    
    // Create venue_owners table
    await query(`
      CREATE TABLE IF NOT EXISTS venue_owners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        venue_id INTEGER NOT NULL,
        role TEXT CHECK (role IN ('owner', 'manager', 'editor')) DEFAULT 'owner',
        permissions TEXT DEFAULT '["edit", "respond_to_reviews"]',
        granted_at TEXT DEFAULT (datetime('now')),
        granted_by INTEGER,
        UNIQUE(user_id, venue_id)
      );
    `);
    
    // Create venue_edits table
    await query(`
      CREATE TABLE IF NOT EXISTS venue_edits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venue_id INTEGER NOT NULL,
        user_id INTEGER,
        edit_type TEXT NOT NULL,
        changes TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    
    // Create venue_verifications table
    await query(`
      CREATE TABLE IF NOT EXISTS venue_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venue_id INTEGER NOT NULL,
        verification_type TEXT NOT NULL,
        verification_data TEXT,
        verified_by INTEGER,
        verified_at TEXT DEFAULT (datetime('now')),
        status TEXT CHECK (status IN ('verified', 'failed', 'pending')) DEFAULT 'verified'
      );
    `);
    
    // Create reviews table
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        venue_id INTEGER NOT NULL,
        band_id INTEGER,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
        title TEXT,
        review_text TEXT,
        performance_date TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
    
    // Create review_responses table
    await query(`
      CREATE TABLE IF NOT EXISTS review_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        review_id INTEGER,
        user_id INTEGER,
        response TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    
    // Create venues table
    await query(`
      CREATE TABLE IF NOT EXISTS venues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        address TEXT,
        city TEXT,
        county TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        capacity INTEGER,
        venue_type TEXT,
        equipment_provided TEXT DEFAULT '[]',
        social_media TEXT DEFAULT '{}',
        main_image TEXT,
        review_count INTEGER DEFAULT 0,
        average_rating REAL DEFAULT 0.0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
    
    console.log('✅ SQLite venue ownership system tables created successfully');
    
  } catch (error) {
    console.error('❌ Error creating SQLite venue ownership tables:', error);
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
    const existingUsers = await query('SELECT COUNT(*) as count FROM users');
    const userCount = isSQLite ? existingUsers.rows[0].count : parseInt(existingUsers.rows[0].count);
    
    if (userCount > 0) {
      console.log('📊 Sample data already exists, skipping...');
      return;
    }
    
    // Add sample admin user
    await query(`
      INSERT INTO users (
        firebase_uid, email, display_name, bio, created_at
      ) VALUES (
        ?, ?, ?, ?, ?
      )
    `, [
      'sample-admin-uid',
      'admin@bandvenuereview.ie',
      'Admin User',
      'System administrator for BandVenueReview.ie',
      new Date().toISOString()
    ]);
    
    // Add sample venues
    await query(`
      INSERT INTO venues (name, description, address, city, county, capacity, venue_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['The Olympia Theatre', 'Historic Dublin venue hosting live music and theater', '72 Dame St, Dublin 2', 'Dublin', 'Dublin', 1400, 'Theater']);
    
    await query(`
      INSERT INTO venues (name, description, address, city, county, capacity, venue_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['Vicar Street', 'Intimate Dublin venue known for great acoustics', '58-59 Thomas St, Dublin 8', 'Dublin', 'Dublin', 1050, 'Concert Hall']);
    
    await query(`
      INSERT INTO venues (name, description, address, city, county, capacity, venue_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['Cyprus Avenue', 'Cork\'s premier live music venue', 'Caroline St, Cork', 'Cork', 'Cork', 250, 'Music Venue']);
    
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
    
    // Always use SQLite migration for this script
    await initSQLiteTables();
    await addSampleData();
    
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Add your Firebase credentials to the .env file');
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
  initSQLiteTables,
  addSampleData,
  runMigration
};
