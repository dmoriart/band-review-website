// Simple test to check if the Sanity client works in a React-like environment
const { createClient } = require('@sanity/client');

// Test both configurations
const clientWithCdn = createClient({
  projectId: 'sy7ko2cx',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2022-06-01',
});

const clientWithoutCdn = createClient({
  projectId: 'sy7ko2cx',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2022-06-01',
});

async function testBothConfigurations() {
  const query = `*[_type == "band" && !(_id in path("drafts.**"))] | order(name asc) [0...2] { _id, name }`;
  
  console.log('🔍 Testing Sanity client configurations...\n');
  
  // Test with CDN
  try {
    console.log('1️⃣ Testing WITH CDN (useCdn: true)...');
    const startTime = Date.now();
    const resultWithCdn = await clientWithCdn.fetch(query);
    const endTime = Date.now();
    console.log(`✅ CDN Success: ${resultWithCdn.length} bands in ${endTime - startTime}ms`);
    console.log(`   URL used: CDN endpoint (apicdn.sanity.io)`);
  } catch (error) {
    console.error(`❌ CDN Failed:`, error.message);
  }
  
  console.log();
  
  // Test without CDN  
  try {
    console.log('2️⃣ Testing WITHOUT CDN (useCdn: false)...');
    const startTime = Date.now();
    const resultWithoutCdn = await clientWithoutCdn.fetch(query);
    const endTime = Date.now();
    console.log(`✅ No-CDN Success: ${resultWithoutCdn.length} bands in ${endTime - startTime}ms`);
    console.log(`   URL used: Direct API endpoint (api.sanity.io)`);
  } catch (error) {
    console.error(`❌ No-CDN Failed:`, error.message);
  }
  
  console.log('\n🔍 Testing React app exact query...');
  const reactQuery = `*[_type == "band" && !(_id in path("drafts.**"))] | order(name asc) {
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
  
  try {
    const startTime = Date.now();
    const result = await clientWithoutCdn.fetch(reactQuery);
    const endTime = Date.now();
    console.log(`✅ React Query Success: ${result.length} bands in ${endTime - startTime}ms`);
    console.log(`   First band: ${result[0]?.name} with ${result[0]?.genres?.length || 0} genres`);
  } catch (error) {
    console.error(`❌ React Query Failed:`, error.message);
  }
}

testBothConfigurations();
