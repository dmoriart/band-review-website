import React, { useState, useEffect } from 'react';
import { ApiClient } from '../services/apiClient';
import './ApiTestComponent.css';

interface Band {
  id: number;
  name: string;
  slug: string;
  bio: string;
  genres: string[];
  hometown: string;
  county: string;
  is_verified: boolean;
  created_at: string;
}

const ApiTestComponent: React.FC = () => {
  const [bands, setBands] = useState<Band[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string>('');

  // Remove the unused apiClient instance
  // const apiClient = new ApiClient();

  const testApiConnection = async () => {
    setLoading(true);
    setError(null);
    setTestResult('Testing API connection...');
    
    try {
      console.log('🔍 Testing new backend API...');
      
      // Test the bands endpoint
      const response = await ApiClient.getBands();
      console.log('✅ API Response:', response);
      
      setBands(response.bands || []);
      setTestResult(`✅ API Success! Found ${response.bands?.length || 0} bands`);
      
    } catch (err: any) {
      console.error('❌ API Error:', err);
      setError(err.message);
      setTestResult(`❌ API Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testBandCreation = async () => {
    setLoading(true);
    setError(null);
    setTestResult('Testing band creation...');
    
    try {
      console.log('🎸 Testing band creation...');
      
      const newBand = {
        name: `Test Band ${Date.now()}`,
        slug: `test-band-${Date.now()}`,
        bio: 'Created by API test component',
        genres: ['rock', 'test'],
        hometown: 'Dublin',
        county: 'Dublin'
      };
      
      const response = await ApiClient.createBand(newBand);
      console.log('✅ Band Created:', response);
      
      setTestResult(`✅ Band Created: ${response.band?.name}`);
      
      // Refresh the bands list
      await testApiConnection();
      
    } catch (err: any) {
      console.error('❌ Band Creation Error:', err);
      setError(err.message);
      setTestResult(`❌ Creation Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load bands on component mount
    testApiConnection();
  }, []);

  return (
    <div className="api-test-container">
      <h2>🧪 New Backend API Test</h2>
      <p>Testing the new hybrid architecture (Firebase Auth + Backend API + PostgreSQL)</p>
      
      <div className="api-test-buttons">
        <button 
          onClick={testApiConnection} 
          disabled={loading}
          className="api-test-button"
        >
          {loading ? 'Testing...' : 'Test API Connection'}
        </button>
        
        <button 
          onClick={testBandCreation} 
          disabled={loading}
          className="api-test-button"
        >
          {loading ? 'Creating...' : 'Test Band Creation'}
        </button>
      </div>
      
      <div className={`api-test-result ${
        testResult.includes('✅') 
          ? 'api-test-success' 
          : testResult.includes('❌') 
          ? 'api-test-error' 
          : 'api-test-neutral'
      }`}>
        {testResult || 'Click a button to test the API'}
      </div>
      
      {error && (
        <div className="api-test-error">
          <strong>Error Details:</strong> {error}
        </div>
      )}
      
      <div className="api-test-bands">
        <h3>📋 Bands from API ({bands.length})</h3>
        {bands.length === 0 ? (
          <p>No bands found</p>
        ) : (
          <ul>
            {bands.map((band) => (
              <li key={band.id} className="api-test-band">
                <strong>{band.name}</strong>
                <span className="band-genres">({band.genres.join(', ')})</span>
                <span className="band-location">{band.hometown}, {band.county}</span>
                {band.is_verified && <span className="verified-badge">✅ Verified</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="api-test-info">
        <p><strong>Benefits of New Architecture:</strong></p>
        <ul>
          <li>✅ No more Firebase timeout errors</li>
          <li>✅ Fast PostgreSQL database queries</li>
          <li>✅ Server-side authentication and permissions</li>
          <li>✅ RESTful API with proper error handling</li>
          <li>✅ Scalable backend infrastructure</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiTestComponent;
