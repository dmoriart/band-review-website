import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import AdminPanel from './AdminPanel';
import BandsPage from './BandsPage';
import { AuthProvider, useAuth } from './AuthContext';
import AuthComponent from './AuthComponent';
import SanityVenuesGrid from './components/SanityVenuesGrid';
import SanityTestPage from './components/SanityTestPage';
import ApiTestComponent from './components/ApiTestComponent';
import CookieNotice from './components/CookieNotice';
import FeatureIdeasPage from './components/FeatureIdeasPage';
import { useBands, useVenues } from './hooks/useSanity';

// Define interfaces for type safety
interface TechSpecs {
  pa_system?: string;
  mics_available?: number;
  lighting_rig?: string;
  stage_size?: string;
  backline?: string[];
  power_outlets?: number;
  monitor_system?: string;
  accessibility?: string[];
}

interface ContactInfo {
  booking_email?: string;
  booking_phone?: string;
  manager_name?: string;
  preferred_contact?: string;
}

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  county: string;
  eircode?: string;
  phone?: string;
  email?: string;
  website?: string;
  capacity?: number;
  venue_type?: string;
  primary_genres?: string[];
  facilities?: string[];
  description?: string;
  images?: string[];
  tech_specs?: TechSpecs;
  contact_info?: ContactInfo;
  latitude?: number;
  longitude?: number;
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
  venues?: number;
  database?: string;
}

// eslint-disable-next-line react-hooks/rules-of-hooks
function AppContent() {
  const { user, loading: authLoading } = useAuth();
  
  // Sanity CMS data hooks
  const { data: bandsFromCMS } = useBands();
  const { data: venuesFromCMS } = useVenues();
  
  // State management - ALL hooks must be declared before any conditional returns
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [healthStatus, setHealthStatus] = useState<string>('');
  const [currentView, setCurrentView] = useState<'home' | 'venues' | 'venue-detail' | 'bands' | 'features' | 'admin' | 'sanity-test' | 'api-test'>('home');
  const [adminToken, setAdminToken] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedCapacity, setSelectedCapacity] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<string>('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isMobileMenuOpen]);

  // Admin login state - moved here to ensure all hooks are at the top
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // API base URL - force correct URL to override wrong environment variable
  const API_BASE_URL = 'https://band-review-website.onrender.com/api';

  /**
   * Check API health status
   */
  const checkHealth = useCallback(async () => {
    try {
      console.log('🔍 Checking API health at:', `${API_BASE_URL}/health`);
      const response = await fetch(`${API_BASE_URL}/health`);
      console.log('📡 API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: HealthResponse = await response.json();
      console.log('✅ API response data:', data);
      setHealthStatus(`✅ ${data.service} ${data.version} (${data.venues} venues)`);
    } catch (err) {
      console.error('❌ Health check failed:', err);
      console.log('🔍 API URL being used:', API_BASE_URL);
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

  // Filter venues based on search and filter criteria
  useEffect(() => {
    let filtered = venues;

    // Search by name or city
    if (searchQuery) {
      filtered = filtered.filter(venue => 
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by city
    if (selectedCity) {
      filtered = filtered.filter(venue => venue.city === selectedCity);
    }

    // Filter by capacity
    if (selectedCapacity) {
      const [min, max] = selectedCapacity.split('-').map(Number);
      if (max) {
        filtered = filtered.filter(venue => venue.capacity && venue.capacity >= min && venue.capacity <= max);
      } else {
        filtered = filtered.filter(venue => venue.capacity && venue.capacity >= min);
      }
    }

    // Filter by rating
    if (selectedRating) {
      const minRating = parseFloat(selectedRating);
      filtered = filtered.filter(venue => venue.average_rating >= minRating);
    }

    // Filter by features
    if (selectedFeatures.length > 0) {
      filtered = filtered.filter(venue => 
        selectedFeatures.every(feature => 
          venue.facilities?.some((venueFeature: string) => 
            venueFeature.toLowerCase().includes(feature.toLowerCase())
          ) || venue.tech_specs?.backline?.some((venueFeature: string) => 
            venueFeature.toLowerCase().includes(feature.toLowerCase())
          )
        )
      );
    }

    setFilteredVenues(filtered);
  }, [venues, searchQuery, selectedCity, selectedCapacity, selectedRating, selectedFeatures]);

  // Show loading screen while Firebase auth initializes - moved after all hooks
  if (authLoading) {
    return (
      <div className="app">
        <div className="loading-auth">
          <div className="loading-spinner"></div>
          <p>Initializing authentication...</p>
        </div>
      </div>
    );
  }

  /**
   * Get unique cities for filter dropdown
   */
  const getUniqueCities = () => {
    const cities = venues.map(venue => venue.city);
    return Array.from(new Set(cities)).sort();
  };

  /**
   * Toggle feature filter
   */
  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

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
            onClick={() => setCurrentView('bands')}
          >
            Discover Bands
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowAuthModal(true)}
          >
            {user ? `Welcome, ${user.displayName || user.email}` : 'Sign In'}
          </button>
        </div>
      </div>

      <div className="features">
        <div className="feature">
          <h3>🎸 For Bands</h3>
          <p>Share your venue experiences - rate sound quality, hospitality, payment, and more. Create your profile and connect with venues and fans.</p>
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

      <div className="quick-stats">
        <div className="stat">
          <div className="stat-number">{(venuesFromCMS as any[])?.length || 0}</div>
          <div className="stat-label">Venues Listed</div>
        </div>
        <div className="stat">
          <div className="stat-number">{bandsFromCMS?.length || 0}</div>
          <div className="stat-label">Bands Featured</div>
        </div>
        <div className="stat">
          <div className="stat-number">32</div>
          <div className="stat-label">Counties Covered</div>
        </div>
      </div>
    </div>
  );

  /**
   * Render venues list with search and filters
   */
  const renderVenues = () => (
    <div className="venues-section">
      <div className="section-header">
        <h2>Live Music Venues in Ireland</h2>
        <p>Discover where to play your next gig</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="search-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search venues by name, city, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters">
          <select 
            value={selectedCity} 
            onChange={(e) => setSelectedCity(e.target.value)}
            className="filter-select"
            aria-label="Filter by city"
          >
            <option value="">All Cities</option>
            {getUniqueCities().map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select 
            value={selectedCapacity} 
            onChange={(e) => setSelectedCapacity(e.target.value)}
            className="filter-select"
            aria-label="Filter by capacity"
          >
            <option value="">All Capacities</option>
            <option value="small">Small (≤200)</option>
            <option value="medium">Medium (201-1000)</option>
            <option value="large">Large (1000+)</option>
          </select>

          <select 
            value={selectedRating} 
            onChange={(e) => setSelectedRating(e.target.value)}
            className="filter-select"
            aria-label="Filter by rating"
          >
            <option value="">All Ratings</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
          </select>
        </div>

        <div className="feature-filters">
          <h4>Features:</h4>
          <div className="feature-tags">
            {['sound_system', 'lighting', 'parking', 'green_room', 'drum_kit', 'ramp_access'].map(feature => (
              <button
                key={feature}
                className={`feature-tag ${selectedFeatures.includes(feature) ? 'active' : ''}`}
                onClick={() => toggleFeature(feature)}
              >
                {feature.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {(searchQuery || selectedCity || selectedCapacity || selectedRating || selectedFeatures.length > 0) && (
          <button 
            className="clear-filters"
            onClick={() => {
              setSearchQuery('');
              setSelectedCity('');
              setSelectedCapacity('');
              setSelectedRating('');
              setSelectedFeatures([]);
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Sanity CMS Venues */}
      <SanityVenuesGrid 
        onVenueClick={(venue) => {
          setSelectedVenue(venue);
          setCurrentView('venue-detail');
        }}
      />

      {loading ? (
        <div className="loading">Loading venues...</div>
      ) : filteredVenues.length > 0 ? (
        <div className="venues-grid">
          {filteredVenues.map((venue) => (
            <div key={venue.id} className="venue-card" onClick={() => {
              setSelectedVenue(venue);
              setCurrentView('venue-detail');
            }}>
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
        <div className="no-venues">
          {searchQuery || selectedCity || selectedCapacity || selectedRating || selectedFeatures.length > 0 
            ? `No venues found matching your criteria`
            : `No venues found`
          }
        </div>
      )}
    </div>
  );

  /**
   * Render venue detail page
   */
  const renderVenueDetail = () => {
    if (!selectedVenue) return <div>Venue not found</div>;

    return (
      <div className="venue-detail">
        <button 
          className="back-button"
          onClick={() => setCurrentView('venues')}
        >
          ← Back to Venues
        </button>

        <div className="venue-detail-header">
          <div className="venue-title-section">
            <h1>{selectedVenue.name}</h1>
            <div className="venue-badges">
              {selectedVenue.verified && <span className="badge verified">✓ Verified</span>}
              {selectedVenue.claimed && <span className="badge claimed">Claimed by Owner</span>}
            </div>
          </div>
          
          <div className="venue-rating-large">
            {renderStars(selectedVenue.average_rating)}
            {selectedVenue.review_count > 0 && (
              <span className="review-count">({selectedVenue.review_count} reviews)</span>
            )}
          </div>
        </div>

        <div className="venue-detail-content">
          <div className="venue-main-info">
            {/* Basic Info Section */}
            <div className="info-section">
              <h3>📍 Location & Contact</h3>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Address:</strong>
                  <p>{selectedVenue.address}, {selectedVenue.city}, {selectedVenue.county}</p>
                  {selectedVenue.eircode && <p>Eircode: {selectedVenue.eircode}</p>}
                </div>
                
                {/* Google Maps Integration */}
                <div className="map-container">
                  {process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? (
                    <iframe
                      title={`Map of ${selectedVenue.name}`}
                      width="100%"
                      height="200"
                      frameBorder="0"
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(selectedVenue.address + ', ' + selectedVenue.city + ', Ireland')}`}
                      allowFullScreen
                    />
                  ) : (
                    <div className="map-placeholder">
                      <p>🗺️ Map view requires Google Maps API key configuration</p>
                    </div>
                  )}
                  <p className="map-note">📍 <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedVenue.address + ', ' + selectedVenue.city + ', Ireland')}`} target="_blank" rel="noopener noreferrer">View on Google Maps</a></p>
                </div>
              </div>
            </div>

            {/* Venue Specs */}
            <div className="info-section">
              <h3>🏛️ Venue Specifications</h3>
              <div className="specs-grid">
                {selectedVenue.capacity && (
                  <div className="spec-item">
                    <strong>👥 Capacity:</strong> {selectedVenue.capacity}
                  </div>
                )}
                {selectedVenue.venue_type && (
                  <div className="spec-item">
                    <strong>🏛️ Type:</strong> {selectedVenue.venue_type.replace('_', ' ')}
                  </div>
                )}
                {selectedVenue.tech_specs?.stage_size && (
                  <div className="spec-item">
                    <strong>🎭 Stage Size:</strong> {selectedVenue.tech_specs.stage_size}
                  </div>
                )}
                {selectedVenue.primary_genres && selectedVenue.primary_genres.length > 0 && (
                  <div className="spec-item">
                    <strong>🎵 Primary Genres:</strong> {selectedVenue.primary_genres.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info - Requires Login */}
            <div className="info-section">
              <h3>📞 Booking Information</h3>
              {user ? (
                <div className="contact-info">
                  {selectedVenue.contact_info?.booking_email && (
                    <div className="contact-item">
                      <strong>📧 Booking Email:</strong> 
                      <a href={`mailto:${selectedVenue.contact_info.booking_email}`}>
                        {selectedVenue.contact_info.booking_email}
                      </a>
                    </div>
                  )}
                  {selectedVenue.contact_info?.booking_phone && (
                    <div className="contact-item">
                      <strong>📱 Booking Phone:</strong> 
                      <a href={`tel:${selectedVenue.contact_info.booking_phone}`}>
                        {selectedVenue.contact_info.booking_phone}
                      </a>
                    </div>
                  )}
                  {selectedVenue.contact_info?.manager_name && (
                    <div className="contact-item">
                      <strong>👤 Manager:</strong> {selectedVenue.contact_info.manager_name}
                    </div>
                  )}
                  {selectedVenue.website && (
                    <div className="contact-item">
                      <strong>🌐 Website:</strong> 
                      <a href={selectedVenue.website} target="_blank" rel="noopener noreferrer">
                        {selectedVenue.website}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="login-required">
                  <p>🔒 Sign in to view booking contact information</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowAuthModal(true)}
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>

            {/* Photo Gallery */}
            <div className="info-section">
              <h3>📸 Photo Gallery</h3>
              {selectedVenue.images && selectedVenue.images.length > 0 ? (
                <div className="photo-gallery">
                  {selectedVenue.images.map((image, index) => (
                    <div key={index} className="photo-item">
                      <img src={image} alt={`${selectedVenue.name} - View ${index + 1}`} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-photos">
                  <p>No photos available yet.</p>
                  <p>Be the first to share photos of this venue!</p>
                </div>
              )}
            </div>

            {/* Tech Specs */}
            <div className="info-section">
              <h3>🎛️ Technical Specifications</h3>
              {selectedVenue.tech_specs ? (
                <div className="tech-specs">
                  {selectedVenue.tech_specs.pa_system && (
                    <div className="tech-item">
                      <strong>🔊 PA System:</strong> {selectedVenue.tech_specs.pa_system}
                    </div>
                  )}
                  {selectedVenue.tech_specs.mics_available && (
                    <div className="tech-item">
                      <strong>🎤 Microphones:</strong> {selectedVenue.tech_specs.mics_available} available
                    </div>
                  )}
                  {selectedVenue.tech_specs.lighting_rig && (
                    <div className="tech-item">
                      <strong>💡 Lighting:</strong> {selectedVenue.tech_specs.lighting_rig}
                    </div>
                  )}
                  {selectedVenue.tech_specs.monitor_system && (
                    <div className="tech-item">
                      <strong>📢 Monitors:</strong> {selectedVenue.tech_specs.monitor_system}
                    </div>
                  )}
                  {selectedVenue.tech_specs.backline && selectedVenue.tech_specs.backline.length > 0 && (
                    <div className="tech-item">
                      <strong>🥁 Backline:</strong> {selectedVenue.tech_specs.backline.join(', ')}
                    </div>
                  )}
                  {selectedVenue.tech_specs.power_outlets && (
                    <div className="tech-item">
                      <strong>🔌 Power Outlets:</strong> {selectedVenue.tech_specs.power_outlets} available
                    </div>
                  )}
                  {selectedVenue.tech_specs.accessibility && selectedVenue.tech_specs.accessibility.length > 0 && (
                    <div className="tech-item">
                      <strong>♿ Accessibility:</strong> {selectedVenue.tech_specs.accessibility.join(', ')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-tech-specs">
                  <p>Technical specifications not yet available.</p>
                  {selectedVenue.claimed ? (
                    <p>Contact the venue owner to request this information.</p>
                  ) : (
                    <p>Is this your venue? Claim it to add technical details!</p>
                  )}
                </div>
              )}
            </div>

            {/* Facilities */}
            {selectedVenue.facilities && selectedVenue.facilities.length > 0 && (
              <div className="info-section">
                <h3>🏢 Facilities & Amenities</h3>
                <div className="facilities-list">
                  {selectedVenue.facilities.map(facility => (
                    <span key={facility} className="facility-tag">
                      {facility.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {selectedVenue.description && (
              <div className="info-section">
                <h3>📝 About This Venue</h3>
                <p className="venue-description-full">{selectedVenue.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Handle admin login
   */
  const handleAdminLogin = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid admin credentials');
      }

      const data = await response.json();
      
      // Check if user is admin (email starts with admin@)
      if (data.user && data.user.email.startsWith('admin@')) {
        setAdminToken(data.access_token);
        setIsAdmin(true);
        setCurrentView('admin');
        setError('');
      } else {
        throw new Error('Admin access required');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin login failed');
    }
  };

  /**
   * Render admin login
   */
  const renderAdminLogin = () => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleAdminLogin(adminEmail, adminPassword);
    };

    return (
      <div className="login-section">
        <h2>🛠️ Admin Access</h2>
        <p>Administrative access to manage venues and moderate content</p>
        
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="admin-email">Admin Email:</label>
            <input
              id="admin-email"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@bandvenuereview.ie"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="admin-password">Password:</label>
            <input
              id="admin-password"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter admin password"
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary">
            🔓 Admin Login
          </button>
        </form>
        
        <div className="demo-note">
          <p><strong>Demo Admin Access:</strong></p>
          <p>Email: admin@bandvenuereview.ie</p>
          <p>Password: [Contact administrator]</p>
        </div>
        
        <button 
          onClick={() => setCurrentView('home')} 
          className="btn btn-secondary back-to-home"
        >
          ← Back to Home
        </button>
      </div>
    );
  };

  if (isAdmin && adminToken) {
    return (
      <AdminPanel
        apiBaseUrl={API_BASE_URL}
        adminToken={adminToken}
        onLogout={() => {
          setIsAdmin(false);
          setAdminToken('');
          setCurrentView('home');
        }}
      />
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <nav className="navigation">
          <div className="nav-brand" onClick={() => setCurrentView('home')}>
            🎵 BandVenueReview.ie
          </div>
          
          {/* Desktop Navigation */}
          <div className="nav-links desktop-nav">
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
              className={`nav-link ${currentView === 'bands' ? 'active' : ''}`}
              onClick={() => setCurrentView('bands')}
            >
              Bands
            </button>
            <button 
              className={`nav-link ${currentView === 'features' ? 'active' : ''}`}
              onClick={() => setCurrentView('features')}
            >
              💡 Features
            </button>
            <button 
              className="nav-link"
              onClick={() => setShowAuthModal(true)}
            >
              {user ? '👤 Account' : '🔑 Sign In'}
            </button>
            {!isAdmin && (
              <button 
                className="nav-link admin-link"
                onClick={() => setCurrentView('admin')}
              >
                🛠️ Admin
              </button>
            )}
            {isAdmin && (
              <button 
                className="nav-link admin-active"
                onClick={() => {
                  setIsAdmin(false);
                  setAdminToken('');
                  setCurrentView('home');
                }}
              >
                Logout Admin
              </button>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          
          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <>
              {/* Mobile Menu Overlay */}
              <div 
                className="mobile-nav-overlay"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              
              {/* Mobile Navigation Panel */}
              <div className="mobile-nav">
                <div className="mobile-nav-header">
                  <h3>BandVenueReview.ie</h3>
                  <button 
                    className="mobile-nav-close"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="mobile-nav-links">
                  <button 
                    className={`mobile-nav-link ${currentView === 'home' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentView('home');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="nav-icon">🏠</span>
                    <span>Home</span>
                  </button>
                  
                  <button 
                    className={`mobile-nav-link ${currentView === 'venues' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentView('venues');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="nav-icon">🏛️</span>
                    <span>Venues</span>
                  </button>
                  
                  <button 
                    className={`mobile-nav-link ${currentView === 'bands' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentView('bands');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="nav-icon">🎵</span>
                    <span>Bands</span>
                  </button>
                  
                  <button 
                    className={`mobile-nav-link ${currentView === 'features' ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentView('features');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="nav-icon">💡</span>
                    <span>Feature Ideas</span>
                  </button>
                  
                  <div className="mobile-nav-divider"></div>
                  
                  <button 
                    className="mobile-nav-link account-link"
                    onClick={() => {
                      setShowAuthModal(true);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span className="nav-icon">{user ? '👤' : '🔑'}</span>
                    <span>{user ? 'My Account' : 'Sign In'}</span>
                  </button>
                  
                  {!isAdmin && (
                    <button 
                      className="mobile-nav-link admin-link"
                      onClick={() => {
                        setCurrentView('admin');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <span className="nav-icon">🛠️</span>
                      <span>Admin Panel</span>
                    </button>
                  )}
                  
                  {isAdmin && (
                    <button 
                      className="mobile-nav-link admin-active"
                      onClick={() => {
                        setIsAdmin(false);
                        setAdminToken('');
                        setCurrentView('home');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <span className="nav-icon">👑</span>
                      <span>Exit Admin</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
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
          {currentView === 'bands' && <BandsPage />}
          {currentView === 'features' && <FeatureIdeasPage />}
          {currentView === 'venue-detail' && renderVenueDetail()}
          {currentView === 'admin' && renderAdminLogin()}
          {isAdmin && <AdminPanel 
            adminToken={adminToken} 
            apiBaseUrl={API_BASE_URL}
            onLogout={() => {
              setIsAdmin(false);
              setAdminToken('');
              setCurrentView('home');
            }}
          />}
        </main>

        {/* Authentication Modal */}
        {showAuthModal && (
          <AuthComponent onClose={() => setShowAuthModal(false)} />
        )}

        {/* Footer */}
        <footer className="footer">
          <p>Supporting the Irish live music scene 🇮🇪</p>
          <p>API Status: {healthStatus}</p>
        </footer>

        {/* Cookie Notice */}
        <CookieNotice />
      </header>
    </div>
  );
}

// Main App component with Firebase Auth Provider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;