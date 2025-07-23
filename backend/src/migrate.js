const { createTables } = require('./database/db');

async function migrate() {
  try {
    console.log('🔄 Starting database migration...');
    await createTables();
    console.log('✅ Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
