import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import FeatureManagementTable from './FeatureManagementTable';
import FeatureStatsCard from './FeatureStatsCard';
import AdminFeatureFilters from './AdminFeatureFilters';
import './AdminFeatureDashboard.css';

const AdminFeatureDashboard = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [features, setFeatures] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all',
    sort: 'recent',
    page: 1
  });
  const [loading, setLoading] = useState(true);
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchFeatures();
      fetchStats();
    }
  }, [filters, isAuthenticated, isAdmin]);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const queryParams = new URLSearchParams({
        ...filters,
        limit: '50'
      });

      const response = await fetch(`/api/admin/features?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setFeatures(data.data.features);
      }
    } catch (error) {
      console.error('Error fetching admin features:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/features/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const handleStatusUpdate = async (featureId, newStatus, adminNotes = '') => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/features/${featureId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          admin_notes: adminNotes,
          notify_subscribers: true
        })
      });

      if (response.ok) {
        // Refresh features and stats
        await fetchFeatures();
        await fetchStats();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating feature status:', error);
      return false;
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    if (selectedFeatures.length === 0) return;

    try {
      const token = await user.getIdToken();
      const promises = selectedFeatures.map(featureId =>
        fetch(`/api/admin/features/${featureId}/status`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status,
            notify_subscribers: true
          })
        })
      );

      await Promise.all(promises);
      setSelectedFeatures([]);
      await fetchFeatures();
      await fetchStats();
    } catch (error) {
      console.error('Error bulk updating features:', error);
    }
  };

  const handleDeleteFeature = async (featureId) => {
    if (!window.confirm('Are you sure you want to delete this feature? This action cannot be undone.')) {
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/features/${featureId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchFeatures();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error deleting feature:', error);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handleFeatureSelection = (featureId, isSelected) => {
    if (isSelected) {
      setSelectedFeatures([...selectedFeatures, featureId]);
    } else {
      setSelectedFeatures(selectedFeatures.filter(id => id !== featureId));
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedFeatures(features.map(f => f.id));
    } else {
      setSelectedFeatures([]);
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="admin-access-denied">
        <h2>Access Denied</h2>
        <p>You need admin privileges to access this page.</p>
      </div>
    );
  }

  return (
    <div className="admin-feature-dashboard">
      <div className="admin-header">
        <div className="header-content">
          <h1>Feature Management Dashboard</h1>
          <p>Manage feature requests, bug reports, and user feedback</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => window.open('/api/admin/features/export', '_blank')}
          >
            📊 Export Data
          </button>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <FeatureStatsCard
            title="Total Submissions"
            value={stats.total_features}
            subtitle={`${stats.today_count} today`}
            icon="📝"
            trend={stats.weekly_trend}
          />
          <FeatureStatsCard
            title="Pending Review"
            value={stats.by_status.suggested}
            subtitle="Needs attention"
            icon="⏳"
            color="warning"
          />
          <FeatureStatsCard
            title="In Progress"
            value={stats.by_status.in_progress}
            subtitle="Being worked on"
            icon="🚧"
            color="info"
          />
          <FeatureStatsCard
            title="Completed"
            value={stats.by_status.done}
            subtitle="This month"
            icon="✅"
            color="success"
          />
        </div>
      )}

      <div className="dashboard-content">
        <div className="filters-section">
          <AdminFeatureFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            stats={stats}
          />
        </div>

        <div className="features-section">
          {selectedFeatures.length > 0 && (
            <div className="bulk-actions">
              <span>{selectedFeatures.length} selected</span>
              <div className="bulk-buttons">
                <button onClick={() => handleBulkStatusUpdate('in_progress')}>
                  Mark In Progress
                </button>
                <button onClick={() => handleBulkStatusUpdate('done')}>
                  Mark Completed
                </button>
                <button onClick={() => handleBulkStatusUpdate('rejected')}>
                  Reject
                </button>
                <button onClick={() => setSelectedFeatures([])}>
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading features...</p>
            </div>
          ) : (
            <FeatureManagementTable
              features={features}
              selectedFeatures={selectedFeatures}
              onStatusUpdate={handleStatusUpdate}
              onDelete={handleDeleteFeature}
              onSelectionChange={handleFeatureSelection}
              onSelectAll={handleSelectAll}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFeatureDashboard;
