import React from 'react'
import { useBands } from '../hooks/useSanity'
import { urlFor } from '../sanity'
import './SanityBandsGrid.css'

interface SanityBandsGridProps {
  searchQuery?: string
  selectedGenre?: string
  selectedLocation?: string
  showVerifiedOnly?: boolean
}

const SanityBandsGrid: React.FC<SanityBandsGridProps> = ({
  searchQuery = '',
  selectedGenre = '',
  selectedLocation = '',
  showVerifiedOnly = false
}) => {
  const { data: bands, loading, error } = useBands()

  if (loading) {
    return (
      <div className="sanity-bands-loading">
        <div className="loading-spinner"></div>
        <p>Loading bands from CMS...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="sanity-bands-error">
        <p>Error loading bands: {error}</p>
        <p>Falling back to local data...</p>
      </div>
    )
  }

  if (!bands || bands.length === 0) {
    return (
      <div className="sanity-bands-empty">
        <p>No bands found in CMS.</p>
        <p>Add some bands to your Sanity Studio to see them here.</p>
      </div>
    )
  }

  // Filter bands based on props
  const filteredBands = bands.filter(band => {
    // Search filter
    if (searchQuery && !band.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !band.bio?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !band.locationText?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Genre filter
    if (selectedGenre && !band.genres?.some(genre => genre.name === selectedGenre)) {
      return false
    }

    // Location filter
    if (selectedLocation && band.locationText !== selectedLocation) {
      return false
    }

    // Verified filter
    if (showVerifiedOnly && !band.verified) {
      return false
    }

    return true
  })

  return (
    <div className="sanity-bands-grid">
      <div className="sanity-bands-header">
        <h3>Bands from CMS ({filteredBands.length})</h3>
        <p>Live data from Sanity Studio</p>
      </div>
      
      <div className="bands-grid">
        {filteredBands.map((band) => (
          <div key={band._id} className="band-card">
            <div className="band-card-image">
              {band.profileImage ? (
                <img 
                  src={urlFor(band.profileImage).width(300).height(200).url()} 
                  alt={band.name}
                />
              ) : (
                <div className="band-placeholder-image">
                  <span>🎸</span>
                </div>
              )}
              {band.verified && (
                <div className="verified-badge">✓</div>
              )}
              {band.featured && (
                <div className="featured-badge">⭐</div>
              )}
            </div>
            
            <div className="band-card-content">
              <h3>{band.name}</h3>
              
              {band.locationText && (
                <div className="band-location">
                  📍 {band.locationText}
                </div>
              )}
              
              {band.formedYear && (
                <div className="band-formed">
                  🗓️ Formed {band.formedYear}
                </div>
              )}
              
              {band.genres && band.genres.length > 0 && (
                <div className="band-genres">
                  {band.genres.map((genre) => (
                    <span 
                      key={genre.slug.current} 
                      className={`genre-tag${genre.color?.hex ? ' custom-color' : ''}`}
                      data-bgcolor={genre.color?.hex || '#61dafb'}
                      data-textcolor={genre.color?.hex ? '#ffffff' : '#1e3c72'}
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
              
              {band.bio && (
                <p className="band-bio">
                  {band.bio.length > 120 
                    ? `${band.bio.substring(0, 120)}...` 
                    : band.bio
                  }
                </p>
              )}
              
              {band.socialLinks && (
                <div className="band-social-links">
                  {band.socialLinks.website && (
                    <a href={band.socialLinks.website} target="_blank" rel="noopener noreferrer">
                      🌐
                    </a>
                  )}
                  {band.socialLinks.spotify && (
                    <a href={band.socialLinks.spotify} target="_blank" rel="noopener noreferrer">
                      🎵
                    </a>
                  )}
                  {band.socialLinks.instagram && (
                    <a href={band.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                      📷
                    </a>
                  )}
                  {band.socialLinks.facebook && (
                    <a href={band.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                      👍
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SanityBandsGrid
