import React from 'react';
import { useBands, useVenues } from '../hooks/useSanity';
import DirectAPITest from './DirectAPITest';
import MainAppTest from './MainAppTest';
import VenuesDebugTest from './VenuesDebugTest';
import NetworkDiagnostics from './NetworkDiagnostics';
import CMSRefreshUtility from './CMSRefreshUtility';
import './SanityTestPage.css';

const SanityTestPage: React.FC = () => {
  const { data: bands, loading: bandsLoading, error: bandsError } = useBands();
  const { data: venues, loading: venuesLoading, error: venuesError } = useVenues();

  // Ensure venues is always an array for type safety
  const venuesArray = Array.isArray(venues) ? venues : [];

  return (
    <div className="sanity-test-page">
      <h1>Sanity CMS Integration Test</h1>
      
      {/* Network Diagnostics - New comprehensive testing */}
      <div className="sanity-test-section">
        <NetworkDiagnostics />
      </div>
      
      {/* CMS Refresh Utility - For persistent issues */}
      <div className="sanity-test-section">
        <CMSRefreshUtility />
      </div>
      
      {/* Direct API Test - New debugging component */}
      <div className="sanity-test-section">
        <DirectAPITest />
      </div>
      
      {/* Main App Hooks Test - Additional validation */}
      <div className="sanity-test-section">
        <MainAppTest />
      </div>
      
      {/* Venues Debug Test - Specific venues issue debugging */}
      <div className="sanity-test-section">
        <VenuesDebugTest />
      </div>
      
      {/* Bands Section */}
            <div className="test-header">
        <h2>🧪 Sanity CMS Integration Test</h2>
        <p>This page tests the connection to your Sanity CMS and displays live data.</p>
        <p className="debug-timestamp">Last updated: {new Date().toISOString()}</p>
      </div>

      {/* Venues Section */}
      <div className="sanity-test-section">
        {venuesArray.length > 0 ? (
          <div>
            <p className="success-text">✅ Successfully loaded {venuesArray.length} venues from Sanity CMS</p>
            <ul>
              {venuesArray.slice(0, 3).map((venue) => (
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
