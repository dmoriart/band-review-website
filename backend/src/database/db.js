const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err.message);
});

/**
 * Execute a database query
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Object} Query result
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Query executed in ${duration}ms:`, text.substring(0, 100));
    }
    
    return res;
  } catch (error) {
    console.error('❌ Database query error:', error.message);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 */
const getClient = async () => {
  return await pool.connect();
};

/**
 * Database schema creation queries
 */
const createTables = async () => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,  -- Firebase UID
        email VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_admin BOOLEAN DEFAULT FALSE
      )
    `);

    // Band ownership table
    await client.query(`
      CREATE TABLE IF NOT EXISTS band_ownership (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        band_id VARCHAR(255) NOT NULL,  -- Sanity band _id
        band_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'editor')),
        status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
        claim_method VARCHAR(50) NOT NULL CHECK (claim_method IN ('email', 'social', 'manual')),
        verification_data JSONB,
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP,
        approved_by VARCHAR(255) REFERENCES users(id),
        rejected_at TIMESTAMP,
        rejected_by VARCHAR(255) REFERENCES users(id),
        UNIQUE(user_id, band_id)  -- One claim per user per band
      )
    `);

    // Indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_band_ownership_user_id ON band_ownership(user_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_band_ownership_band_id ON band_ownership(band_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_band_ownership_status ON band_ownership(status);
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating database tables:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  query,
  getClient,
  pool,
  createTables
};
