import React from 'react';
import { useBands, useVenues } from '../hooks/useSanity';
import './MainAppTest.css';

const MainAppTest: React.FC = () => {
  const { data: bands, loading: bandsLoading, error: bandsError } = useBands();
  const { data: venues, loading: venuesLoading, error: venuesError } = useVenues();
  
  // Type-safe venue array
  const venuesArray = Array.isArray(venues) ? venues : [];

  return (
    <div className="main-app-test-container">
      <h2>Main App CMS Integration Test</h2>
      
      <div className="main-app-test-section">
        <h3>Bands Status</h3>
        {bandsLoading ? (
          <p>Loading bands...</p>
        ) : bandsError ? (
          <div className="main-app-test-error">❌ Error: {bandsError}</div>
        ) : (
          <div className="main-app-test-success">
            ✅ Successfully loaded {bands?.length || 0} bands
            {bands && bands.length > 0 && (
              <ul>
                {bands.slice(0, 5).map(band => (
                  <li key={band._id}>
                    <strong>{band.name}</strong>
                    {band.genres && band.genres.length > 0 && (
                      <span> - Genres: {band.genres.map(g => g.name).join(', ')}</span>
                    )}
                  </li>
                ))}
                {bands.length > 5 && <li>... and {bands.length - 5} more</li>}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="main-app-test-section">
        <h3>Venues Status</h3>
        {venuesLoading ? (
          <p>Loading venues...</p>
        ) : venuesError ? (
          <div className="main-app-test-error">❌ Error: {venuesError}</div>
        ) : (
          <div className="main-app-test-success">
            ✅ Successfully loaded {venuesArray.length || 0} venues
            {venuesArray && venuesArray.length > 0 && (
              <ul>
                {venuesArray.slice(0, 5).map((venue: any) => (
                  <li key={venue._id}>
                    <strong>{venue.name}</strong>
                    {venue.address && <span> - {venue.address}</span>}
                  </li>
                ))}
                {venuesArray.length > 5 && <li>... and {venuesArray.length - 5} more</li>}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="main-app-test-status">
        <strong>Integration Status:</strong>
        <br />
        {(!bandsLoading && !venuesLoading) && (
          <>
            {!bandsError && !venuesError ? (
              <span className="main-app-test-status-success">✅ All CMS connections working perfectly!</span>
            ) : (
              <span className="main-app-test-status-warning">⚠️ Some issues detected with CMS integration</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MainAppTest;
