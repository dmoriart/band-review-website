const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

// Create Sanity client
const client = createClient({
  projectId: 'sy7ko2cx',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2022-06-01',
  token: process.env.SANITY_TOKEN, // You'll need to set this
});

async function importGenres() {
  try {
    console.log('🎵 Starting genre import...');
    
    // Read the genre.json file
    const genresPath = path.join(__dirname, 'genre.json');
    const genresData = JSON.parse(fs.readFileSync(genresPath, 'utf8'));
    
    console.log(`📚 Found ${genresData.length} genres to import`);
    
    // Transform the genre data to Sanity document format
    const genreDocuments = genresData.map(genre => ({
      _type: 'genre',
      name: genre.name,
      slug: {
        _type: 'slug',
        current: genre.slug
      },
      description: genre.description,
      color: {
        _type: 'color',
        hex: genre.color
      },
      // We'll handle parent relationships after all genres are created
      parentGenre: null
    }));
    
    // Create all genres first (without parent relationships)
    console.log('📝 Creating genre documents...');
    
    const createdGenres = [];
    for (let i = 0; i < genreDocuments.length; i++) {
      const genreDoc = genreDocuments[i];
      try {
        const result = await client.create(genreDoc);
        createdGenres.push({
          ...result,
          originalSlug: genresData[i].slug,
          parentGenreSlug: genresData[i].parentGenre
        });
        console.log(`✅ Created: ${genreDoc.name}`);
      } catch (error) {
        console.error(`❌ Failed to create ${genreDoc.name}:`, error.message);
      }
    }
    
    // Now update parent relationships
    console.log('\n🔗 Setting up parent-child relationships...');
    
    for (const genre of createdGenres) {
      if (genre.parentGenreSlug) {
        // Find the parent genre by slug
        const parentGenre = createdGenres.find(g => g.originalSlug === genre.parentGenreSlug);
        if (parentGenre) {
          try {
            await client
              .patch(genre._id)
              .set({
                parentGenre: {
                  _type: 'reference',
                  _ref: parentGenre._id
                }
              })
              .commit();
            console.log(`🔗 Linked ${genre.name} → ${parentGenre.name}`);
          } catch (error) {
            console.error(`❌ Failed to link ${genre.name} to ${parentGenre.name}:`, error.message);
          }
        } else {
          console.warn(`⚠️  Parent genre '${genre.parentGenreSlug}' not found for '${genre.name}'`);
        }
      }
    }
    
    console.log(`\n🎉 Genre import completed! Created ${createdGenres.length} genres.`);
    
    // Verify the import
    const importedGenres = await client.fetch('*[_type == "genre"] | order(name asc) { _id, name, slug, parentGenre->name }');
    console.log('\n📊 Import verification:');
    importedGenres.forEach(genre => {
      const parentInfo = genre.parentGenre ? ` (child of ${genre.parentGenre})` : '';
      console.log(`  • ${genre.name}${parentInfo}`);
    });
    
  } catch (error) {
    console.error('💥 Import failed:', error);
  }
}

// Check if SANITY_TOKEN is set
if (!process.env.SANITY_TOKEN) {
  console.error('❌ SANITY_TOKEN environment variable is required');
  console.log('💡 Get your token from: https://manage.sanity.io/');
  console.log('💡 Then run: SANITY_TOKEN=your_token_here node import-genres.js');
  process.exit(1);
}

importGenres();
