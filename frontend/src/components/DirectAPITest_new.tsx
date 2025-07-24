import React, { useState } from 'react';
import './DirectAPITest.css';

interface TestResult {
  name: string;
  status: 'loading' | 'success' | 'error';
  message: string;
  details?: any;
  duration?: number;
}

const DirectAPITest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateResult = (name: string, status: TestResult['status'], message: string, details?: any, duration?: number) => {
    setResults(prev => {
      const existing = prev.find(r => r.name === name);
      const newResult = { name, status, message, details, duration };
      
      if (existing) {
        return prev.map(r => r.name === name ? newResult : r);
      } else {
        return [...prev, newResult];
      }
    });
  };

  const testWithTimeout = async (testFn: () => Promise<any>, timeoutMs: number = 10000) => {
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        testFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
        )
      ]);
      return { result, duration: Date.now() - startTime };
    } catch (error) {
      return { error, duration: Date.now() - startTime };
    }
  };

  const testBackendEndpoint = async (name: string, url: string) => {
    updateResult(name, 'loading', 'Testing...');
    
    const { result, error, duration } = await testWithTimeout(async () => {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text.substring(0, 200) + (text.length > 200 ? '...' : '');
      }
      
      return { status: response.status, data, headers: Object.fromEntries(response.headers.entries()) };
    });
    
    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateResult(name, 'error', `❌ ${errorMessage}`, { error: errorMessage }, duration);
    } else if (result) {
      const isSuccess = result.status >= 200 && result.status < 300;
      updateResult(
        name, 
        isSuccess ? 'success' : 'error',
        isSuccess 
          ? `✅ Status ${result.status} (${duration}ms)` 
          : `❌ Status ${result.status} (${duration}ms)`,
        { 
          status: result.status,
          data: result.data,
          headers: result.headers,
          duration 
        },
        duration
      );
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    // Test various backend endpoints
    const endpoints = [
      { name: 'Backend Root', url: 'https://band-review-website.onrender.com/' },
      { name: 'Health Check', url: 'https://band-review-website.onrender.com/health' },
      { name: 'API Info', url: 'https://band-review-website.onrender.com/api/info' },
      { name: 'Bands API', url: 'https://band-review-website.onrender.com/api/bands' },
      { name: 'Venues API', url: 'https://band-review-website.onrender.com/api/venues' },
    ];
    
    // Run backend tests
    for (const endpoint of endpoints) {
      await testBackendEndpoint(endpoint.name, endpoint.url);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
    }
    
    setIsRunning(false);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'loading': return '#fbbf24';
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="direct-api-test-container">
      <h2>🔧 Backend API Connection Tests</h2>
      <p>Testing backend connectivity and API endpoints to diagnose the hanging issue</p>
      
      <div className="direct-api-test-buttons">
        <button 
          onClick={runAllTests} 
          disabled={isRunning} 
          className="direct-api-test-button"
        >
          {isRunning ? '🔄 Running Tests...' : '🚀 Run All Tests'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="test-results-grid">
          {results.map((result) => (
            <div key={result.name} className="test-result-card">
              <div className="test-result-header">
                <span 
                  className={`status-indicator status-${result.status}`}
                />
                <strong>{result.name}</strong>
                {result.duration && <span className="duration-badge">{result.duration}ms</span>}
              </div>
              
              <div className={`test-result-message ${result.status}`}>
                {result.message}
              </div>
              
              {result.details && (
                <details className="test-result-details">
                  <summary>View Details</summary>
                  <pre>{JSON.stringify(result.details, null, 2)}</pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="direct-api-test-footer">
        <p><strong>Current Issue:</strong> Backend appears to be running but routes are not registered (404 errors)</p>
        <p><strong>Backend URL:</strong> https://band-review-website.onrender.com</p>
        <p><strong>Frontend URL:</strong> https://bandvenuereview.netlify.app</p>
        <p>Check the Network tab in DevTools for detailed error information</p>
      </div>
    </div>
  );
};

export default DirectAPITest;
