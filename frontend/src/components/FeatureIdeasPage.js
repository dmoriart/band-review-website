import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import FeatureSubmissionForm from './FeatureSubmissionForm';
import FeatureList from './FeatureList';
import FeatureFilters from './FeatureFilters';
import './FeatureIdeasPage.css';

const FeatureIdeasPage = () => {
  const { user, loading } = useAuth();
  const isAuthenticated = !!user; // Convert user to boolean
  const [features, setFeatures] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    sort: 'upvotes',
    tags: '',
    page: 1
  });
  const [featuresLoading, setFeaturesLoading] = useState(true);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchFeatures();
    fetchStats();
  }, [filters]);

  const fetchFeatures = async () => {
    try {
      setFeaturesLoading(true);
      
      // TODO: Replace with actual API call when backend is ready
      // For now, show mock data to demonstrate the interface
      const mockFeatures = [
        {
          id: 1,
          title: "Dark Mode Theme",
          description: "Add a dark mode toggle for better night viewing experience",
          type: "feature",
          status: "proposed",
          priority: "medium",
          tags: ["ui", "accessibility", "mobile"],
          author: {
            id: "mock-user-1",
            name: "Sarah Murphy",
            email: "sarah@example.com"
          },
          upvotes_count: 15,
          comments_count: 3,
          user_has_voted: false,
          user_is_subscribed: false,
          created_at: "2024-01-15T10:30:00Z",
          updated_at: "2024-01-15T10:30:00Z"
        },
        {
          id: 2,
          title: "Venue Booking Integration",
          description: "Allow bands to directly book venues through the platform",
          type: "feature",
          status: "in-progress",
          priority: "high",
          tags: ["booking", "integration", "venues"],
          author: {
            id: "mock-user-2",
            name: "John O'Brien",
            email: "john@example.com"
          },
          upvotes_count: 28,
          comments_count: 7,
          user_has_voted: isAuthenticated,
          user_is_subscribed: false,
          created_at: "2024-01-10T14:20:00Z",
          updated_at: "2024-01-20T09:15:00Z"
        },
        {
          id: 3,
          title: "Mobile App Development",
          description: "Create native iOS and Android apps for easier mobile access",
          type: "feature",
          status: "proposed",
          priority: "high",
          tags: ["mobile", "app", "development"],
          author: {
            id: "mock-user-3",
            name: "Lisa Chen",
            email: "lisa@example.com"
          },
          upvotes_count: 42,
          comments_count: 12,
          user_has_voted: false,
          user_is_subscribed: false,
          created_at: "2024-01-05T16:45:00Z",
          updated_at: "2024-01-05T16:45:00Z"
        }
      ];

      const mockStats = {
        available_tags: ["ui", "mobile", "performance", "bug", "enhancement", "booking", "integration", "accessibility"],
        status_counts: {
          proposed: 25,
          "in-progress": 8,
          done: 12,
          declined: 2
        }
      };

      setFeatures(mockFeatures);
      setStats(mockStats);
      
    } catch (error) {
      console.error('Error fetching features:', error);
    } finally {
      setFeaturesLoading(false);
    }
  };

  const fetchStats = async () => {
    // Stats are now fetched together with features in fetchFeatures()
    // This is kept for future API compatibility
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

  // Show loading while auth is being checked
  if (loading) {
    return (
      <div className="feature-ideas-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

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
              <p>Log in to submit ideas and vote on features</p>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  alert('Please use the Sign In button in the main navigation to log in');
                }}
              >
                Sign In Required
              </button>
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
          {featuresLoading ? (
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
