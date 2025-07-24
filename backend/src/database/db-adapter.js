const { Pool } = require('pg');
const path = require('path');

// Check if we're using SQLite or PostgreSQL
const databaseUrl = process.env.DATABASE_URL;
const isPostgres = databaseUrl && databaseUrl.startsWith('postgresql://');
const isSQLite = databaseUrl && (databaseUrl.startsWith('sqlite://') || databaseUrl.includes('.db'));

let pool;
let sqlite3;
let db;

if (isPostgres) {
  // PostgreSQL configuration
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
  });

  pool.on('error', (err) => {
    console.error('❌ PostgreSQL connection error:', err.message);
  });
} else if (isSQLite) {
  // SQLite configuration
  try {
    sqlite3 = require('sqlite3').verbose();
    let dbPath;
    
    if (databaseUrl.startsWith('sqlite:///')) {
      dbPath = databaseUrl.replace('sqlite:///', '');
    } else if (databaseUrl.includes('.db')) {
      dbPath = databaseUrl;
    } else {
      dbPath = 'bandvenuereview_dev.db'; // fallback
    }
    
    const fullPath = path.resolve(dbPath);
    
    db = new sqlite3.Database(fullPath, (err) => {
      if (err) {
        console.error('❌ SQLite connection error:', err.message);
      } else {
        console.log('✅ Connected to SQLite database at:', fullPath);
      }
    });
  } catch (error) {
    console.error('❌ SQLite not available. Please install sqlite3: npm install sqlite3');
    console.log('💡 Or use PostgreSQL by updating DATABASE_URL in .env');
    process.exit(1);
  }
} else {
  console.warn('⚠️ No valid DATABASE_URL configured. Using fallback SQLite database');
  // Fallback to SQLite
  try {
    sqlite3 = require('sqlite3').verbose();
    const fallbackPath = path.resolve('bandvenuereview_dev.db');
    
    db = new sqlite3.Database(fallbackPath, (err) => {
      if (err) {
        console.error('❌ Fallback SQLite connection error:', err.message);
      } else {
        console.log('✅ Connected to fallback SQLite database at:', fallbackPath);
      }
    });
  } catch (error) {
    console.error('❌ No database connection available');
    process.exit(1);
  }
}

/**
 * Execute a database query (works with both PostgreSQL and SQLite)
 */
const query = async (text, params = []) => {
  const start = Date.now();
  
  try {
    if (isPostgres) {
      // PostgreSQL query
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 PostgreSQL query executed in ${duration}ms:`, text.substring(0, 100));
      }
      
      return res;
    } else if (isSQLite || db) {
      // SQLite query - convert PostgreSQL syntax to SQLite
      let sqliteQuery = convertToSQLite(text);
      
      return new Promise((resolve, reject) => {
        if (sqliteQuery.trim().toUpperCase().startsWith('SELECT')) {
          db.all(sqliteQuery, params, (err, rows) => {
            const duration = Date.now() - start;
            
            if (err) {
              console.error('❌ SQLite query error:', err.message);
              console.error('Query:', sqliteQuery);
              console.error('Params:', params);
              reject(err);
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.log(`🔍 SQLite query executed in ${duration}ms:`, sqliteQuery.substring(0, 100));
              }
              resolve({ rows, rowCount: rows.length });
            }
          });
        } else {
          db.run(sqliteQuery, params, function(err) {
            const duration = Date.now() - start;
            
            if (err) {
              console.error('❌ SQLite query error:', err.message);
              console.error('Query:', sqliteQuery);
              console.error('Params:', params);
              reject(err);
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.log(`🔍 SQLite query executed in ${duration}ms:`, sqliteQuery.substring(0, 100));
              }
              
              // For INSERT queries, return the inserted row
              if (sqliteQuery.trim().toUpperCase().includes('RETURNING')) {
                const selectQuery = `SELECT * FROM ${extractTableName(sqliteQuery)} WHERE rowid = ${this.lastID}`;
                db.get(selectQuery, [], (err, row) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve({ rows: row ? [row] : [], rowCount: this.changes });
                  }
                });
              } else {
                resolve({ rows: [], rowCount: this.changes });
              }
            }
          });
        }
      });
    } else {
      throw new Error('No database connection configured');
    }
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`❌ Database query failed after ${duration}ms:`, error.message);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
};

/**
 * Convert PostgreSQL queries to SQLite syntax
 */
const convertToSQLite = (pgQuery) => {
  let sqliteQuery = pgQuery;
  
  // Replace PostgreSQL-specific syntax
  sqliteQuery = sqliteQuery.replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT');
  sqliteQuery = sqliteQuery.replace(/CURRENT_TIMESTAMP/g, "datetime('now')");
  sqliteQuery = sqliteQuery.replace(/JSONB/g, 'TEXT');
  sqliteQuery = sqliteQuery.replace(/::jsonb/g, '');
  sqliteQuery = sqliteQuery.replace(/\$(\d+)/g, '?'); // Replace $1, $2, etc. with ?
  
  // Remove PostgreSQL-specific constraints and features
  sqliteQuery = sqliteQuery.replace(/ON DELETE CASCADE/g, '');
  sqliteQuery = sqliteQuery.replace(/ON DELETE SET NULL/g, '');
  sqliteQuery = sqliteQuery.replace(/REFERENCES [^,\)]+/g, '');
  
  // Handle RETURNING clause (SQLite doesn't support it directly)
  const returningMatch = sqliteQuery.match(/RETURNING \*/);
  if (returningMatch) {
    sqliteQuery = sqliteQuery.replace(/RETURNING \*/, '');
  }
  
  return sqliteQuery;
};

/**
 * Extract table name from INSERT query
 */
const extractTableName = (query) => {
  const match = query.match(/INSERT INTO\s+(\w+)/i);
  return match ? match[1] : 'unknown_table';
};

/**
 * Get a client from the pool (PostgreSQL only)
 */
const getClient = async () => {
  if (isPostgres) {
    return await pool.connect();
  } else {
    // For SQLite, return a mock client that uses the same db connection
    return {
      query: async (text, params) => {
        // Start a transaction for SQLite
        return new Promise((resolve, reject) => {
          db.serialize(() => {
            db.run('BEGIN', (err) => {
              if (err) reject(err);
              else resolve({
                query: query,
                release: () => {
                  db.run('COMMIT', () => {});
                }
              });
            });
          });
        });
      },
      release: () => {
        db.run('COMMIT', () => {});
      }
    };
  }
};

/**
 * Close database connection
 */
const closeConnection = () => {
  if (isPostgres && pool) {
    pool.end();
  } else if (isSQLite && db) {
    db.close();
  }
};

module.exports = {
  query,
  getClient,
  closeConnection,
  isPostgres,
  isSQLite
};
