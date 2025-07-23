import React, { useState, useEffect } from 'react';
import './DirectAPITest.css';

const DirectAPITest: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testDirectFetch = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      console.log('🔍 Testing direct fetch to Sanity API...');
      
      const url = 'https://sy7ko2cx.api.sanity.io/v2022-06-01/data/query/production?query=*%5B_type%20%3D%3D%20%22band%22%5D%20%5B0...3%5D%20%7B%20_id%2C%20name%20%7D';
      
      const response = await fetch(url);
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      setResult(`✅ Success! Found ${data.result?.length || 0} bands: ${data.result?.map((b: any) => b.name).join(', ')}`);
      
    } catch (error: any) {
      console.error('❌ Direct fetch error:', error);
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSanityClient = async () => {
    setLoading(true);
    setResult('Testing Sanity client...');
    
    try {
      // Import Sanity client dynamically to avoid build issues
      const { createClient } = await import('@sanity/client');
      
      const client = createClient({
        projectId: 'sy7ko2cx',
        dataset: 'production',
        useCdn: false,
        apiVersion: '2022-06-01',
      });
      
      console.log('🔍 Testing Sanity client...');
      const data = await (client as any).fetch('*[_type == "band"] [0...3] { _id, name }');
      console.log('Sanity client data:', data);
      
      setResult(`✅ Sanity Client Success! Found ${data?.length || 0} bands: ${data?.map((b: any) => b.name).join(', ')}`);
      
    } catch (error: any) {
      console.error('❌ Sanity client error:', error);
      setResult(`❌ Sanity Client Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="direct-api-test-container">
      <h2>Direct API Connection Test</h2>
      
      <div className="direct-api-test-buttons">
        <button onClick={testDirectFetch} disabled={loading} className="direct-api-test-button">
          Test Direct Fetch
        </button>
        <button onClick={testSanityClient} disabled={loading} className="direct-api-test-button">
          Test Sanity Client
        </button>
      </div>
      
      <div
        className={`direct-api-test-result ${
          result.includes('✅')
            ? 'success'
            : result.includes('❌')
            ? 'error'
            : 'neutral'
        }`}
      >
        {loading ? 'Loading...' : result || 'Click a button to test the connection'}
      </div>
      
      <div className="direct-api-test-footer">
        <p>Open browser developer console (F12) to see detailed logs</p>
      </div>
    </div>
  );
};

export default DirectAPITest;
