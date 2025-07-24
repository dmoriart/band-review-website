import React from 'react'
import { useVenues } from '../hooks/useSanity'
import { urlFor } from '../sanity'
import './SanityVenuesGrid.css'

interface SanityVenuesGridProps {
  searchQuery?: string
  selectedCity?: string
  selectedCapacity?: string
  selectedRating?: string
  onVenueClick?: (venue: any) => void
}

const SanityVenuesGrid: React.FC<SanityVenuesGridProps> = ({
  searchQuery = '',
  selectedCity = '',
  selectedCapacity = '',
  onVenueClick
}) => {
  const { data, loading, error, refetch } = useVenues()
  const venues: any[] = Array.isArray(data) ? data : []

  const handleRetry = () => {
    console.log('🔄 Manual retry triggered for venues data')
    if (refetch) {
      refetch()
    } else {
      // Force page refresh as fallback
      window.location.reload()
    }
  }

  if (loading) {
    return (
      <div className="sanity-venues-loading">
        <div className="loading-spinner"></div>
        <p>Loading venues from CMS...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="sanity-venues-error">
        <p>Error loading venues: {error}</p>
        <p>This may be a temporary network issue.</p>
        <button 
          onClick={handleRetry}
          className="sanity-venues-retry-button"
        >
          🔄 Retry Loading Venues
        </button>
        <p className="sanity-venues-retry-info">
          The retry mechanism will automatically attempt to reload the data.
        </p>
      </div>
    )
  }

  if (!venues || venues.length === 0) {
    return (
      <div className="sanity-venues-empty">
        <p>No venues found in CMS.</p>
        <p>Add some venues to your Sanity Studio to see them here.</p>
      </div>
    )
  }

  // Filter venues based on props
  const filteredVenues = venues.filter(venue => {
    // Search filter
    if (searchQuery && !venue.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !venue.description?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !venue.address?.city?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // City filter
    if (selectedCity && venue.address?.city !== selectedCity) {
      return false
    }

    // Capacity filter
    if (selectedCapacity && venue.capacity) {
      const [min, max] = selectedCapacity.split('-').map(Number)
      if (max && (venue.capacity < min || venue.capacity > max)) {
        return false
      } else if (!max && venue.capacity < min) {
        return false
      }
    }

    return true
  })

  return (
    <div className="sanity-venues-grid">
      <div className="sanity-venues-header">
        <h3>Venues from CMS ({filteredVenues.length})</h3>
        <p>Live data from Sanity Studio</p>
      </div>
      
      <div className="venues-grid">
        {filteredVenues.map((venue) => (
          <div 
            key={venue._id} 
            className={`venue-card ${onVenueClick ? 'clickable' : ''}`}
            onClick={() => onVenueClick?.(venue)}
          >
            <div className="venue-card-image">
              {venue.heroImage ? (
                <img 
                  src={urlFor(venue.heroImage).width(400).height(250).url()} 
                  alt={venue.name}
                />
              ) : (
                <div className="venue-placeholder-image">
                  <span>🏛️</span>
                </div>
              )}
              {venue.verified && (
                <div className="verified-badge">✓</div>
              )}
              {venue.claimed && (
                <div className="claimed-badge">👑</div>
              )}
              {venue.featured && (
                <div className="featured-badge">⭐</div>
              )}
            </div>
            
            <div className="venue-card-content">
              <h3>{venue.name || 'Unnamed Venue'}</h3>
              
              {venue.address && venue.address.city && (
                <div className="venue-location">
                  📍 {venue.address.street ? `${venue.address.street}, ` : ''}
                  {venue.address.city || ''}
                  {venue.address.county ? `, ${venue.address.county}` : ''}
                </div>
              )}
              
              {venue.capacity && (
                <div className="venue-capacity">
                  👥 Capacity: {venue.capacity.toLocaleString()}
                </div>
              )}
              
              {venue.venueType && typeof venue.venueType === 'string' && (
                <div className="venue-type">
                  🏛️ {venue.venueType.replace('_', ' ').toUpperCase()}
                </div>
              )}
              
              {venue.description && typeof venue.description === 'string' && (
                <p className="venue-description">
                  {venue.description.length > 120 
                    ? `${venue.description.substring(0, 120)}...` 
                    : venue.description
                  }
                </p>
              )}
              
              <div className="venue-contact">
                {venue.contact?.website && (
                  <a href={venue.contact.website} target="_blank" rel="noopener noreferrer">
                    🌐 Website
                  </a>
                )}
                {venue.contact?.phone && (
                  <a href={`tel:${venue.contact.phone}`}>
                    📞 {venue.contact.phone}
                  </a>
                )}
                {venue.contact?.email && (
                  <a href={`mailto:${venue.contact.email}`}>
                    📧 Email
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SanityVenuesGrid
