import React, { useState, useEffect } from 'react';
import './BandsPage.css';
import SanityBandsGrid from './components/SanityBandsGrid';

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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState<boolean>(false);

  // API base URL
  const API_BASE_URL = 'https://band-review-website.onrender.com/api';

  /**
   * Fetch bands from the API
   */
  const fetchBands = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bands?per_page=50`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: BandsResponse = await response.json();
      setBands(data.bands);
      setFilteredBands(data.bands);
    } catch (err) {
      console.error('Error fetching bands:', err);
      setError('Failed to fetch bands');
      // Mock data for development
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

    // Filter by location
    if (selectedLocation) {
      filtered = filtered.filter(band => 
        band.location.toLowerCase().includes(selectedLocation.toLowerCase())
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
   * Get unique locations for filter dropdown
   */
  const getUniqueLocations = () => {
    const locations = bands.map(band => band.location);
    return Array.from(new Set(locations)).sort();
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
      <div className="bands-header">
        <h1>Discover Bands</h1>
        <p>Find amazing artists and discover new music from venues across the region</p>
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

      {/* Results count */}
      <div className="results-info">
        <p>Showing {filteredBands.length} of {bands.length} bands</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <p>Showing sample data for demonstration</p>
        </div>
      )}

      {/* Sanity CMS Bands */}
      <SanityBandsGrid />

      {/* Bands grid */}
      <div className="bands-grid">
        {filteredBands.map(renderBandCard)}
      </div>

      {/* No results */}
      {filteredBands.length === 0 && !loading && (
        <div className="no-results">
          <h3>No bands found</h3>
          <p>Try adjusting your search criteria or filters</p>
        </div>
      )}

      {/* Band detail modal */}
      {renderBandDetail()}
    </div>
  );
};

export default BandsPage;
