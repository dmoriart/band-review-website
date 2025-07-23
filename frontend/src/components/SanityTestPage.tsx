import React from 'react';
import { useBands, useVenues } from '../hooks/useSanity';
import './SanityTestPage.css';

const SanityTestPage: React.FC = () => {
  const { data: bands, loading: bandsLoading, error: bandsError } = useBands();
  const { data: venues, loading: venuesLoading, error: venuesError } = useVenues();

  return (
    <div className="sanity-test-page">
      <h1>Sanity CMS Integration Test</h1>
      
      {/* Bands Section */}
      <div className="sanity-test-section">
        <h2>Bands from Sanity CMS</h2>
        {bandsLoading && <p>Loading bands...</p>}
        {bandsError && <p className="error-text">Error loading bands: {bandsError}</p>}
        {bands && bands.length > 0 ? (
          <div>
            <p className="success-text">✅ Successfully loaded {bands.length} bands from Sanity CMS</p>
            <ul>
              {bands.slice(0, 3).map((band) => (
                <li key={band._id} className="test-list-item">
                  <strong>{band.name}</strong> - {band.locationText} ({band.genres?.map(g => g.name).join(', ')})
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="warning-text">No bands found in CMS. Please add some bands in Sanity Studio.</p>
        )}
      </div>

      {/* Venues Section */}
      <div className="sanity-test-section">
        <h2>Venues from Sanity CMS</h2>
        {venuesLoading && <p>Loading venues...</p>}
        {venuesError && <p className="error-text">Error loading venues: {venuesError}</p>}
        {venues && venues.length > 0 ? (
          <div>
            <p className="success-text">✅ Successfully loaded {venues.length} venues from Sanity CMS</p>
            <ul>
              {venues.slice(0, 3).map((venue) => (
                <li key={venue._id} className="test-list-item">
                  <strong>{venue.name}</strong> - {venue.address?.city} (Capacity: {venue.capacity || 'N/A'})
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="warning-text">No venues found in CMS. Please add some venues in Sanity Studio.</p>
        )}
      </div>

      {/* Connection Status */}
      <div className="integration-status">
        <h3>Integration Status</h3>
        <p><strong>Sanity Project ID:</strong> {process.env.REACT_APP_SANITY_PROJECT_ID || 'sy7ko2cx'}</p>
        <p><strong>Dataset:</strong> {process.env.REACT_APP_SANITY_DATASET || 'production'}</p>
        <p><strong>Studio URL:</strong> <a href="https://band-venue-review.sanity.studio/" target="_blank" rel="noopener noreferrer">https://band-venue-review.sanity.studio/</a></p>
        
        <div className="next-steps">
          <h4>Next Steps:</h4>
          <ol>
            <li>Add sample bands and venues in the Sanity Studio</li>
            <li>The data will automatically appear in the main application</li>
            <li>Bands and venues can be managed through the CMS interface</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SanityTestPage;
