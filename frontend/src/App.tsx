import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// Define interfaces for type safety
interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  county: string;
  capacity?: number;
  venue_type?: string;
  primary_genres?: string[];
  facilities?: string[];
  description?: string;
  average_rating: number;
  review_count: number;
  claimed: boolean;
  verified: boolean;
}

interface VenuesResponse {
  venues: Venue[];
  total: number;
  current_page: number;
  pages: number;
}

interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

function App() {
  // State management
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [healthStatus, setHealthStatus] = useState<string>('');
  const [currentView, setCurrentView] = useState<'home' | 'venues' | 'login'>('home');

  // API base URL - defaults to production, can be overridden with REACT_APP_API_URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://band-review-website.onrender.com/api';

  /**
   * Check API health status
   */
  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: HealthResponse = await response.json();
      setHealthStatus(`✅ ${data.service} ${data.version}`);
    } catch (err) {
      console.error('Health check failed:', err);
      setHealthStatus('❌ API connection failed');
      setError('Failed to connect to backend API');
    }
  }, [API_BASE_URL]);

  /**
   * Fetch venues from the API
   */
  const fetchVenues = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/venues?per_page=6`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: VenuesResponse = await response.json();
      setVenues(data.venues);
    } catch (err) {
      console.error('Error fetching venues:', err);
      setError('Failed to fetch venues');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Fetch data when component mounts
  useEffect(() => {
    checkHealth();
    fetchVenues();
  }, [checkHealth, fetchVenues]);

  /**
   * Render star rating
   */
  const renderStars = (rating: number) => {
    if (rating === 0) return '⭐ No reviews yet';
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('⭐');
    }
    if (hasHalfStar) {
      stars.push('🌟');
    }
    return stars.join('') + ` (${rating})`;
  };

  /**
   * Render home page
   */
  const renderHome = () => (
    <div className="home-section">
      <div className="hero">
        <h1>🎵 BandVenueReview.ie</h1>
        <p className="hero-subtitle">
          Ireland's platform for bands to review live music venues
        </p>
        <p className="hero-description">
          Share your experiences, discover great venues, and help build a stronger Irish music scene.
          From grassroots pubs to major arenas - get the inside story from the bands who've played there.
        </p>
        <div className="cta-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => setCurrentView('venues')}
          >
            Browse Venues
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setCurrentView('login')}
          >
            Band Login
          </button>
        </div>
      </div>

      <div className="features">
        <div className="feature">
          <h3>🎸 For Bands</h3>
          <p>Share your venue experiences - rate sound quality, hospitality, payment, and more</p>
        </div>
        <div className="feature">
          <h3>🏛️ For Venues</h3>
          <p>Claim your profile, showcase your space, and connect with touring acts</p>
        </div>
        <div className="feature">
          <h3>🇮🇪 All Ireland</h3>
          <p>From Dublin to Cork, Belfast to Galway - covering venues across the island</p>
        </div>
      </div>
    </div>
  );

  /**
   * Render venues list
   */
  const renderVenues = () => (
    <div className="venues-section">
      <div className="section-header">
        <h2>Live Music Venues in Ireland</h2>
        <p>Discover where to play your next gig</p>
      </div>

      {loading ? (
        <div className="loading">Loading venues...</div>
      ) : venues.length > 0 ? (
        <div className="venues-grid">
          {venues.map((venue) => (
            <div key={venue.id} className="venue-card">
              <div className="venue-header">
                <h3>{venue.name}</h3>
                <div className="venue-badges">
                  {venue.verified && <span className="badge verified">✓ Verified</span>}
                  {venue.claimed && <span className="badge claimed">Claimed</span>}
                </div>
              </div>
              
              <div className="venue-location">
                📍 {venue.address}, {venue.city}, {venue.county}
              </div>
              
              {venue.capacity && (
                <div className="venue-capacity">
                  👥 Capacity: {venue.capacity}
                </div>
              )}
              
              {venue.venue_type && (
                <div className="venue-type">
                  🏛️ {venue.venue_type.replace('_', ' ')}
                </div>
              )}
              
              {venue.primary_genres && venue.primary_genres.length > 0 && (
                <div className="venue-genres">
                  🎵 {venue.primary_genres.join(', ')}
                </div>
              )}
              
              <div className="venue-rating">
                {renderStars(venue.average_rating)}
                {venue.review_count > 0 && (
                  <span className="review-count">({venue.review_count} reviews)</span>
                )}
              </div>
              
              {venue.description && (
                <p className="venue-description">{venue.description}</p>
              )}
              
              {venue.facilities && venue.facilities.length > 0 && (
                <div className="venue-facilities">
                  <strong>Facilities:</strong> {venue.facilities.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-venues">No venues found</div>
      )}
    </div>
  );

  /**
   * Render login section
   */
  const renderLogin = () => (
    <div className="login-section">
      <h2>Band Login</h2>
      <p>Sign in to review venues and manage your band profile</p>
      
      <div className="login-options">
        <div className="login-card">
          <h3>🎸 Band/Artist</h3>
          <p>Review venues where you've performed</p>
          <button className="btn btn-primary">Band Login</button>
        </div>
        
        <div className="login-card">
          <h3>🏛️ Venue Owner</h3>
          <p>Claim and manage your venue profile</p>
          <button className="btn btn-secondary">Venue Login</button>
        </div>
      </div>
      
      <div className="demo-note">
        <p><strong>Demo Mode:</strong> Login functionality coming soon!</p>
        <p>Currently showing sample data from Irish venues.</p>
      </div>
    </div>
  );

  return (
    <div className="App">
      <header className="App-header">
        <nav className="navigation">
          <div className="nav-brand" onClick={() => setCurrentView('home')}>
            🎵 BandVenueReview.ie
          </div>
          <div className="nav-links">
            <button 
              className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentView('home')}
            >
              Home
            </button>
            <button 
              className={`nav-link ${currentView === 'venues' ? 'active' : ''}`}
              onClick={() => setCurrentView('venues')}
            >
              Venues
            </button>
            <button 
              className={`nav-link ${currentView === 'login' ? 'active' : ''}`}
              onClick={() => setCurrentView('login')}
            >
              Login
            </button>
          </div>
        </nav>

        {/* API Status */}
        <div className="api-status">
          {healthStatus || 'Checking API status...'}
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* Main Content */}
        <main className="main-content">
          {currentView === 'home' && renderHome()}
          {currentView === 'venues' && renderVenues()}
          {currentView === 'login' && renderLogin()}
        </main>

        {/* Footer */}
        <footer className="footer">
          <p>Supporting the Irish live music scene 🇮🇪</p>
          <p>API Status: {healthStatus}</p>
        </footer>
      </header>
    </div>
  );
}

export default App;
