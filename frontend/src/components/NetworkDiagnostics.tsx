import React from 'react';
import { client } from '../sanity';
import './NetworkDiagnostics.css';

const NetworkDiagnostics: React.FC = () => {
  const [result, setResult] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);

  const testBasicConnectivity = async () => {
    setLoading(true);
    setResult('Testing basic connectivity...');
    
    try {
      console.log('🔍 Testing basic network connectivity...');
      
      // Test 1: Can we reach Sanity's API at all?
      const basicUrl = 'https://sy7ko2cx.api.sanity.io/v2022-06-01/data/doc/production/genre-rock';
      const response = await fetch(basicUrl);
      
      console.log('Basic connectivity test - Status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Basic connectivity works! Got document: ${data.documents?.[0]?.name || 'Unknown'}`);
      } else {
        setResult(`❌ Basic connectivity failed: ${response.status} ${response.statusText}`);
      }
      
    } catch (error: any) {
      console.error('❌ Basic connectivity error:', error);
      setResult(`❌ Network Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSimpleQuery = async () => {
    setLoading(true);
    setResult('Testing simple query...');
    
    try {
      console.log('🔍 Testing simple query...');
      
      // Test very simple query
      const query = '*[_type == "genre"][0...1] { _id, name }';
      const result = await (client as any).fetch(query);
      
      console.log('Simple query result:', result);
      setResult(`✅ Simple query works! Found ${result?.length || 0} genres`);
      
    } catch (error: any) {
      console.error('❌ Simple query error:', error);
      setResult(`❌ Simple Query Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testWithDifferentClient = async () => {
    setLoading(true);
    setResult('Testing with fresh client...');
    
    try {
      console.log('🔍 Testing with fresh client instance...');
      
      // Create a completely fresh client instance
      const { createClient } = await import('@sanity/client');
      const freshClient = createClient({
        projectId: 'sy7ko2cx',
        dataset: 'production',
        useCdn: false,
        apiVersion: '2022-06-01',
        withCredentials: false
      });
      
      const query = '*[_type == "band"][0...1] { _id, name }';
      const result = await (freshClient as any).fetch(query);
      
      console.log('Fresh client result:', result);
      setResult(`✅ Fresh client works! Found ${result?.length || 0} bands`);
      
    } catch (error: any) {
      console.error('❌ Fresh client error:', error);
      setResult(`❌ Fresh Client Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCorsHeaders = async () => {
    setLoading(true);
    setResult('Testing CORS headers...');
    
    try {
      console.log('🔍 Testing CORS preflight...');
      
      // Test with explicit headers to see if CORS is the issue
      const url = 'https://sy7ko2cx.api.sanity.io/v2022-06-01/data/query/production?query=*%5B_type%20%3D%3D%20%22genre%22%5D%20%5B0...1%5D%20%7B%20_id%2C%20name%20%7D';
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit'
      });
      
      console.log('CORS test - Status:', response.status);
      console.log('CORS test - Headers:', Array.from(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        setResult(`✅ CORS test works! Found ${data.result?.length || 0} items`);
      } else {
        setResult(`❌ CORS test failed: ${response.status} ${response.statusText}`);
      }
      
    } catch (error: any) {
      console.error('❌ CORS test error:', error);
      setResult(`❌ CORS Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="network-diagnostics-container">
      <h3>🔧 Network Diagnostics</h3>
      <p><strong>Issue:</strong> Both bands and venues queries failing with "Request error"</p>
      
      <div className="network-diagnostics-button-group">
        <button onClick={testBasicConnectivity} disabled={loading} className="network-diagnostics-button">
          Test Basic Connectivity
        </button>
        <button onClick={testSimpleQuery} disabled={loading} className="network-diagnostics-button">
          Test Simple Query
        </button>
        <button onClick={testWithDifferentClient} disabled={loading} className="network-diagnostics-button">
          Test Fresh Client
        </button>
        <button onClick={testCorsHeaders} disabled={loading} className="network-diagnostics-button">
          Test CORS Headers
        </button>
      </div>
      
      <div
        className={`network-diagnostics-result ${
          result.includes('✅')
            ? 'network-diagnostics-success'
            : result.includes('❌')
            ? 'network-diagnostics-error'
            : 'network-diagnostics-neutral'
        }`}
      >
        {loading ? 'Testing...' : result || 'Click a button to run network diagnostics'}
      </div>
      <div className="network-diagnostics-troubleshooting">
        <p><strong>Troubleshooting Steps:</strong></p>
        <ol>
          <li>Test basic connectivity to see if we can reach Sanity at all</li>
          <li>Try simple queries to isolate complex query issues</li>
          <li>Test with fresh client to rule out configuration problems</li>
          <li>Check CORS headers to identify browser security blocks</li>
        </ol>
      </div>
      </div>
  );
};

export default NetworkDiagnostics;
