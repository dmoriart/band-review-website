import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

// Define interfaces for type safety
interface ApiResponse {
  message: string;
  status: string;
  version?: string;
}

interface Band {
  id: number;
  name: string;
  genre: string;
  rating: number;
}

interface BandsResponse {
  bands: Band[];
  count: number;
  status: string;
}

function App() {
  // State management for API data
  const [apiMessage, setApiMessage] = useState<string>('');
  const [bands, setBands] = useState<Band[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // API base URL - in production, this would come from environment variables
  const API_BASE_URL = 'http://localhost:5000/api';

  /**
   * Fetch hello message from Flask backend
   * Demonstrates basic API connectivity
   */
  const fetchHelloMessage = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/hello`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      setApiMessage(data.message);
    } catch (err) {
      console.error('Error fetching hello message:', err);
      setError('Failed to connect to backend API');
    }
  };

  /**
   * Fetch bands data from Flask backend
   * Demonstrates fetching and displaying data from API
   */
  const fetchBands = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bands`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: BandsResponse = await response.json();
      setBands(data.bands);
    } catch (err) {
      console.error('Error fetching bands:', err);
      setError('Failed to fetch bands data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchHelloMessage();
    fetchBands();
  }, []);

  /**
   * Render star rating based on numeric rating
   */
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('⭐');
    }
    if (hasHalfStar) {
      stars.push('🌟');
    }
    return stars.join(' ') + ` (${rating})`;
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>🎸 Yelp for Bands</h1>
        
        {/* Display API connection status */}
        <div className="api-status">
          {error ? (
            <p className="error-message">❌ {error}</p>
          ) : (
            <p className="success-message">✅ {apiMessage}</p>
          )}
        </div>

        {/* Display bands data */}
        <div className="bands-section">
          <h2>Featured Bands</h2>
          {loading ? (
            <p>Loading bands...</p>
          ) : bands.length > 0 ? (
            <div className="bands-list">
              {bands.map((band) => (
                <div key={band.id} className="band-card">
                  <h3>{band.name}</h3>
                  <p><strong>Genre:</strong> {band.genre}</p>
                  <p><strong>Rating:</strong> {renderStars(band.rating)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No bands found</p>
          )}
        </div>

        {/* Instructions for development */}
        <div className="dev-info">
          <p>
            Backend running at: <code>http://localhost:5000</code>
          </p>
          <p>
            Frontend running at: <code>http://localhost:3000</code>
          </p>
        </div>
      </header>
    </div>
  );
}

export default App;
