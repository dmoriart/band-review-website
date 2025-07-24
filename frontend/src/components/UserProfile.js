import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import './UserProfile.css';

const UserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    location: '',
    website: '',
    notification_preferences: {
      email_venue_updates: true,
      email_review_responses: true,
      email_claim_updates: true,
      email_marketing: false
    }
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setProfile(data.data.user);
        setFormData({
          display_name: data.data.user.display_name || '',
          bio: data.data.user.bio || '',
          location: data.data.user.location || '',
          website: data.data.user.website || '',
          notification_preferences: {
            email_venue_updates: data.data.user.notification_preferences?.email_venue_updates ?? true,
            email_review_responses: data.data.user.notification_preferences?.email_review_responses ?? true,
            email_claim_updates: data.data.user.notification_preferences?.email_claim_updates ?? true,
            email_marketing: data.data.user.notification_preferences?.email_marketing ?? false
          }
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setProfile(data.data.user);
        setEditing(false);
      } else {
        alert('Error: ' + data.error.message);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        notification_preferences: profile.notification_preferences || {
          email_venue_updates: true,
          email_review_responses: true,
          email_claim_updates: true,
          email_marketing: false
        }
      });
    }
    setEditing(false);
  };

  const handleNotificationChange = (key) => {
    setFormData(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [key]: !prev.notification_preferences[key]
      }
    }));
  };

  if (loading) {
    return (
      <div className="user-profile">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="profile-avatar">
          <img 
            src={user?.photoURL || '/default-avatar.png'} 
            alt="Profile" 
            onError={(e) => {
              e.target.src = '/default-avatar.png';
            }}
          />
        </div>
        <div className="profile-info">
          <h1>{profile?.display_name || user?.displayName || 'Anonymous User'}</h1>
          <p className="profile-email">{user?.email}</p>
          <div className="profile-stats">
            <div className="stat">
              <span className="stat-number">{profile?.owned_venues?.length || 0}</span>
              <span className="stat-label">Venues Owned</span>
            </div>
            <div className="stat">
              <span className="stat-number">{profile?.reviews_count || 0}</span>
              <span className="stat-label">Reviews Written</span>
            </div>
            <div className="stat">
              <span className="stat-number">{profile?.pending_claims?.length || 0}</span>
              <span className="stat-label">Pending Claims</span>
            </div>
          </div>
        </div>
        <div className="profile-actions">
          {!editing ? (
            <button className="btn-primary" onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSave}>
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>Personal Information</h2>
          {!editing ? (
            <div className="profile-display">
              <div className="info-item">
                <label>Display Name:</label>
                <span>{profile?.display_name || 'Not set'}</span>
              </div>
              <div className="info-item">
                <label>Bio:</label>
                <span>{profile?.bio || 'No bio added yet'}</span>
              </div>
              <div className="info-item">
                <label>Location:</label>
                <span>{profile?.location || 'Not specified'}</span>
              </div>
              <div className="info-item">
                <label>Website:</label>
                {profile?.website ? (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer">
                    {profile.website}
                  </a>
                ) : (
                  <span>Not specified</span>
                )}
              </div>
              <div className="info-item">
                <label>Member Since:</label>
                <span>{new Date(profile?.created_at || user?.metadata?.creationTime).toLocaleDateString()}</span>
              </div>
            </div>
          ) : (
            <div className="profile-form">
              <div className="form-group">
                <label>Display Name:</label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Your display name"
                />
              </div>
              <div className="form-group">
                <label>Bio:</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Location:</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, Country"
                />
              </div>
              <div className="form-group">
                <label>Website:</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          )}
        </div>

        <div className="profile-section">
          <h2>Notification Preferences</h2>
          <div className="notifications-form">
            <div className="notification-item">
              <label className="notification-label">
                <input
                  type="checkbox"
                  checked={formData.notification_preferences.email_venue_updates}
                  onChange={() => handleNotificationChange('email_venue_updates')}
                  disabled={!editing}
                />
                <span className="checkmark"></span>
                <div className="notification-info">
                  <span className="notification-title">Venue Updates</span>
                  <span className="notification-description">
                    Get notified when venues you own are updated or reviewed
                  </span>
                </div>
              </label>
            </div>

            <div className="notification-item">
              <label className="notification-label">
                <input
                  type="checkbox"
                  checked={formData.notification_preferences.email_review_responses}
                  onChange={() => handleNotificationChange('email_review_responses')}
                  disabled={!editing}
                />
                <span className="checkmark"></span>
                <div className="notification-info">
                  <span className="notification-title">Review Responses</span>
                  <span className="notification-description">
                    Get notified when venue owners respond to your reviews
                  </span>
                </div>
              </label>
            </div>

            <div className="notification-item">
              <label className="notification-label">
                <input
                  type="checkbox"
                  checked={formData.notification_preferences.email_claim_updates}
                  onChange={() => handleNotificationChange('email_claim_updates')}
                  disabled={!editing}
                />
                <span className="checkmark"></span>
                <div className="notification-info">
                  <span className="notification-title">Claim Updates</span>
                  <span className="notification-description">
                    Get notified about the status of your venue ownership claims
                  </span>
                </div>
              </label>
            </div>

            <div className="notification-item">
              <label className="notification-label">
                <input
                  type="checkbox"
                  checked={formData.notification_preferences.email_marketing}
                  onChange={() => handleNotificationChange('email_marketing')}
                  disabled={!editing}
                />
                <span className="checkmark"></span>
                <div className="notification-info">
                  <span className="notification-title">Marketing Emails</span>
                  <span className="notification-description">
                    Receive newsletters and promotional content about new features
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {profile?.owned_venues?.length > 0 && (
          <div className="profile-section">
            <h2>Your Venues</h2>
            <div className="venues-grid">
              {profile.owned_venues.map(venue => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          </div>
        )}

        {profile?.pending_claims?.length > 0 && (
          <div className="profile-section">
            <h2>Pending Claims</h2>
            <div className="claims-list">
              {profile.pending_claims.map(claim => (
                <ClaimCard key={claim.id} claim={claim} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const VenueCard = ({ venue }) => {
  return (
    <div className="venue-card">
      <div className="venue-image">
        {venue.main_image ? (
          <img src={venue.main_image} alt={venue.name} />
        ) : (
          <div className="venue-placeholder">🏢</div>
        )}
      </div>
      <div className="venue-info">
        <h3>{venue.name}</h3>
        <p>{venue.address}</p>
        <div className="venue-meta">
          <span className="venue-role">{venue.user_role}</span>
          <span className="venue-reviews">{venue.review_count} reviews</span>
        </div>
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
      <div className="claim-info">
        <h4>{claim.venue_name}</h4>
        <p>Submitted: {new Date(claim.submitted_at).toLocaleDateString()}</p>
        <p>Type: {claim.claim_type}</p>
      </div>
      <div 
        className="claim-status"
        style={{ backgroundColor: getStatusColor(claim.status) }}
      >
        {claim.status.replace('_', ' ')}
      </div>
    </div>
  );
};

export default UserProfile;
