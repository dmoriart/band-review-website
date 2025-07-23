// Direct browser test - this should be run in the browser console
// Copy and paste this into your browser's developer console when the React app is running

console.log('🔍 Testing Sanity API directly from browser...');

// Test fetch directly (this is what the Sanity client uses under the hood)
const testUrl = 'https://sy7ko2cx.api.sanity.io/v2022-06-01/data/query/production?query=*%5B_type%20%3D%3D%20%22band%22%5D%20%5B0...2%5D%20%7B%20_id%2C%20name%20%7D';

fetch(testUrl)
  .then(response => {
    console.log('✅ Fetch response received:', response.status, response.statusText);
    return response.json();
  })
  .then(data => {
    console.log('✅ Data received:', data);
    console.log(`📊 Found ${data.result?.length || 0} bands`);
  })
  .catch(error => {
    console.error('❌ Fetch error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  });

// Also test the Sanity client directly
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'sy7ko2cx',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2022-06-01',
});

client.fetch('*[_type == "band"] [0...2] { _id, name }')
  .then(result => {
    console.log('✅ Sanity client success:', result);
  })
  .catch(error => {
    console.error('❌ Sanity client error:', error);
  });
