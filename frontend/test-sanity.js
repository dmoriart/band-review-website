// Quick test of Sanity connection
const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'sy7ko2cx',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2022-06-01',
});

async function testConnection() {
  try {
    console.log('Testing Sanity connection...');
    
    // Test basic connection
    const bands = await client.fetch('*[_type == "band" && !(_id in path("drafts.**"))] { _id, name, "genres": genres[]->{ name, slug, color } }');
    console.log('Bands:', JSON.stringify(bands, null, 2));
    
    const venues = await client.fetch('*[_type == "venue" && !(_id in path("drafts.**"))] { _id, name }');
    console.log('Venues:', JSON.stringify(venues, null, 2));
    
    // Test genres
    const genreCount = await client.fetch('count(*[_type == "genre"])');
    console.log(`\n📊 Total genres imported: ${genreCount}`);
    
    const sampleGenres = await client.fetch('*[_type == "genre"] | order(name asc) [0...5] { name, slug, color, "parent": parentGenre->name }');
    console.log('Sample genres:', JSON.stringify(sampleGenres, null, 2));
    
    console.log('✅ Sanity connection successful!');
  } catch (error) {
    console.error('❌ Sanity connection failed:', error);
  }
}

testConnection();
