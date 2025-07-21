import React, { useState, useEffect, useCallback } from 'react';

interface AdminStats {
  total_venues: number;
  total_users: number;
  total_bands: number;
  total_reviews: number;
  verified_venues: number;
  unverified_venues: number;
  verified_users: number;
  unverified_users: number;
  recent_venues: Venue[];
  recent_users: User[];
  recent_reviews: Review[];
}

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  county: string;
  capacity?: number;
  venue_type?: string;
  primary_genres?: string[];
  facilities?: string[];
  description?: string;
  average_rating: number;
  review_count: number;
  claimed: boolean;
  verified: boolean;
  created_at?: string;
}

interface User {
  id: string;
  email: string;
  user_type: string;
  name: string;
  phone?: string;
  website?: string;
  bio?: string;
  verified: boolean;
  created_at?: string;
}

interface Review {
  id: string;
  venue_id: string;
  band_id: string;
  title: string;
  review_text: string;
  overall_rating: number;
  created_at?: string;
}

interface AdminPanelProps {
  apiBaseUrl: string;
  adminToken?: string;
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ apiBaseUrl, adminToken, onLogout }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'venues' | 'users' | 'reviews'>('dashboard');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const fetchWithAuth = useCallback((url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        ...options.headers,
      },
    });
  }, [adminToken]);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${apiBaseUrl}/admin/stats`);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Admin access required');
        }
        throw new Error('Failed to load admin stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, apiBaseUrl]);

  const loadVenues = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${apiBaseUrl}/admin/venues?per_page=100`);
      if (!response.ok) throw new Error('Failed to load venues');
      
      const data = await response.json();
      setVenues(data.venues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load venues');
    }
  }, [fetchWithAuth, apiBaseUrl]);

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${apiBaseUrl}/admin/users?per_page=100`);
      if (!response.ok) throw new Error('Failed to load users');
      
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    }
  }, [fetchWithAuth, apiBaseUrl]);

  const loadReviews = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${apiBaseUrl}/admin/reviews?per_page=100`);
      if (!response.ok) throw new Error('Failed to load reviews');
      
      const data = await response.json();
      setReviews(data.reviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    }
  }, [fetchWithAuth, apiBaseUrl]);

  const updateVenue = async (venueId: string, updates: Partial<Venue>) => {
    try {
      const response = await fetchWithAuth(`${apiBaseUrl}/admin/venues/${venueId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update venue');
      
      await loadVenues();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update venue');
      return false;
    }
  };

  const deleteVenue = async (venueId: string) => {
    try {
      const response = await fetchWithAuth(`${apiBaseUrl}/admin/venues/${venueId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete venue');
      
      await loadVenues();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete venue');
      return false;
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await fetchWithAuth(`${apiBaseUrl}/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update user');
      
      await loadUsers();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      return false;
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      const response = await fetchWithAuth(`${apiBaseUrl}/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete review');
      
      await loadReviews();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete review');
      return false;
    }
  };

  useEffect(() => {
    if (adminToken) {
      loadStats();
    }
  }, [adminToken, loadStats]);

  useEffect(() => {
    if (activeTab === 'venues' && adminToken) {
      loadVenues();
    } else if (activeTab === 'users' && adminToken) {
      loadUsers();
    } else if (activeTab === 'reviews' && adminToken) {
      loadReviews();
    }
  }, [activeTab, adminToken, loadVenues, loadUsers, loadReviews]);

  if (loading) {
    return <div className="admin-loading">Loading admin panel...</div>;
  }

  if (error) {
    return (
      <div className="admin-error">
        <h3>Error: {error}</h3>
        <button onClick={onLogout} className="btn-secondary">Back to Login</button>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="admin-dashboard">
      <h2>📊 Admin Dashboard</h2>
      
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>🏛️ Venues</h3>
            <div className="stat-number">{stats.total_venues}</div>
            <div className="stat-details">
              <span className="verified">✅ {stats.verified_venues} verified</span>
              <span className="unverified">⏳ {stats.unverified_venues} pending</span>
            </div>
          </div>
          
          <div className="stat-card">
            <h3>👥 Users</h3>
            <div className="stat-number">{stats.total_users}</div>
            <div className="stat-details">
              <span className="verified">✅ {stats.verified_users} verified</span>
              <span className="unverified">⏳ {stats.unverified_users} pending</span>
            </div>
          </div>
          
          <div className="stat-card">
            <h3>🎸 Bands</h3>
            <div className="stat-number">{stats.total_bands}</div>
          </div>
          
          <div className="stat-card">
            <h3>⭐ Reviews</h3>
            <div className="stat-number">{stats.total_reviews}</div>
          </div>
        </div>
      )}

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        
        <div className="activity-section">
          <h4>Latest Venues</h4>
          <div className="activity-list">
            {stats?.recent_venues.slice(0, 3).map(venue => (
              <div key={venue.id} className="activity-item">
                <span className="activity-name">{venue.name}</span>
                <span className="activity-location">{venue.city}, {venue.county}</span>
                <span className={`activity-status ${venue.verified ? 'verified' : 'pending'}`}>
                  {venue.verified ? '✅' : '⏳'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="activity-section">
          <h4>Latest Users</h4>
          <div className="activity-list">
            {stats?.recent_users.slice(0, 3).map(user => (
              <div key={user.id} className="activity-item">
                <span className="activity-name">{user.name}</span>
                <span className="activity-type">{user.user_type}</span>
                <span className={`activity-status ${user.verified ? 'verified' : 'pending'}`}>
                  {user.verified ? '✅' : '⏳'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderVenues = () => (
    <div className="admin-venues">
      <h2>🏛️ Venue Management</h2>
      
      <div className="venues-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {venues.map(venue => (
              <tr key={venue.id}>
                <td>
                  <strong>{venue.name}</strong>
                  <br />
                  <small>{venue.venue_type}</small>
                </td>
                <td>{venue.city}, {venue.county}</td>
                <td>{venue.capacity || 'N/A'}</td>
                <td>
                  <span className={`status ${venue.verified ? 'verified' : 'pending'}`}>
                    {venue.verified ? 'Verified ✅' : 'Pending ⏳'}
                  </span>
                </td>
                <td className="actions">
                  <button 
                    onClick={() => updateVenue(venue.id, { verified: !venue.verified })}
                    className="btn-small"
                  >
                    {venue.verified ? 'Unverify' : 'Verify'}
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm('Delete this venue?')) {
                        deleteVenue(venue.id);
                      }
                    }}
                    className="btn-small btn-danger"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="admin-users">
      <h2>👥 User Management</h2>
      
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td><strong>{user.name}</strong></td>
                <td>{user.email}</td>
                <td>
                  <span className={`user-type ${user.user_type}`}>
                    {user.user_type === 'band' ? '🎸 Band' : '🏛️ Venue'}
                  </span>
                </td>
                <td>
                  <span className={`status ${user.verified ? 'verified' : 'pending'}`}>
                    {user.verified ? 'Verified ✅' : 'Pending ⏳'}
                  </span>
                </td>
                <td className="actions">
                  <button 
                    onClick={() => updateUser(user.id, { verified: !user.verified })}
                    className="btn-small"
                  >
                    {user.verified ? 'Unverify' : 'Verify'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="admin-reviews">
      <h2>⭐ Review Management</h2>
      
      <div className="reviews-table">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Rating</th>
              <th>Venue</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(review => (
              <tr key={review.id}>
                <td>
                  <strong>{review.title}</strong>
                  <br />
                  <small>{review.review_text.substring(0, 100)}...</small>
                </td>
                <td>
                  <div className="rating">
                    {'⭐'.repeat(review.overall_rating)}
                    <span>({review.overall_rating}/5)</span>
                  </div>
                </td>
                <td>{review.venue_id}</td>
                <td>
                  {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'N/A'}
                </td>
                <td className="actions">
                  <button 
                    onClick={() => {
                      if (window.confirm('Delete this review?')) {
                        deleteReview(review.id);
                      }
                    }}
                    className="btn-small btn-danger"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🛠️ BandVenueReview.ie Admin Panel</h1>
        <button onClick={onLogout} className="btn-logout">Logout</button>
      </div>

      <div className="admin-nav">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={activeTab === 'venues' ? 'active' : ''}
          onClick={() => setActiveTab('venues')}
        >
          🏛️ Venues
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button 
          className={activeTab === 'reviews' ? 'active' : ''}
          onClick={() => setActiveTab('reviews')}
        >
          ⭐ Reviews
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'venues' && renderVenues()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'reviews' && renderReviews()}
      </div>
    </div>
  );
};

export default AdminPanel;
