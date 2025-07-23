import React from 'react';
import { client } from '../sanity';

const VenuesDebugTest: React.FC = () => {
  const [result, setResult] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);

  const testVenuesQuery = async () => {
    setLoading(true);
    setResult('Testing venues query...');
    
    try {
      console.log('🔍 Testing venues query...');
      
      // Test simple venues query first
      const simpleQuery = '*[_type == "venue"][0...3] { _id, name }';
      const simpleData = await (client as any).fetch(simpleQuery);
      console.log('Simple venues query result:', simpleData);
      
      // Test full venues query
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
      
      const fullData = await (client as any).fetch(fullQuery);
      console.log('Full venues query result:', fullData);
      
      setResult(`✅ Venues Success! Simple: ${simpleData?.length || 0}, Full: ${fullData?.length || 0} venues`);
      
    } catch (error: any) {
      console.error('❌ Venues query error:', error);
      setResult(`❌ Venues Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testBandsQuery = async () => {
    setLoading(true);
    setResult('Testing bands query for comparison...');
    
    try {
      console.log('🔍 Testing bands query for comparison...');
      
      const bandsQuery = '*[_type == "band"][0...3] { _id, name }';
      const bandsData = await (client as any).fetch(bandsQuery);
      console.log('Bands query result:', bandsData);
      
      setResult(`✅ Bands Success! Found ${bandsData?.length || 0} bands`);
      
    } catch (error: any) {
      console.error('❌ Bands query error:', error);
      setResult(`❌ Bands Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectFetch = async () => {
    setLoading(true);
    setResult('Testing direct venues fetch...');
    
    try {
      console.log('🔍 Testing direct venues fetch...');
      
      const url = 'https://sy7ko2cx.api.sanity.io/v2022-06-01/data/query/production?query=*%5B_type%20%3D%3D%20%22venue%22%5D%20%5B0...3%5D%20%7B%20_id%2C%20name%20%7D';
      
      const response = await fetch(url);
      console.log('Direct fetch response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Direct fetch data:', data);
      
      setResult(`✅ Direct Fetch Success! Found ${data.result?.length || 0} venues`);
      
    } catch (error: any) {
      console.error('❌ Direct fetch error:', error);
      setResult(`❌ Direct Fetch Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#f5f5f5', margin: '20px', borderRadius: '5px' }}>
      <h3>Venues Debug Test</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testVenuesQuery} disabled={loading} style={{ marginRight: '10px' }}>
          Test Venues Query
        </button>
        <button onClick={testBandsQuery} disabled={loading} style={{ marginRight: '10px' }}>
          Test Bands Query
        </button>
        <button onClick={testDirectFetch} disabled={loading}>
          Test Direct Fetch
        </button>
      </div>
      
      <div style={{ 
        padding: '15px', 
        backgroundColor: result.includes('✅') ? '#d4edda' : result.includes('❌') ? '#f8d7da' : '#e2e3e5',
        border: '1px solid #ccc',
        borderRadius: '4px',
        minHeight: '50px'
      }}>
        {loading ? 'Loading...' : result || 'Click a button to test venues connectivity'}
      </div>
      
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        <p>This test isolates venues queries to identify the specific issue.</p>
        <p>Check browser console (F12) for detailed logs.</p>
      </div>
    </div>
  );
};

export default VenuesDebugTest;
