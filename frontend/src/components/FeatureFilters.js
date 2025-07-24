import React from 'react';
import './FeatureFilters.css';

const FeatureFilters = ({ filters, availableTags, onFilterChange }) => {
  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const handleTagToggle = (tag) => {
    const currentTags = filters.tags ? filters.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    let newTags;
    
    if (currentTags.includes(tag)) {
      newTags = currentTags.filter(t => t !== tag);
    } else {
      newTags = [...currentTags, tag];
    }
    
    onFilterChange({ tags: newTags.join(',') });
  };

  const clearFilters = () => {
    onFilterChange({
      type: 'all',
      status: 'all',
      sort: 'upvotes',
      tags: ''
    });
  };

  const selectedTags = filters.tags ? filters.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const hasActiveFilters = filters.type !== 'all' || filters.status !== 'all' || filters.tags;

  return (
    <div className="feature-filters">
      <div className="filters-header">
        <h3>Filters</h3>
        {hasActiveFilters && (
          <button className="clear-filters" onClick={clearFilters}>
            Clear all
          </button>
        )}
      </div>

      <div className="filter-group">
        <label>Type</label>
        <select
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="filter-select"
        >
          <option value="all">All Types</option>
          <option value="feature">Features Only</option>
          <option value="bug">Bugs Only</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Status</label>
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="suggested">Suggested</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Sort by</label>
        <select
          value={filters.sort}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
          className="filter-select"
        >
          <option value="upvotes">Most Votes</option>
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {availableTags && availableTags.length > 0 && (
        <div className="filter-group">
          <label>Tags</label>
          <div className="tag-filters">
            {availableTags.map(tag => (
              <button
                key={tag}
                className={`tag-filter ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="filter-summary">
        <p>
          Showing {filters.type !== 'all' ? filters.type + 's' : 'items'} 
          {filters.status !== 'all' && ` that are ${filters.status.replace('_', ' ')}`}
          {selectedTags.length > 0 && ` tagged with ${selectedTags.join(', ')}`}
        </p>
      </div>
    </div>
  );
};

export default FeatureFilters;
