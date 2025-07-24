import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import './VenueOwnerDashboard.css';

const VenueOwnerDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data.user);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="venue-owner-dashboard">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your venues...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData || (!dashboardData.owned_venues?.length && !dashboardData.pending_claims?.length)) {
    return (
      <div className="venue-owner-dashboard">
        <div className="empty-state">
          <div className="empty-icon">🏛️</div>
          <h2>No Venues Yet</h2>
          <p>You haven't claimed any venues yet. Browse venues and click "Claim This Venue" to get started.</p>
          <button className="btn-primary" onClick={() => window.location.href = '/venues'}>
            Browse Venues
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="venue-owner-dashboard">
      <div className="dashboard-header">
        <h1>Venue Dashboard</h1>
        <p>Manage your venues and track performance</p>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'venues' ? 'active' : ''}`}
          onClick={() => setActiveTab('venues')}
        >
          My Venues ({dashboardData.owned_venues?.length || 0})
        </button>
        <button 
          className={`tab ${activeTab === 'claims' ? 'active' : ''}`}
          onClick={() => setActiveTab('claims')}
        >
          Pending Claims ({dashboardData.pending_claims?.length || 0})
        </button>
        <button 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <OverviewTab data={dashboardData} />
        )}
        {activeTab === 'venues' && (
          <VenuesTab venues={dashboardData.owned_venues || []} />
        )}
        {activeTab === 'claims' && (
          <ClaimsTab claims={dashboardData.pending_claims || []} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab user={dashboardData} />
        )}
      </div>
    </div>
  );
};

const OverviewTab = ({ data }) => {
  return (
    <div className="overview-tab">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏛️</div>
          <div className="stat-content">
            <div className="stat-number">{data.owned_venues?.length || 0}</div>
            <div className="stat-label">Owned Venues</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-number">{data.pending_claims?.length || 0}</div>
            <div className="stat-label">Pending Claims</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-number">4.2</div>
            <div className="stat-label">Avg Rating</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-number">23</div>
            <div className="stat-label">Total Reviews</div>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">⭐</div>
            <div className="activity-content">
              <div className="activity-text">New review received for The Academy</div>
              <div className="activity-time">2 hours ago</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">✏️</div>
            <div className="activity-content">
              <div className="activity-text">Updated contact information for Vicar Street</div>
              <div className="activity-time">1 day ago</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">✅</div>
            <div className="activity-content">
              <div className="activity-text">Venue claim approved for The Academy</div>
              <div className="activity-time">3 days ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const VenuesTab = ({ venues }) => {
  return (
    <div className="venues-tab">
      <div className="venues-grid">
        {venues.map(venue => (
          <VenueCard key={venue.venue_id} venue={venue} />
        ))}
      </div>
    </div>
  );
};

const VenueCard = ({ venue }) => {
  return (
    <div className="venue-card">
      <div className="venue-header">
        <h3>{venue.venue_name}</h3>
        <div className="venue-role">
          <span className={`role-badge role-${venue.role}`}>
            {venue.role}
          </span>
          {venue.is_primary && (
            <span className="primary-badge">Primary</span>
          )}
        </div>
      </div>
      
      <div className="venue-stats">
        <div className="venue-stat">
          <span className="stat-label">Rating:</span>
          <span className="stat-value">4.2 ⭐</span>
        </div>
        <div className="venue-stat">
          <span className="stat-label">Reviews:</span>
          <span className="stat-value">12</span>
        </div>
        <div className="venue-stat">
          <span className="stat-label">Views:</span>
          <span className="stat-value">1,234</span>
        </div>
      </div>

      <div className="venue-permissions">
        <h4>Your Permissions:</h4>
        <div className="permissions-list">
          {venue.permissions.map(permission => (
            <span key={permission} className="permission-tag">
              {permission.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      <div className="venue-actions">
        <button className="btn-secondary">View Public Page</button>
        <button className="btn-primary">Edit Venue</button>
      </div>
    </div>
  );
};

const ClaimsTab = ({ claims }) => {
  if (claims.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <h3>No Pending Claims</h3>
        <p>You don't have any pending venue claims.</p>
      </div>
    );
  }

  return (
    <div className="claims-tab">
      <div className="claims-list">
        {claims.map(claim => (
          <ClaimCard key={claim.claim_id} claim={claim} />
        ))}
      </div>
    </div>
  );
};

const ClaimCard = ({ claim }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#fdcb6e';
      case 'approved': return '#00b894';
      case 'rejected': return '#d63031';
      case 'requires_verification': return '#74b9ff';
      default: return '#636e72';
    }
  };

  return (
    <div className="claim-card">
      <div className="claim-header">
        <h3>{claim.venue_name}</h3>
        <div 
          className="claim-status"
          style={{ backgroundColor: getStatusColor(claim.status) }}
        >
          {claim.status.replace('_', ' ')}
        </div>
      </div>
      
      <div className="claim-details">
        <p><strong>Submitted:</strong> {new Date(claim.submitted_at).toLocaleDateString()}</p>
        <p><strong>Claim ID:</strong> #{claim.claim_id}</p>
      </div>

      <div className="claim-actions">
        <button className="btn-secondary">View Details</button>
        {claim.status === 'requires_verification' && (
          <button className="btn-primary">Provide Verification</button>
        )}
      </div>
    </div>
  );
};

const SettingsTab = ({ user }) => {
  const [settings, setSettings] = useState({
    email_notifications: true,
    review_notifications: true,
    claim_updates: true,
    marketing_emails: false
  });

  return (
    <div className="settings-tab">
      <div className="settings-section">
        <h3>Profile Information</h3>
        <div className="profile-info">
          <div className="info-item">
            <label>Display Name:</label>
            <span>{user.display_name || 'Not set'}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{user.email}</span>
          </div>
          <div className="info-item">
            <label>Role:</label>
            <span className="role-badge">{user.role}</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Notification Preferences</h3>
        <div className="settings-form">
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.email_notifications}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  email_notifications: e.target.checked
                }))}
              />
              Email notifications for venue updates
            </label>
          </div>
          
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.review_notifications}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  review_notifications: e.target.checked
                }))}
              />
              Notify me of new reviews
            </label>
          </div>
          
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.claim_updates}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  claim_updates: e.target.checked
                }))}
              />
              Updates on claim status
            </label>
          </div>
          
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.marketing_emails}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  marketing_emails: e.target.checked
                }))}
              />
              Marketing and promotional emails
            </label>
          </div>
        </div>
        
        <button className="btn-primary">Save Settings</button>
      </div>
    </div>
  );
};

export default VenueOwnerDashboard;
