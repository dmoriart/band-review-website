import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import FeatureSubmissionForm from './FeatureSubmissionForm';
import FeatureList from './FeatureList';
import FeatureFilters from './FeatureFilters';
import './FeatureIdeasPage.css';

const FeatureIdeasPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [features, setFeatures] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    sort: 'upvotes',
    tags: '',
    page: 1
  });
  const [loading, setLoading] = useState(true);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchFeatures();
    fetchStats();
  }, [filters]);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        ...filters,
        limit: '20'
      });
      
      const response = await fetch(`/api/features?${queryParams}`, {
        headers: {
          'Authorization': isAuthenticated ? `Bearer ${await user.getIdToken()}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setFeatures(data.data.features);
        setStats(data.data.filters);
      }
    } catch (error) {
      console.error('Error fetching features:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/features/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handleFeatureSubmitted = (newFeature) => {
    setFeatures([newFeature, ...features]);
    setShowSubmissionForm(false);
  };

  const handleVoteChange = (featureId, newVoteCount, userHasVoted) => {
    setFeatures(features.map(feature => 
      feature.id === featureId 
        ? { ...feature, upvotes_count: newVoteCount, user_has_voted: userHasVoted }
        : feature
    ));
  };

  return (
    <div className="feature-ideas-page">
      <div className="feature-ideas-header">
        <div className="header-content">
          <h1>Feature Ideas & Bug Reports</h1>
          <p>Help shape the future of BandVenueReview.ie by suggesting new features or reporting bugs!</p>
          
          {stats && (
            <div className="feature-stats">
              <div className="stat-item">
                <span className="stat-number">{stats.status_counts?.suggested || 0}</span>
                <span className="stat-label">Suggested</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.status_counts?.in_progress || 0}</span>
                <span className="stat-label">In Progress</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.status_counts?.done || 0}</span>
                <span className="stat-label">Completed</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="header-actions">
          {isAuthenticated ? (
            <button 
              className="btn btn-primary"
              onClick={() => setShowSubmissionForm(!showSubmissionForm)}
            >
              {showSubmissionForm ? 'Cancel' : 'Submit Idea'}
            </button>
          ) : (
            <div className="login-prompt">
              <p>Please log in to submit ideas or vote on features</p>
              <button className="btn btn-secondary">Login</button>
            </div>
          )}
        </div>
      </div>

      {showSubmissionForm && (
        <FeatureSubmissionForm 
          onSubmitted={handleFeatureSubmitted}
          onCancel={() => setShowSubmissionForm(false)}
        />
      )}

      <div className="feature-ideas-content">
        <div className="filters-section">
          <FeatureFilters 
            filters={filters}
            availableTags={stats?.available_tags || []}
            onFilterChange={handleFilterChange}
          />
        </div>

        <div className="features-section">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading features...</p>
            </div>
          ) : (
            <FeatureList 
              features={features}
              onVoteChange={handleVoteChange}
              userIsAuthenticated={isAuthenticated}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FeatureIdeasPage;
