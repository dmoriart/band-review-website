import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import AdminPanel from './AdminPanel';
import BandsPage from './BandsPage';
import GigsPage from './GigsPage';
import { AuthProvider, useAuth } from './AuthContext';
import AuthComponent from './AuthComponent';
import SanityVenuesGrid from './components/SanityVenuesGrid';
import SanitySoundStudiosGrid from './components/SanitySoundStudiosGrid';
import SanityTestPage from './components/SanityTestPage';
import ApiTestComponent from './components/ApiTestComponent';
import CookieNotice from './components/CookieNotice';
import FeatureIdeasPage from './components/FeatureIdeasPage';
import BuyMeACoffeeCard from './components/BuyMeACoffeeCard';
import StudioPhotoUpload from './components/StudioPhotoUpload';
import { useBands, useVenues } from './hooks/useSanity';
import { getAllLocationsForDropdown, getMajorCitiesForDropdown, getAllCountyNames } from './utils/irishLocations';
import CommunityForum from './pages/CommunityForum';
import StorePage from './components/StorePage';

// Define types for type safety
type CurrentView = 'home' | 'venues' | 'venue-detail' | 'studios' | 'studio-detail' | 'bands' | 'gigs' | 'features' | 'admin' | 'sanity-test' | 'api-test' | 'forum' | 'store' | 'product-detail' | 'cart' | 'checkout';

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
  const [selectedStudio, setSelectedStudio] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [healthStatus, setHealthStatus] = useState<string>('');
  const [currentView, setCurrentView] = useState<CurrentView>('home');
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

  // Store state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cartItemCount, setCartItemCount] = useState(0);

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
   * Get unique cities for filter dropdown from actual data
   */
  const getUniqueCities = () => {
    // Handle both old structure (venue.city) and new structure (venue.address.city)
    const cities = venues.map(venue => {
      if (typeof venue.address === 'object' && venue.address && 'city' in venue.address) {
        return (venue.address as any).city;
      }
      return venue.city; // fallback to old structure
    }).filter(Boolean);
    return Array.from(new Set(cities)).sort();
  };

  /**
   * Get comprehensive Irish locations for filtering
   */
  const getIrishLocationsForFilter = () => {
    return getAllLocationsForDropdown();
  };

  /**
   * Get major Irish cities for quick filtering
   */
  const getMajorIrishCities = () => {
    return getMajorCitiesForDropdown();
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
            onClick={() => setCurrentView('studios')}
          >
            Find Studios
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setCurrentView('bands')}
          >
            Discover Bands
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setCurrentView('forum')}
          >
            Community Forum
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
          <h3>�️ For Studios</h3>
          <p>Recording studios across Ireland - find the perfect space to capture your sound</p>
        </div>
        <div className="feature">
          <h3>�🇮🇪 All Ireland</h3>
          <p>Complete coverage of all 32 counties - from Donegal to Cork, Antrim to Kerry</p>
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

      {/* Buy Me a Coffee Card - visually prominent but not intrusive */}
      <BuyMeACoffeeCard />
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
            aria-label="Filter by location"
          >
            <option value="">All Locations</option>
            <optgroup label="Counties">
              {getAllCountyNames().map(county => (
                <option key={county} value={county}>{county} (County)</option>
              ))}
            </optgroup>
            <optgroup label="Major Cities">
              {getMajorIrishCities().map(city => (
                <option key={city.value} value={city.value}>{city.label}</option>
              ))}
            </optgroup>
            <optgroup label="Other Cities (From Data)">
              {getUniqueCities().filter(city => 
                !getMajorIrishCities().some(majorCity => majorCity.value === city)
              ).map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </optgroup>
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
        selectedCity={selectedCity}
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

    // Debug log the venue structure
    console.log('🔍 Selected venue structure:', selectedVenue);
    console.log('🔍 Venue address type:', typeof selectedVenue.address, selectedVenue.address);
    console.log('🔍 Venue images type:', typeof selectedVenue.images, selectedVenue.images);

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
            {renderStars(selectedVenue.average_rating || 0)}
            {(selectedVenue.review_count || 0) > 0 && (
              <span className="review-count">({selectedVenue.review_count || 0} reviews)</span>
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
                  <p>
                    {selectedVenue.address && typeof selectedVenue.address === 'object' 
                      ? `${(selectedVenue.address as any).street || ''}, ${(selectedVenue.address as any).city || ''}, ${(selectedVenue.address as any).county || ''}`.replace(/^, |, $/, '').replace(/, ,/g, ',')
                      : `${selectedVenue.address || ''}, ${selectedVenue.city || ''}, ${selectedVenue.county || ''}`.replace(/^, |, $/, '').replace(/, ,/g, ',')
                    }
                  </p>
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
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(
                        selectedVenue.address && typeof selectedVenue.address === 'object' 
                          ? `${(selectedVenue.address as any).street || ''}, ${(selectedVenue.address as any).city || ''}, Ireland` 
                          : `${selectedVenue.address || ''}, ${selectedVenue.city || ''}, Ireland`
                      )}`}
                      allowFullScreen
                    />
                  ) : (
                    <div className="map-placeholder">
                      <p>🗺️ Map view requires Google Maps API key configuration</p>
                    </div>
                  )}
                  <p className="map-note">📍 <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    selectedVenue.address && typeof selectedVenue.address === 'object' 
                      ? `${(selectedVenue.address as any).street || ''}, ${(selectedVenue.address as any).city || ''}, Ireland` 
                      : `${selectedVenue.address || ''}, ${selectedVenue.city || ''}, Ireland`
                  )}`} target="_blank" rel="noopener noreferrer">View on Google Maps</a></p>
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
                {(selectedVenue.venue_type || (selectedVenue as any).venueType) && (
                  <div className="spec-item">
                    <strong>🏛️ Type:</strong> {(selectedVenue.venue_type || (selectedVenue as any).venueType).replace('_', ' ')}
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
                  {(selectedVenue.website || (selectedVenue as any).contact?.website) && (
                    <div className="contact-item">
                      <strong>🌐 Website:</strong> 
                      <a href={selectedVenue.website || (selectedVenue as any).contact?.website} target="_blank" rel="noopener noreferrer">
                        {selectedVenue.website || (selectedVenue as any).contact?.website}
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
                      <img 
                        src={typeof image === 'string' ? image : ((image as any)?.url || (image as any)?.asset?.url || '')} 
                        alt={`${selectedVenue.name} - View ${index + 1}`} 
                      />
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
                  {selectedVenue.facilities.map((facility, index) => (
                    <span key={facility || index} className="facility-tag">
                      {typeof facility === 'string' ? facility.replace('_', ' ') : ((facility as any)?.name || (facility as any)?.title || 'Unknown facility')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {selectedVenue.description && (
              <div className="info-section">
                <h3>📝 About This Venue</h3>
                <p className="venue-description-full">
                  {typeof selectedVenue.description === 'string' 
                    ? selectedVenue.description 
                    : (selectedVenue.description as any)?.text || (selectedVenue.description as any)?.content || 'No description available'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render sound studios page
   */
  const renderStudios = () => (
    <div className="studios-section">
      <div className="section-header">
        <h2>🎙️ Sound Studios</h2>
        <p>Discover professional recording studios across Ireland</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="search-controls">
        <div className="search-group">
          <input
            type="text"
            placeholder="Search studios by name, location, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            title="Filter by location"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="filter-select"
          >
            <option value="">All Locations</option>
            <optgroup label="Counties">
              {getAllCountyNames().map(county => (
                <option key={county} value={county}>{county} (County)</option>
              ))}
            </optgroup>
            <optgroup label="Major Cities">
              {getMajorIrishCities().map(city => (
                <option key={city.value} value={city.value}>{city.label}</option>
              ))}
            </optgroup>
          </select>

          <select
            title="Filter by price range"
            value={selectedCapacity}
            onChange={(e) => setSelectedCapacity(e.target.value)}
            className="filter-select"
          >
            <option value="">Price Range</option>
            <option value="0-50">€0-50/hour</option>
            <option value="51-100">€51-100/hour</option>
            <option value="101-200">€101-200/hour</option>
            <option value="201-500">€201-500/hour</option>
            <option value="501">€500+/hour</option>
          </select>
        </div>
      </div>

      {/* Sanity CMS Studios */}
      <SanitySoundStudiosGrid 
        searchQuery={searchQuery}
        selectedCity={selectedCity}
        selectedPriceRange={selectedCapacity}
        onStudioClick={(studio) => {
          setSelectedStudio(studio);
          setCurrentView('studio-detail');
        }}
      />
    </div>
  );

  /**
   * Render studio detail page
   */
  const renderStudioDetail = () => {
    if (!selectedStudio) return <div>Studio not found</div>;

    // Debug log the studio structure
    console.log('🔍 Selected studio structure:', selectedStudio);

    return (
      <div className="studio-detail">
        <button 
          className="back-button"
          onClick={() => setCurrentView('studios')}
        >
          ← Back to Studios
        </button>

        <div className="studio-detail-header">
          <div className="studio-title-section">
            <h1>{selectedStudio.name}</h1>
            <div className="studio-badges">
              {selectedStudio.verified && <span className="badge verified">✓ Verified</span>}
              {selectedStudio.claimed && <span className="badge claimed">Claimed by Owner</span>}
              {selectedStudio.bandFriendly && <span className="badge band-friendly">🎸 Band Friendly</span>}
            </div>
          </div>
          
          <div className="studio-type-info">
            {selectedStudio.studioType && (
              <span className="studio-type-badge">
                🏛️ {selectedStudio.studioType.replace('_', ' ').toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div className="studio-detail-content">
          <div className="studio-main-info">
            {/* Basic Info Section */}
            <div className="info-section">
              <h3>📍 Location & Contact</h3>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Address:</strong>
                  <p>
                    {selectedStudio.address && typeof selectedStudio.address === 'object' 
                      ? `${(selectedStudio.address as any).street || ''}, ${(selectedStudio.address as any).city || ''}, ${(selectedStudio.address as any).county || ''}`.replace(/^, |, $/, '').replace(/, ,/g, ',')
                      : `${selectedStudio.address || ''}, ${selectedStudio.city || ''}, ${selectedStudio.county || ''}`.replace(/^, |, $/, '').replace(/, ,/g, ',')
                    }
                  </p>
                </div>
                
                {/* Google Maps Integration */}
                <div className="map-container">
                  {process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? (
                    <iframe
                      title={`Map of ${selectedStudio.name}`}
                      width="100%"
                      height="200"
                      frameBorder="0"
                      src={`https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(
                        selectedStudio.address && typeof selectedStudio.address === 'object' 
                          ? `${(selectedStudio.address as any).street || ''}, ${(selectedStudio.address as any).city || ''}, Ireland` 
                          : `${selectedStudio.address || ''}, ${selectedStudio.city || ''}, Ireland`
                      )}`}
                      allowFullScreen
                    />
                  ) : (
                    <div className="map-placeholder">
                      <p>🗺️ Map view requires Google Maps API key configuration</p>
                    </div>
                  )}
                  <p className="map-note">📍 <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    selectedStudio.address && typeof selectedStudio.address === 'object' 
                      ? `${(selectedStudio.address as any).street || ''}, ${(selectedStudio.address as any).city || ''}, Ireland` 
                      : `${selectedStudio.address || ''}, ${selectedStudio.city || ''}, Ireland`
                  )}`} target="_blank" rel="noopener noreferrer">View on Google Maps</a></p>
                </div>
              </div>
            </div>

            {/* Pricing Information */}
            {selectedStudio.pricing && (
              <div className="info-section">
                <h3>💰 Pricing</h3>
                <div className="pricing-grid">
                  {selectedStudio.pricing.hourlyRate && (
                    <div className="pricing-item">
                      <strong>⏰ Hourly Rate:</strong> €{selectedStudio.pricing.hourlyRate}
                      {selectedStudio.pricing.engineerIncluded && ' (Engineer included)'}
                    </div>
                  )}
                  {selectedStudio.pricing.halfDayRate && (
                    <div className="pricing-item">
                      <strong>🕐 Half Day (4 hours):</strong> €{selectedStudio.pricing.halfDayRate}
                    </div>
                  )}
                  {selectedStudio.pricing.fullDayRate && (
                    <div className="pricing-item">
                      <strong>📅 Full Day (8 hours):</strong> €{selectedStudio.pricing.fullDayRate}
                    </div>
                  )}
                  {selectedStudio.pricing.mixingRate && (
                    <div className="pricing-item">
                      <strong>🎛️ Mixing per Song:</strong> €{selectedStudio.pricing.mixingRate}
                    </div>
                  )}
                  {selectedStudio.pricing.masteringRate && (
                    <div className="pricing-item">
                      <strong>🔊 Mastering per Song:</strong> €{selectedStudio.pricing.masteringRate}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="info-section">
              <h3>📞 Contact Information</h3>
              <div className="contact-info">
                {selectedStudio.contact?.email && (
                  <div className="contact-item">
                    <strong>📧 Email:</strong> 
                    <a href={`mailto:${selectedStudio.contact.email}`}>
                      {selectedStudio.contact.email}
                    </a>
                  </div>
                )}
                {selectedStudio.contact?.phone && (
                  <div className="contact-item">
                    <strong>📱 Phone:</strong> 
                    <a href={`tel:${selectedStudio.contact.phone}`}>
                      {selectedStudio.contact.phone}
                    </a>
                  </div>
                )}
                {selectedStudio.contact?.website && (
                  <div className="contact-item">
                    <strong>🌐 Website:</strong> 
                    <a href={selectedStudio.contact.website} target="_blank" rel="noopener noreferrer">
                      {selectedStudio.contact.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Amenities & Equipment */}
            {selectedStudio.amenities && selectedStudio.amenities.length > 0 && (
              <div className="info-section">
                <h3>🎛️ Equipment & Amenities</h3>
                <div className="amenities-grid">
                  {selectedStudio.amenities.map((amenity: string, index: number) => (
                    <div key={index} className="amenity-item">
                      <span className="amenity-icon">🔧</span>
                      <span>{amenity.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Supported Genres */}
            {selectedStudio.genresSupported && selectedStudio.genresSupported.length > 0 && (
              <div className="info-section">
                <h3>🎵 Supported Genres</h3>
                <div className="genres-list">
                  {selectedStudio.genresSupported.map((genre: string, index: number) => (
                    <span key={index} className="genre-tag">
                      {genre.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Gallery */}
            <div className="info-section">
              <h3>📸 Photo Gallery</h3>
              {selectedStudio.images && selectedStudio.images.length > 0 ? (
                <div className="photo-gallery">
                  {selectedStudio.images.map((image: any, index: number) => (
                    <div key={index} className="photo-item">
                      <img 
                        src={typeof image === 'string' ? image : ((image as any)?.url || (image as any)?.asset?.url || '')} 
                        alt={`${selectedStudio.name} - View ${index + 1}`} 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-photos">
                  <p>No photos available yet.</p>
                  <p>Be the first to share photos of this studio!</p>
                </div>
              )}
              
              {/* Photo Upload Component */}
              <StudioPhotoUpload
                studioId={selectedStudio._id}
                studioName={selectedStudio.name}
                onPhotoUploaded={(newPhoto) => {
                  // Update the selected studio with the new photo
                  setSelectedStudio((prev: any) => ({
                    ...prev,
                    images: [...(prev.images || []), newPhoto]
                  }));
                }}
              />
            </div>

            {/* Description */}
            {selectedStudio.description && (
              <div className="info-section">
                <h3>📝 About This Studio</h3>
                <p className="studio-description-full">
                  {typeof selectedStudio.description === 'string' 
                    ? selectedStudio.description 
                    : (selectedStudio.description as any)?.text || (selectedStudio.description as any)?.content || 'No description available'
                  }
                </p>
              </div>
            )}

            {/* Opening Hours */}
            {selectedStudio.openingHours && (
              <div className="info-section">
                <h3>🕐 Opening Hours</h3>
                <div className="opening-hours">
                  {Object.entries(selectedStudio.openingHours).map(([day, hours]) => (
                    <div key={day} className="hours-item">
                      <strong>{day.charAt(0).toUpperCase() + day.slice(1)}:</strong>
                      <span>{(hours as string) || 'Closed'}</span>
                    </div>
                  ))}
                </div>
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

  /**
   * Render forum page
   */
  const renderForum = () => <CommunityForum />;

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
              className={`nav-link ${currentView === 'studios' ? 'active' : ''}`}
              onClick={() => setCurrentView('studios')}
            >
              Studios
            </button>
            <button 
              className={`nav-link ${currentView === 'bands' ? 'active' : ''}`}
              onClick={() => setCurrentView('bands')}
            >
              Bands
            </button>
            <button 
              className={`nav-link ${currentView === 'store' ? 'active' : ''}`}
              onClick={() => setCurrentView('store')}
            >
              Store
            </button>
            <button 
              className={`nav-link ${currentView === 'gigs' ? 'active' : ''}`}
              onClick={() => setCurrentView('gigs')}
            >
              Gigs
            </button>
            <button 
              className={`nav-link ${currentView === 'features' ? 'active' : ''}`}
              onClick={() => setCurrentView('features')}
            >
              Features
            </button>
            <button 
              className={`nav-link ${(currentView as string) === 'forum' ? 'active' : ''}`}
              onClick={() => setCurrentView('forum' as CurrentView)}
            >
              Forum
            </button>
            <button 
              className="nav-link"
              onClick={() => setShowAuthModal(true)}
            >
              {user ? 'Account' : 'Sign In'}
            </button>
            {!isAdmin && (
              <button 
                className="nav-link admin-link"
                onClick={() => setCurrentView('admin')}
              >
                Admin
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
        </nav>

        {/* Mobile Navigation Menu - Outside of nav to prevent duplication */}
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
                  className={`mobile-nav-link ${currentView === 'studios' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('studios');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span className="nav-icon">🎙️</span>
                  <span>Studios</span>
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
                  className={`mobile-nav-link ${currentView === 'store' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('store');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span>Store</span>
                </button>
                
                <button 
                  className={`mobile-nav-link ${currentView === 'gigs' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('gigs');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span>Gigs</span>
                </button>
                
                <button 
                  className={`mobile-nav-link ${currentView === 'features' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('features');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span>Features</span>
                </button>
                
                <button 
                  className={`mobile-nav-link ${(currentView as string) === 'forum' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('forum' as CurrentView);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span>Forum</span>
                </button>
                
                <div className="mobile-nav-divider"></div>
                
                <button 
                  className="mobile-nav-link account-link"
                  onClick={() => {
                    setShowAuthModal(true);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span>{user ? 'Account' : 'Sign In'}</span>
                </button>
                
                {!isAdmin && (
                  <button 
                    className="mobile-nav-link admin-link"
                    onClick={() => {
                      setCurrentView('admin');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <span>Admin</span>
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
          {currentView === 'studios' && renderStudios()}
          {currentView === 'bands' && <BandsPage />}
          {currentView === 'store' && (
            <StorePage
              onProductClick={(product) => {
                setSelectedProduct(product);
                setCurrentView('product-detail');
              }}
              onCartClick={() => setCurrentView('cart')}
              cartItemCount={cartItemCount}
            />
          )}
          {currentView === 'gigs' && <GigsPage />}
          {currentView === 'features' && <FeatureIdeasPage />}
          {currentView === 'forum' && renderForum()}
          {currentView === 'venue-detail' && renderVenueDetail()}
          {currentView === 'studio-detail' && renderStudioDetail()}
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
