import React from 'react';
import './FeatureManagementTable.css';

const FeatureManagementTable = ({ 
  features, 
  selectedFeatures, 
  onSelectFeature, 
  onSelectAll, 
  onStatusChange, 
  onPriorityChange,
  onFeatureClick 
}) => {
  
  const getStatusColor = (status) => {
    const colors = {
      'proposed': '#fbbf24',
      'reviewing': '#60a5fa', 
      'in-progress': '#34d399',
      'done': '#10b981',
      'declined': '#f87171'
    };
    return colors[status] || '#9ca3af';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': '#9ca3af',
      'medium': '#fbbf24',
      'high': '#f87171',
      'critical': '#dc2626'
    };
    return colors[priority] || '#9ca3af';
  };

  return (
    <div className="feature-management-table">
      <div className="table-header">
        <div className="table-actions">
          <label className="select-all-checkbox">
            <input
              type="checkbox"
              checked={selectedFeatures.length === features.length && features.length > 0}
              onChange={onSelectAll}
            />
            Select All ({selectedFeatures.length})
          </label>
        </div>
      </div>

      <div className="table-container">
        <table className="features-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Votes</th>
              <th>Author</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {features.map(feature => (
              <tr 
                key={feature.id} 
                className={selectedFeatures.includes(feature.id) ? 'selected' : ''}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(feature.id)}
                    onChange={() => onSelectFeature(feature.id)}
                  />
                </td>
                <td 
                  className="feature-title"
                  onClick={() => onFeatureClick(feature.id)}
                >
                  <div className="title-content">
                    <span className="title">{feature.title}</span>
                    <span className="description-preview">
                      {feature.description?.substring(0, 100)}...
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`type-badge type-${feature.type}`}>
                    {feature.type}
                  </span>
                </td>
                <td>
                  <select
                    value={feature.status}
                    onChange={(e) => onStatusChange(feature.id, e.target.value)}
                    className="status-select"
                    style={{ borderColor: getStatusColor(feature.status) }}
                  >
                    <option value="proposed">Proposed</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                    <option value="declined">Declined</option>
                  </select>
                </td>
                <td>
                  <select
                    value={feature.priority || 'medium'}
                    onChange={(e) => onPriorityChange(feature.id, e.target.value)}
                    className="priority-select"
                    style={{ borderColor: getPriorityColor(feature.priority) }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </td>
                <td>
                  <span className="vote-count">
                    👍 {feature.upvotes_count || 0}
                  </span>
                </td>
                <td>
                  <div className="author-info">
                    <span className="author-name">{feature.author_name || 'Anonymous'}</span>
                    <span className="author-email">{feature.author_email}</span>
                  </div>
                </td>
                <td>
                  <span className="created-date">
                    {new Date(feature.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="view-btn"
                      onClick={() => onFeatureClick(feature.id)}
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {features.length === 0 && (
        <div className="empty-state">
          <p>No features found matching current filters.</p>
        </div>
      )}
    </div>
  );
};

export default FeatureManagementTable;
