// Test the exact same query that the React app is using
const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'sy7ko2cx',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2022-06-01',
});

async function testBandsQuery() {
  try {
    const query = `*[_type == "band" && !(_id in path("drafts.**"))] | order(name asc) {
      _id,
      name,
      slug,
      bio,
      "genres": genres[]->{ name, slug, color },
      locationText,
      formedYear,
      profileImage,
      socialLinks,
      verified,
      featured
    }`;
    
    console.log('🔍 Testing exact React app query...');
    console.log('Client config:', {
      projectId: 'sy7ko2cx',
      dataset: 'production',
      useCdn: false,
      apiVersion: '2022-06-01'
    });
    
    const result = await client.fetch(query);
    console.log(`✅ Success! Found ${result.length} bands`);
    
    result.forEach(band => {
      console.log(`  • ${band.name} (${band.genres?.length || 0} genres)`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      details: error.details
    });
  }
}

testBandsQuery();
