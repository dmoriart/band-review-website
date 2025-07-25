import React from 'react'
import { useSoundStudios } from '../hooks/useSanity'
import { urlFor } from '../sanity'
import { matchesLocation } from '../utils/irishLocations'
import './SanitySoundStudiosGrid.css'

interface SanitySoundStudiosGridProps {
  searchQuery?: string
  selectedCity?: string
  selectedGenre?: string
  selectedPriceRange?: string
  onStudioClick?: (studio: any) => void
}

const SanitySoundStudiosGrid: React.FC<SanitySoundStudiosGridProps> = ({
  searchQuery = '',
  selectedCity = '',
  selectedGenre = '',
  selectedPriceRange = '',
  onStudioClick
}) => {
  const { data, loading, error, refetch } = useSoundStudios()
  const studios: any[] = Array.isArray(data) ? data : []

  const handleRetry = () => {
    console.log('🔄 Manual retry triggered for sound studios data')
    if (refetch) {
      refetch()
    } else {
      // Force page refresh as fallback
      window.location.reload()
    }
  }

  if (loading) {
    return (
      <div className="sanity-studios-loading">
        <div className="loading-spinner"></div>
        <p>Loading sound studios from CMS...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="sanity-studios-error">
        <p>Error loading sound studios: {error}</p>
        <p>This may be a temporary network issue.</p>
        <button 
          onClick={handleRetry}
          className="sanity-studios-retry-button"
        >
          🔄 Retry Loading Studios
        </button>
        <p className="sanity-studios-retry-info">
          The retry mechanism will automatically attempt to reload the data.
        </p>
      </div>
    )
  }

  if (!studios || studios.length === 0) {
    return (
      <div className="sanity-studios-empty">
        <p>No sound studios found in CMS.</p>
        <p>Add some sound studios to your Sanity Studio to see them here.</p>
      </div>
    )
  }

  // Filter studios based on props
  const filteredStudios = studios.filter(studio => {
    // Search filter
    if (searchQuery && !studio.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !studio.description?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !studio.address?.city?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !studio.address?.county?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Location filter using enhanced matching
    if (selectedCity) {
      // Create location string from studio address similar to how bands store location
      const studioLocation = studio.address?.city || studio.address?.county || '';
      if (studioLocation && !matchesLocation(studioLocation, selectedCity)) {
        return false;
      }
    }

    // Genre filter
    if (selectedGenre && studio.genresSupported && !studio.genresSupported.includes(selectedGenre)) {
      return false
    }

    // Price range filter
    if (selectedPriceRange && studio.pricing?.hourlyRate) {
      const [min, max] = selectedPriceRange.split('-').map(Number)
      if (max && (studio.pricing.hourlyRate < min || studio.pricing.hourlyRate > max)) {
        return false
      } else if (!max && studio.pricing.hourlyRate < min) {
        return false
      }
    }

    return true
  })

  return (
    <div className="sanity-studios-grid">
      <div className="sanity-studios-header">
        <h3>Sound Studios from CMS ({filteredStudios.length})</h3>
        <p>Live data from Sanity Studio</p>
      </div>
      
      <div className="studios-grid">
        {filteredStudios.map((studio) => (
          <div 
            key={studio._id} 
            className={`studio-card ${onStudioClick ? 'clickable' : ''} ${studio.featured ? 'featured' : ''} ${studio.verified ? 'verified' : ''}`}
            onClick={() => onStudioClick?.(studio)}
          >
            <div className="studio-card-image">
              {studio.heroImage ? (
                <img 
                  src={urlFor(studio.heroImage).width(400).height(250).url()} 
                  alt={studio.name}
                />
              ) : (
                <div className="studio-placeholder-image">
                  <span>🎙️</span>
                </div>
              )}
              {studio.verified && (
                <div className="verified-badge">✓</div>
              )}
              {studio.claimed && (
                <div className="claimed-badge">👑</div>
              )}
              {studio.featured && (
                <div className="featured-badge">⭐</div>
              )}
              {studio.bandFriendly && (
                <div className="band-friendly-badge">🎸</div>
              )}
            </div>
            
            <div className="studio-card-content">
              <h3>{studio.name || 'Unnamed Studio'}</h3>
              
              {studio.address && studio.address.city && (
                <div className="studio-location">
                  📍 {studio.address.street ? `${studio.address.street}, ` : ''}
                  {studio.address.city || ''}
                  {studio.address.county ? `, ${studio.address.county}` : ''}
                </div>
              )}
              
              {studio.studioType && (
                <div className="studio-type">
                  🏛️ {studio.studioType.replace('_', ' ').toUpperCase()}
                </div>
              )}
              
              {studio.pricing?.hourlyRate && (
                <div className="studio-pricing">
                  💰 €{studio.pricing.hourlyRate}/hour
                  {studio.pricing.engineerIncluded && ' (Engineer included)'}
                </div>
              )}
              
              {studio.capacity && (
                <div className="studio-capacity">
                  👥 Max {studio.capacity} musicians
                </div>
              )}
              
              {studio.genresSupported && studio.genresSupported.length > 0 && (
                <div className="studio-genres">
                  🎵 {studio.genresSupported.slice(0, 3).map((genre: string) => 
                    genre.replace('_', ' ')
                  ).join(', ')}
                  {studio.genresSupported.length > 3 && '...'}
                </div>
              )}
              
              {studio.description && typeof studio.description === 'string' && (
                <p className="studio-description">
                  {studio.description.length > 120 
                    ? `${studio.description.substring(0, 120)}...` 
                    : studio.description
                  }
                </p>
              )}
              
              <div className="studio-contact">
                {studio.contact?.website && (
                  <a href={studio.contact.website} target="_blank" rel="noopener noreferrer">
                    🌐 Website
                  </a>
                )}
                {studio.contact?.phone && (
                  <a href={`tel:${studio.contact.phone}`}>
                    📞 {studio.contact.phone}
                  </a>
                )}
                {studio.contact?.email && (
                  <a href={`mailto:${studio.contact.email}`}>
                    📧 Email
                  </a>
                )}
              </div>

              {studio.amenities && studio.amenities.length > 0 && (
                <div className="studio-amenities">
                  <div className="amenities-tags">
                    {studio.amenities.slice(0, 4).map((amenity: string, index: number) => (
                      <span key={index} className="amenity-tag">
                        {amenity.replace('_', ' ')}
                      </span>
                    ))}
                    {studio.amenities.length > 4 && (
                      <span className="amenity-tag more">+{studio.amenities.length - 4} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SanitySoundStudiosGrid
