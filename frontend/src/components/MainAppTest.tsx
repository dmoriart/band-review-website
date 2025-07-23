import React from 'react';
import { useBands, useVenues } from '../hooks/useSanity';

const MainAppTest: React.FC = () => {
  const { data: bands, loading: bandsLoading, error: bandsError } = useBands();
  const { data: venues, loading: venuesLoading, error: venuesError } = useVenues();
  
  // Type-safe venue array
  const venuesArray = Array.isArray(venues) ? venues : [];

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Main App CMS Integration Test</h2>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>Bands Status</h3>
        {bandsLoading ? (
          <p>Loading bands...</p>
        ) : bandsError ? (
          <div style={{ color: 'red' }}>❌ Error: {bandsError}</div>
        ) : (
          <div style={{ color: 'green' }}>
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

      <div style={{ marginBottom: '30px' }}>
        <h3>Venues Status</h3>
        {venuesLoading ? (
          <p>Loading venues...</p>
        ) : venuesError ? (
          <div style={{ color: 'red' }}>❌ Error: {venuesError}</div>
        ) : (
          <div style={{ color: 'green' }}>
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

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <strong>Integration Status:</strong>
        <br />
        {(!bandsLoading && !venuesLoading) && (
          <>
            {!bandsError && !venuesError ? (
              <span style={{ color: 'green' }}>✅ All CMS connections working perfectly!</span>
            ) : (
              <span style={{ color: 'orange' }}>⚠️ Some issues detected with CMS integration</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MainAppTest;
