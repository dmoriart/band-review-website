const fs = require('fs').promises;
const path = require('path');
const db = require('./db');

async function initializeMerchandiseDatabase() {
  try {
    console.log('🚀 Initializing merchandise store database...');

    // Read the merchandise schema SQL file
    const schemaPath = path.join(__dirname, '../../../database-schema/merchandise-schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');

    // Execute the schema
    await db.query(schemaSql);

    console.log('✅ Merchandise database schema created successfully');

    // Add sample data
    await addSampleData();

    console.log('🎉 Merchandise store database initialization complete!');

  } catch (error) {
    console.error('❌ Error initializing merchandise database:', error);
    throw error;
  }
}

async function addSampleData() {
  console.log('📦 Adding sample merchandise data...');

  // Sample product categories are already inserted by the schema
  
  // Add sample products for existing bands (if any)
  const sampleProducts = [
    {
      band_id: 'sample-band-1',
      title: 'Band T-Shirt - Black',
      description: 'High-quality cotton t-shirt with band logo',
      price: 25.00,
      category: 'tshirt',
      inventory_count: 50,
      variants: JSON.stringify({
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['black', 'white']
      }),
      weight_grams: 200,
      dimensions: JSON.stringify({
        length: 30,
        width: 20,
        height: 1
      }),
      tags: JSON.stringify(['merchandise', 'clothing', 'band-tee']),
      is_featured: true
    },
    {
      band_id: 'sample-band-1',
      title: 'Latest Album - CD',
      description: 'Our latest studio album on compact disc',
      price: 15.00,
      category: 'cd',
      inventory_count: 100,
      weight_grams: 100,
      dimensions: JSON.stringify({
        length: 14,
        width: 12.5,
        height: 1
      }),
      tags: JSON.stringify(['music', 'album', 'cd']),
      is_featured: false
    },
    {
      band_id: 'sample-band-1',
      title: 'Digital Album Download',
      description: 'High-quality digital download of our latest album',
      price: 10.00,
      category: 'digital',
      inventory_count: 0, // Digital products don't need inventory
      digital_file_url: 'https://example.com/downloads/album.zip',
      digital_file_size: 157286400, // ~150MB
      tags: JSON.stringify(['music', 'album', 'digital', 'download']),
      is_featured: true
    },
    {
      band_id: 'sample-band-2',
      title: 'Vinyl Record - Limited Edition',
      description: 'Limited edition vinyl pressing of our debut album',
      price: 35.00,
      category: 'vinyl',
      inventory_count: 25,
      variants: JSON.stringify({
        colors: ['black', 'clear', 'colored']
      }),
      weight_grams: 180,
      dimensions: JSON.stringify({
        length: 31.5,
        width: 31.5,
        height: 0.5
      }),
      tags: JSON.stringify(['vinyl', 'limited-edition', 'collectible']),
      is_featured: true
    },
    {
      band_id: 'sample-band-2',
      title: 'Band Poster - Concert Art',
      description: 'High-quality poster featuring concert artwork',
      price: 12.00,
      category: 'poster',
      inventory_count: 75,
      variants: JSON.stringify({
        sizes: ['A3', 'A2', 'A1']
      }),
      weight_grams: 50,
      dimensions: JSON.stringify({
        length: 42,
        width: 30,
        height: 0.1
      }),
      tags: JSON.stringify(['poster', 'art', 'concert']),
      is_featured: false
    }
  ];

  for (const product of sampleProducts) {
    try {
      const query = `
        INSERT INTO products (
          band_id, title, description, price, category, inventory_count,
          variants, digital_file_url, digital_file_size, weight_grams,
          dimensions, tags, is_featured, seo_slug
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (band_id, seo_slug) DO NOTHING
      `;

      const seoSlug = product.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-') + '-' + Date.now();

      await db.query(query, [
        product.band_id,
        product.title,
        product.description,
        product.price,
        product.category,
        product.inventory_count,
        product.variants,
        product.digital_file_url || null,
        product.digital_file_size || null,
        product.weight_grams,
        product.dimensions,
        product.tags,
        product.is_featured,
        seoSlug
      ]);

      console.log(`  ✓ Added sample product: ${product.title}`);
    } catch (error) {
      console.log(`  ⚠️  Skipped product ${product.title} (may already exist)`);
    }
  }

  // Add sample platform settings (if not already exist)
  const platformSettings = [
    ['stripe_publishable_key', '', 'Stripe publishable key for frontend'],
    ['stripe_webhook_secret', '', 'Stripe webhook endpoint secret'],
    ['frontend_url', 'http://localhost:3000', 'Frontend application URL'],
    ['support_email', 'support@bandvenuereview.ie', 'Customer support email'],
    ['company_name', 'BandVenueReview.ie', 'Company name for invoices'],
    ['company_address', 'Dublin, Ireland', 'Company address for invoices']
  ];

  for (const [key, value, description] of platformSettings) {
    try {
      await db.query(
        'INSERT INTO platform_settings (key, value, description) VALUES ($1, $2, $3) ON CONFLICT (key) DO NOTHING',
        [key, value, description]
      );
    } catch (error) {
      // Settings may already exist, continue
    }
  }

  console.log('✅ Sample merchandise data added successfully');
}

// Function to check if merchandise tables exist
async function checkMerchandiseTablesExist() {
  try {
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('products', 'cart_items', 'orders', 'order_items', 'band_stripe_accounts')
    `);
    
    return result.rows.length >= 5; // All main tables should exist
  } catch (error) {
    return false;
  }
}

// Function to run migrations if needed
async function runMerchandiseMigrations() {
  try {
    const tablesExist = await checkMerchandiseTablesExist();
    
    if (!tablesExist) {
      console.log('🔄 Merchandise tables not found, running initialization...');
      await initializeMerchandiseDatabase();
    } else {
      console.log('✅ Merchandise tables already exist');
    }
  } catch (error) {
    console.error('❌ Error running merchandise migrations:', error);
    throw error;
  }
}

module.exports = {
  initializeMerchandiseDatabase,
  addSampleData,
  checkMerchandiseTablesExist,
  runMerchandiseMigrations
};

// Run initialization if this file is executed directly
if (require.main === module) {
  runMerchandiseMigrations()
    .then(() => {
      console.log('🎉 Merchandise database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to setup merchandise database:', error);
      process.exit(1);
    });
}
