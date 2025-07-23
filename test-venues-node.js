// Quick test script for venues query
const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'sy7ko2cx',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2022-06-01',
});

async function testVenuesQuery() {
  try {
    console.log('🔍 Testing simple venues query...');
    
    // Test 1: Very simple venues query
    const simpleQuery = '*[_type == "venue"][0...3] { _id, name }';
    const simpleResult = await client.fetch(simpleQuery);
    console.log('✅ Simple venues query success:', simpleResult?.length || 0, 'venues');
    
    // Test 2: Full venues query (same as useVenues hook)
    const fullQuery = `*[_type == "venue" && !(_id in path("drafts.**"))] | order(name asc) {
      _id,
      name,
      slug,
      description,
      address,
      location,
      capacity,
      type,
      profileImage,
      contactInfo,
      verified,
      featured
    }`;
    
    const fullResult = await client.fetch(fullQuery);
    console.log('✅ Full venues query success:', fullResult?.length || 0, 'venues');
    
    // Test 3: Simplified full query without potentially problematic fields
    const safeQuery = `*[_type == "venue" && !(_id in path("drafts.**"))] | order(name asc) {
      _id,
      name,
      slug,
      description,
      address,
      verified,
      featured
    }`;
    
    const safeResult = await client.fetch(safeQuery);
    console.log('✅ Safe venues query success:', safeResult?.length || 0, 'venues');
    
    // Show first venue for debugging
    if (fullResult && fullResult.length > 0) {
      console.log('📄 First venue details:', JSON.stringify(fullResult[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Venues query failed:', error.message);
    console.error('Full error:', error);
  }
}

testVenuesQuery();
