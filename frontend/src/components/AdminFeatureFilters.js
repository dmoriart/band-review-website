import React from 'react';
import './AdminFeatureFilters.css';

const AdminFeatureFilters = ({ filters, onFiltersChange, onExport, onImport }) => {
  
  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      type: 'all',
      priority: 'all',
      author: '',
      dateRange: 'all',
      sort: 'newest',
      search: ''
    });
  };

  const hasActiveFilters = () => {
    return filters.status !== 'all' || 
           filters.type !== 'all' || 
           filters.priority !== 'all' ||
           filters.author !== '' ||
           filters.dateRange !== 'all' ||
           filters.search !== '';
  };

  return (
    <div className="admin-feature-filters">
      <div className="filters-header">
        <h3>Filters & Search</h3>
        <div className="filter-actions">
          {hasActiveFilters() && (
            <button 
              className="clear-filters-btn"
              onClick={clearFilters}
            >
              Clear All
            </button>
          )}
          <button 
            className="export-btn"
            onClick={onExport}
          >
            📤 Export
          </button>
          <button 
            className="import-btn"
            onClick={onImport}
          >
            📥 Import
          </button>
        </div>
      </div>

      <div className="filters-grid">
        {/* Search */}
        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search features..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="proposed">Proposed</option>
            <option value="reviewing">Reviewing</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
            <option value="declined">Declined</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="filter-group">
          <label>Type</label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="feature">Feature</option>
            <option value="improvement">Improvement</option>
            <option value="bug">Bug Fix</option>
            <option value="integration">Integration</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="filter-group">
          <label>Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Author Filter */}
        <div className="filter-group">
          <label>Author</label>
          <input
            type="text"
            placeholder="Filter by author..."
            value={filters.author || ''}
            onChange={(e) => handleFilterChange('author', e.target.value)}
          />
        </div>

        {/* Date Range Filter */}
        <div className="filter-group">
          <label>Date Range</label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="filter-group">
          <label>Sort By</label>
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="votes">Most Voted</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
            <option value="author">Author</option>
          </select>
        </div>

        {/* Quick Filter Buttons */}
        <div className="filter-group quick-filters">
          <label>Quick Filters</label>
          <div className="quick-filter-buttons">
            <button 
              className={filters.status === 'proposed' ? 'active' : ''}
              onClick={() => handleFilterChange('status', 'proposed')}
            >
              New Proposals
            </button>
            <button 
              className={filters.priority === 'high' ? 'active' : ''}
              onClick={() => handleFilterChange('priority', 'high')}
            >
              High Priority
            </button>
            <button 
              className={filters.status === 'in-progress' ? 'active' : ''}
              onClick={() => handleFilterChange('status', 'in-progress')}
            >
              In Progress
            </button>
            <button 
              className={filters.dateRange === 'week' ? 'active' : ''}
              onClick={() => handleFilterChange('dateRange', 'week')}
            >
              This Week
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="active-filters-summary">
          <span className="summary-label">Active Filters:</span>
          <div className="active-filters-list">
            {filters.status !== 'all' && (
              <span className="filter-tag">
                Status: {filters.status}
                <button onClick={() => handleFilterChange('status', 'all')}>×</button>
              </span>
            )}
            {filters.type !== 'all' && (
              <span className="filter-tag">
                Type: {filters.type}
                <button onClick={() => handleFilterChange('type', 'all')}>×</button>
              </span>
            )}
            {filters.priority !== 'all' && (
              <span className="filter-tag">
                Priority: {filters.priority}
                <button onClick={() => handleFilterChange('priority', 'all')}>×</button>
              </span>
            )}
            {filters.search && (
              <span className="filter-tag">
                Search: "{filters.search}"
                <button onClick={() => handleFilterChange('search', '')}>×</button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeatureFilters;
