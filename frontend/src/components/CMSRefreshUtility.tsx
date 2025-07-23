import React from 'react';
import './CMSRefreshUtility.css';

const CMSRefreshUtility: React.FC = () => {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleFullRefresh = async () => {
    setRefreshing(true);
    
    try {
      console.log('🔄 Performing full CMS refresh...');
      
      // Clear any cached data
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('✅ Browser cache cleared');
      }
      
      // Clear localStorage if any CMS data is cached there
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('sanity') || key.includes('cms')) {
          localStorage.removeItem(key);
        }
      });
      console.log('✅ Local storage cleared');
      
      // Force page reload to restart all hooks
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Refresh failed:', error);
      setRefreshing(false);
    }
  };

  const handleTestDirectAPI = async () => {
    console.log('🔍 Testing direct API access...');
    
    try {
      // Test both bands and venues with direct fetch
      const bandsUrl = 'https://sy7ko2cx.api.sanity.io/v2022-06-01/data/query/production?query=*%5B_type%20%3D%3D%20%22band%22%5D%20%5B0...2%5D%20%7B%20_id%2C%20name%20%7D';
      const venuesUrl = 'https://sy7ko2cx.api.sanity.io/v2022-06-01/data/query/production?query=*%5B_type%20%3D%3D%20%22venue%22%5D%20%5B0...2%5D%20%7B%20_id%2C%20name%20%7D';
      
      const [bandsResponse, venuesResponse] = await Promise.all([
        fetch(bandsUrl),
        fetch(venuesUrl)
      ]);
      
      console.log('Bands API Status:', bandsResponse.status, bandsResponse.statusText);
      console.log('Venues API Status:', venuesResponse.status, venuesResponse.statusText);
      
      if (bandsResponse.ok) {
        const bandsData = await bandsResponse.json();
        console.log('✅ Bands direct API working:', bandsData.result?.length || 0, 'bands');
      }
      
      if (venuesResponse.ok) {
        const venuesData = await venuesResponse.json();
        console.log('✅ Venues direct API working:', venuesData.result?.length || 0, 'venues');
      }
      
    } catch (error) {
      console.error('❌ Direct API test failed:', error);
    }
  };

  return (
    <div className="cms-refresh-utility">
      <h3>🛠️ CMS Refresh Utility</h3>
      <p><strong>Use when:</strong> Persistent network errors despite retry attempts</p>
      
      <div className="cms-refresh-buttons">
        <button 
          onClick={handleTestDirectAPI}
          disabled={refreshing}
          className="cms-refresh-test-btn"
        >
          🔍 Test Direct API
        </button>
        <button 
          onClick={handleFullRefresh}
          disabled={refreshing}
          className="cms-refresh-full-btn"
        >
          {refreshing ? '🔄 Refreshing...' : '🔄 Full CMS Refresh'}
        </button>
      </div>
      
      <div className="cms-refresh-info">
        <p><strong>What this does:</strong></p>
        <ul>
          <li>Tests direct API connectivity without Sanity client</li>
          <li>Clears browser cache and local storage</li>
          <li>Forces complete page reload to restart all hooks</li>
          <li>Should resolve most persistent network issues</li>
        </ul>
        <p><em>Note: Full refresh will reload the entire page</em></p>
      </div>
    </div>
  );
};

export default CMSRefreshUtility;
