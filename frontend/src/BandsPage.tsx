import React, { useState, useEffect } from 'react';
import './BandsPage.css';
import SanityBandsGrid from './components/SanityBandsGrid';
import BandClaimModal from './components/BandClaimModal';
import BandEditForm from './components/BandEditForm';
import FirebaseConnectionTest from './components/FirebaseConnectionTest';
import FirestoreRulesTest from './components/FirestoreRulesTest';
import FirebaseNetworkTest from './components/FirebaseNetworkTest';
import DirectAPITest from './components/DirectAPITest';
import { useAuth } from './AuthContext';
import { bandUserService } from './services/bandUserService';
import { IRISH_COUNTIES, getAllCityNames, getAllCountyNames, getMajorCitiesForDropdown } from './utils/irishLocations';

// Define interfaces for band data
interface SocialLinks {
  website?: string;
  spotify?: string;
  youtube?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  bandcamp?: string;
  soundcloud?: string;
}

interface UpcomingGig {
  id: string;
  venue_name: string;
  venue_id: string;
  date: string;
  time: string;
  ticket_price?: number;
  ticket_url?: string;
}

interface PastReview {
  id: string;
  venue_name: string;
  venue_id: string;
  date: string;
  rating: number;
  review: string;
}

interface Band {
  id: string;
  name: string;
  bio: string;
  genre: string[];
  location: string;
  formed_year?: number;
  social_links: SocialLinks;
  profile_image?: string;
  banner_image?: string;
  upcoming_gigs: UpcomingGig[];
  past_reviews: PastReview[];
  photos: string[];
  verified: boolean;
  created_at: string;
  updated_at: string;
}

interface BandsResponse {
  bands: Band[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

const BandsPage: React.FC = () => {
  const [bands, setBands] = useState<Band[]>([]);
  const [filteredBands, setFilteredBands] = useState<Band[]>([]);
  const [selectedBand, setSelectedBand] = useState<Band | null>(null);
  const [selectedSanityBand, setSelectedSanityBand] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'list' | 'detail' | 'diagnostics'>('list');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState<boolean>(false);

  // Band claim and edit state
  const [showClaimModal, setShowClaimModal] = useState<boolean>(false);
  const [showEditForm, setShowEditForm] = useState<boolean>(false);
  const [canEditBand, setCanEditBand] = useState<boolean>(false);
  const [isBandClaimed, setIsBandClaimed] = useState<boolean>(false);
  
  const { user } = useAuth();

  // API base URL - updated to use proper backend
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  /**
   * Fetch bands from the API with location parameters
   */
  const fetchBands = async () => {
    try {
      const params = new URLSearchParams();
      params.append('per_page', '100');
      
      if (selectedLocation) {
        params.append('city', selectedLocation);
      }
      if (selectedGenre) {
        params.append('genre', selectedGenre);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`${API_BASE_URL}/bands?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: BandsResponse = await response.json();
      setBands(data.bands);
      setFilteredBands(data.bands);
    } catch (err) {
      console.error('Error fetching bands:', err);
      setError('Failed to fetch bands');
      // Keep existing mock data for development
      const mockBands: Band[] = [
        {
          id: '1',
          name: 'The Midnight Echoes',
          bio: 'An indie rock band from Portland, known for their atmospheric soundscapes and introspective lyrics.',
          genre: ['Indie Rock', 'Alternative'],
          location: 'Portland, OR',
          formed_year: 2018,
          social_links: {
            website: 'https://midnightechoes.band',
            spotify: 'https://open.spotify.com/artist/midnightechoes',
            instagram: '@midnightechoes',
            youtube: 'https://youtube.com/midnightechoes'
          },
          profile_image: 'https://via.placeholder.com/300x300',
          banner_image: 'https://via.placeholder.com/800x300',
          upcoming_gigs: [
            {
              id: '1',
              venue_name: 'The Mercury Lounge',
              venue_id: '1',
              date: '2025-08-15',
              time: '20:00',
              ticket_price: 25,
              ticket_url: 'https://tickets.example.com'
            }
          ],
          past_reviews: [
            {
              id: '1',
              venue_name: 'Crystal Ballroom',
              venue_id: '2',
              date: '2025-06-20',
              rating: 4.5,
              review: 'Amazing energy and great sound quality!'
            }
          ],
          photos: [
            'https://via.placeholder.com/400x300',
            'https://via.placeholder.com/400x300'
          ],
          verified: true,
          created_at: '2025-01-15T00:00:00Z',
          updated_at: '2025-07-20T00:00:00Z'
        },
        {
          id: '2',
          name: 'Electric Storm',
          bio: 'High-energy punk rock band with a message. Playing venues across the Pacific Northwest since 2020.',
          genre: ['Punk Rock', 'Hardcore'],
          location: 'Seattle, WA',
          formed_year: 2020,
          social_links: {
            bandcamp: 'https://electricstorm.bandcamp.com',
            instagram: '@electricstormband',
            facebook: 'ElectricStormOfficial'
          },
          profile_image: 'https://via.placeholder.com/300x300',
          upcoming_gigs: [],
          past_reviews: [
            {
              id: '2',
              venue_name: 'The Crocodile',
              venue_id: '3',
              date: '2025-05-10',
              rating: 4.8,
              review: 'Raw energy and passionate performance!'
            }
          ],
          photos: [
            'https://via.placeholder.com/400x300'
          ],
          verified: false,
          created_at: '2025-02-01T00:00:00Z',
          updated_at: '2025-07-18T00:00:00Z'
        }
      ];
      setBands(mockBands);
      setFilteredBands(mockBands);
    } finally {
      setLoading(false);
    }
  };

  // Fetch bands when component mounts
  useEffect(() => {
    fetchBands();
  }, []);

  // Filter bands based on search and filter criteria
  useEffect(() => {
    let filtered = bands;

    // Search by name, bio, or location
    if (searchQuery) {
      filtered = filtered.filter(band => 
        band.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        band.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        band.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by genre
    if (selectedGenre) {
      filtered = filtered.filter(band => 
        band.genre.some(genre => genre.toLowerCase().includes(selectedGenre.toLowerCase()))
      );
    }

    // Filter by location using enhanced matching
    if (selectedLocation) {
      filtered = filtered.filter(band => 
        matchesLocation(band.location, selectedLocation)
      );
    }

    // Filter by verified status
    if (showVerifiedOnly) {
      filtered = filtered.filter(band => band.verified);
    }

    setFilteredBands(filtered);
  }, [bands, searchQuery, selectedGenre, selectedLocation, showVerifiedOnly]);

  /**
   * Get unique genres for filter dropdown
   */
  const getUniqueGenres = () => {
    const genres = bands.flatMap(band => band.genre);
    return Array.from(new Set(genres)).sort();
  };

  /**
   * Get unique locations for filter dropdown - combining cities and counties
   */
  const getUniqueLocations = () => {
    // Get locations from bands data
    const bandLocations = bands.map(band => band.location).filter(location => location);
    
    // Get standardized Irish cities and counties
    const irishCities = getAllCityNames();
    const irishCounties = getAllCountyNames();
    
    // Combine and deduplicate all locations
    const combinedLocations = [...bandLocations, ...irishCities, ...irishCounties];
    const uniqueLocations = Array.from(new Set(combinedLocations));
    
    return uniqueLocations.sort();
  };

  /**
   * Enhanced Irish location filter - check for cities and counties
   */
  const matchesLocation = (bandLocation: string, filterLocation: string): boolean => {
    if (!bandLocation || !filterLocation) return false;
    
    const band = bandLocation.toLowerCase();
    const filter = filterLocation.toLowerCase();
    
    // Direct match
    if (band.includes(filter)) return true;
    
    // Check if filter is a county and band location contains cities from that county
    const citiesInCounty = getMajorCitiesForDropdown()
      .filter(city => city.county.toLowerCase() === filter)
      .map(city => city.value.toLowerCase());
    
    return citiesInCounty.some(city => band.includes(city));
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * Render band card
   */
  const renderBandCard = (band: Band) => (
    <div key={band.id} className="band-card" onClick={() => setSelectedBand(band)}>
      <div className="band-card-image">
        <img src={band.profile_image || 'https://via.placeholder.com/300x300'} alt={band.name} />
        {band.verified && <div className="verified-badge">✓</div>}
      </div>
      <div className="band-card-content">
        <h3>{band.name}</h3>
        <p className="band-location">{band.location}</p>
        <div className="band-genres">
          {band.genre.slice(0, 2).map(genre => (
            <span key={genre} className="genre-tag">{genre}</span>
          ))}
        </div>
        <p className="band-bio">{band.bio.substring(0, 120)}...</p>
        <div className="band-stats">
          <span>{band.upcoming_gigs.length} upcoming gigs</span>
          <span>{band.past_reviews.length} reviews</span>
        </div>
      </div>
    </div>
  );

  /**
   * Handle clicking on a Sanity band
   */
  const handleSanityBandClick = async (band: any) => {
    console.log('🎸 Band clicked:', band.name);
    setSelectedSanityBand(band);
    setCurrentView('detail');
    
    // Check permissions if user is logged in
    if (user && band._id) {
      try {
        const canEdit = await bandUserService.canUserEditBand(user.uid, band._id);
        const claimed = await bandUserService.isBandClaimed(band._id);
        setCanEditBand(canEdit);
        setIsBandClaimed(claimed);
      } catch (error) {
        console.error('Error checking band permissions:', error);
        setCanEditBand(false);
        setIsBandClaimed(false);
      }
    } else {
      setCanEditBand(false);
      setIsBandClaimed(false);
    }
  };

  /**
   * Render Sanity band detail page
   */
  const renderSanityBandDetail = () => {
    if (!selectedSanityBand) return <div>Band not found</div>;

    return (
      <div className="band-detail">
        <button 
          className="back-button"
          onClick={() => setCurrentView('list')}
        >
          ← Back to Bands
        </button>

        <div className="band-detail-header">
          <div className="band-title-section">
            <h1>{selectedSanityBand.name}</h1>
            <div className="band-badges">
              {selectedSanityBand.verified && <span className="badge verified">✓ Verified</span>}
              {selectedSanityBand.featured && <span className="badge featured">⭐ Featured</span>}
            </div>
          </div>

          {/* Band Action Buttons */}
          {user ? (
            <div className="band-actions">
              {canEditBand ? (
                <button 
                  className="edit-band-btn"
                  onClick={() => setShowEditForm(true)}
                >
                  ✏️ Edit Band Profile
                </button>
              ) : !isBandClaimed ? (
                <button 
                  className="claim-band-btn"
                  onClick={() => setShowClaimModal(true)}
                >
                  🎸 Claim this Band
                </button>
              ) : (
                <div className="band-claimed-notice">
                  <span>🔒 This band is already claimed</span>
                </div>
              )}
            </div>
          ) : (
            <div className="band-actions">
              <div className="login-prompt">
                <span>Sign in to claim or edit this band</span>
              </div>
            </div>
          )}
        </div>

        <div className="band-detail-content">
          <div className="band-main-info">
            {/* Profile Image Section */}
            {selectedSanityBand.profileImage && (
              <div className="info-section">
                <div className="band-profile-container">
                  <img 
                    src={`https://cdn.sanity.io/images/sy7ko2cx/production/${selectedSanityBand.profileImage.asset._ref.replace('image-', '').replace('-jpg', '.jpg').replace('-png', '.png')}`} 
                    alt={`${selectedSanityBand.name} profile`}
                    className="band-profile-image-large"
                  />
                </div>
              </div>
            )}

            {/* Basic Info Section */}
            <div className="info-section">
              <h3>🎸 Band Information</h3>
              <div className="info-grid">
                {selectedSanityBand.locationText && (
                  <div className="info-item">
                    <strong>📍 Location:</strong>
                    <p>{selectedSanityBand.locationText}</p>
                  </div>
                )}
                
                {selectedSanityBand.formedYear && (
                  <div className="info-item">
                    <strong>🗓️ Formed:</strong>
                    <p>{selectedSanityBand.formedYear}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Genres Section */}
            {selectedSanityBand.genres && selectedSanityBand.genres.length > 0 && (
              <div className="info-section">
                <h3>🎵 Genres</h3>
                <div className="genre-tags-detail">
                  {selectedSanityBand.genres.map((genre: any) => (
                    <span 
                      key={genre.slug.current} 
                      className="genre-tag-large"
                      data-genre-color={genre.color?.hex}
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bio Section */}
            {selectedSanityBand.bio && (
              <div className="info-section">
                <h3>📖 About</h3>
                <div className="band-bio-full">
                  <p>{selectedSanityBand.bio}</p>
                </div>
              </div>
            )}

            {/* Social Links Section */}
            {selectedSanityBand.socialLinks && Object.keys(selectedSanityBand.socialLinks).length > 0 && (
              <div className="info-section">
                <h3>🔗 Social Links</h3>
                <div className="social-links-grid">
                  {selectedSanityBand.socialLinks.website && (
                    <a href={selectedSanityBand.socialLinks.website} target="_blank" rel="noopener noreferrer" className="social-link-large">
                      🌐 Website
                    </a>
                  )}
                  {selectedSanityBand.socialLinks.spotify && (
                    <a href={selectedSanityBand.socialLinks.spotify} target="_blank" rel="noopener noreferrer" className="social-link-large">
                      🎵 Spotify
                    </a>
                  )}
                  {selectedSanityBand.socialLinks.instagram && (
                    <a href={selectedSanityBand.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="social-link-large">
                      📷 Instagram
                    </a>
                  )}
                  {selectedSanityBand.socialLinks.facebook && (
                    <a href={selectedSanityBand.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="social-link-large">
                      👍 Facebook
                    </a>
                  )}
                  {selectedSanityBand.socialLinks.youtube && (
                    <a href={selectedSanityBand.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="social-link-large">
                      📺 YouTube
                    </a>
                  )}
                  {selectedSanityBand.socialLinks.bandcamp && (
                    <a href={selectedSanityBand.socialLinks.bandcamp} target="_blank" rel="noopener noreferrer" className="social-link-large">
                      🎶 Bandcamp
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Band Claim Modal */}
        <BandClaimModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          band={selectedSanityBand}
          onClaimSubmitted={() => {
            setShowClaimModal(false);
            // Refresh permissions after claim is submitted
            if (user && selectedSanityBand._id) {
              handleSanityBandClick(selectedSanityBand);
            }
          }}
        />

        {/* Band Edit Form */}
        <BandEditForm
          isOpen={showEditForm}
          onClose={() => setShowEditForm(false)}
          band={selectedSanityBand}
          onSaved={() => {
            setShowEditForm(false);
            // Optionally refresh the band data here
            console.log('Band profile updated!');
          }}
        />
      </div>
    );
  };

  /**
   * Render band detail modal
   */
  const renderBandDetail = () => {
    if (!selectedBand) return null;

    return (
      <div className="modal-overlay" onClick={() => setSelectedBand(null)}>
        <div className="modal-content band-detail" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setSelectedBand(null)}>×</button>
          
          {/* Banner Image */}
          {selectedBand.banner_image && (
            <div className="band-banner">
              <img src={selectedBand.banner_image} alt={`${selectedBand.name} banner`} />
            </div>
          )}

          <div className="band-detail-content">
            {/* Header */}
            <div className="band-header">
              <div className="band-profile-image">
                <img 
                  src={selectedBand.profile_image || 'https://via.placeholder.com/150x150'} 
                  alt={selectedBand.name} 
                />
                {selectedBand.verified && <div className="verified-badge">✓</div>}
              </div>
              <div className="band-info">
                <h1>{selectedBand.name}</h1>
                <p className="band-location">{selectedBand.location}</p>
                {selectedBand.formed_year && (
                  <p className="formed-year">Formed: {selectedBand.formed_year}</p>
                )}
                <div className="band-genres">
                  {selectedBand.genre.map(genre => (
                    <span key={genre} className="genre-tag">{genre}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="band-section">
              <h3>About</h3>
              <p>{selectedBand.bio}</p>
            </div>

            {/* Social Links */}
            {Object.keys(selectedBand.social_links).length > 0 && (
              <div className="band-section">
                <h3>Connect</h3>
                <div className="social-links">
                  {Object.entries(selectedBand.social_links).map(([platform, url]) => (
                    <a 
                      key={platform}
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`social-link ${platform}`}
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Gigs */}
            {selectedBand.upcoming_gigs.length > 0 && (
              <div className="band-section">
                <h3>Upcoming Shows</h3>
                <div className="gigs-list">
                  {selectedBand.upcoming_gigs.map(gig => (
                    <div key={gig.id} className="gig-item">
                      <div className="gig-date">
                        <div className="date">{formatDate(gig.date)}</div>
                        <div className="time">{gig.time}</div>
                      </div>
                      <div className="gig-details">
                        <h4>{gig.venue_name}</h4>
                        {gig.ticket_price && <span className="price">${gig.ticket_price}</span>}
                      </div>
                      {gig.ticket_url && (
                        <a href={gig.ticket_url} target="_blank" rel="noopener noreferrer" className="ticket-link">
                          Get Tickets
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Reviews */}
            {selectedBand.past_reviews.length > 0 && (
              <div className="band-section">
                <h3>Venue Reviews</h3>
                <div className="reviews-list">
                  {selectedBand.past_reviews.map(review => (
                    <div key={review.id} className="review-item">
                      <div className="review-header">
                        <h4>{review.venue_name}</h4>
                        <div className="rating">{'★'.repeat(Math.floor(review.rating))}</div>
                      </div>
                      <p className="review-date">{formatDate(review.date)}</p>
                      <p className="review-text">{review.review}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos */}
            {selectedBand.photos.length > 0 && (
              <div className="band-section">
                <h3>Photos</h3>
                <div className="photos-grid">
                  {selectedBand.photos.map((photo, index) => (
                    <img key={index} src={photo} alt={`${selectedBand.name} ${index + 1}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bands-page">
        <div className="loading-spinner"></div>
        <p>Loading bands...</p>
      </div>
    );
  }

  return (
    <div className="bands-page">
      {currentView === 'diagnostics' ? (
        <>
          <div className="bands-header">
            <h1>Connection Diagnostics</h1>
            <p>Test backend API connectivity and Firebase performance</p>
            <button 
              onClick={() => setCurrentView('list')} 
              className="back-button bands-back-btn"
            >
              ← Back to Bands
            </button>
          </div>
          <DirectAPITest />
          <div className="margin-top-20">
            <FirebaseConnectionTest />
          </div>
          <div className="margin-top-20">
            <FirestoreRulesTest />
          </div>
          <div className="margin-top-20">
            <FirebaseNetworkTest />
          </div>
        </>
      ) : currentView === 'list' ? (
        <>
          <div className="bands-header">
            <h1>Discover Bands</h1>
            <p>Find amazing artists and discover new music from venues across the region</p>
            <button 
              onClick={() => setCurrentView('diagnostics')} 
              className="diagnostic-button bands-diagnostic-btn"
            >
              🔧 Test Firebase Connection
            </button>
          </div>

          {/* Search and Filters */}
          <div className="bands-filters">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search bands, genres, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="filter-controls">
              <select 
                value={selectedGenre} 
                onChange={(e) => setSelectedGenre(e.target.value)}
                aria-label="Filter by genre"
              >
                <option value="">All Genres</option>
                {getUniqueGenres().map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>

              <select 
                value={selectedLocation} 
                onChange={(e) => setSelectedLocation(e.target.value)}
                aria-label="Filter by location"
              >
                <option value="">All Locations</option>
                {getUniqueLocations().map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showVerifiedOnly}
                  onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                />
                Verified only
              </label>
            </div>
          </div>

          {/* Sanity CMS Bands */}
          <SanityBandsGrid onBandClick={handleSanityBandClick} />

          {/* Legacy band detail modal for old bands */}
          {renderBandDetail()}
        </>
      ) : (
        renderSanityBandDetail()
      )}
    </div>
  );
};

export default BandsPage;
