import React from 'react';
import { getMajorCitiesForDropdown } from '../utils/irishLocations';
import './GigsFilters.css';

interface GigsFiltersProps {
  filters: {
    searchQuery: string;
    selectedCity: string;
    selectedGenre: string;
    dateRange: string;
    ageRestriction: string;
    priceRange: string;
    status: string;
  };
  onFiltersChange: (filters: any) => void;
  totalGigs: number;
}

const GigsFilters: React.FC<GigsFiltersProps> = ({ filters, onFiltersChange, totalGigs }) => {
  const cities = getMajorCitiesForDropdown();
  
  const genres = [
    'Rock', 'Pop', 'Folk', 'Traditional Irish', 'Celtic', 'Country', 'Blues', 
    'Jazz', 'Classical', 'Electronic', 'Hip Hop', 'Indie', 'Alternative', 
    'Metal', 'Punk', 'Reggae'
  ];

  const updateFilter = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchQuery: '',
      selectedCity: '',
      selectedGenre: '',
      dateRange: 'all',
      ageRestriction: '',
      priceRange: '',
      status: 'upcoming'
    });
  };

  const hasActiveFilters = filters.searchQuery || filters.selectedCity || filters.selectedGenre || 
                          filters.dateRange !== 'all' || filters.ageRestriction || filters.priceRange ||
                          filters.status !== 'upcoming';

  return (
    <div className="gigs-filters">
      <div className="filters-header">
        <h3>🔍 Filter Gigs ({totalGigs} found)</h3>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="clear-filters-btn">
            Clear All Filters
          </button>
        )}
      </div>

      <div className="filters-grid">
        {/* Search */}
        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search gigs, bands, venues..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className="filter-input"
          />
        </div>

        {/* Location */}
        <div className="filter-group">
          <label>Location</label>
          <select
            value={filters.selectedCity}
            onChange={(e) => updateFilter('selectedCity', e.target.value)}
            className="filter-select"
            title="Location"
            aria-label="Location"
          >
            <option value="">All Locations</option>
            {cities.map(city => (
              <option key={city.value} value={city.value}>
                {city.label}
              </option>
            ))}
          </select>
        </div>

        {/* Genre */}
        <div className="filter-group">
          <label>Genre</label>
          <select
            value={filters.selectedGenre}
            onChange={(e) => updateFilter('selectedGenre', e.target.value)}
            className="filter-select"
            aria-label="Genre"
            title="Genre"
          >
            <option value="">All Genres</option>
            {genres.map(genre => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="filter-group">
          <label>When</label>
          <select
            value={filters.dateRange}
            onChange={(e) => updateFilter('dateRange', e.target.value)}
            className="filter-select"
            aria-label="Date Range"
            title="Date Range"
          >
            <option value="all">Anytime</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        {/* Age Restriction */}
        <div className="filter-group">
          <label>Age</label>
          <select
            value={filters.ageRestriction}
            onChange={(e) => updateFilter('ageRestriction', e.target.value)}
            className="filter-select"
            title="Age Restriction"
            aria-label="Age Restriction"
          >
            <option value="">Any Age</option>
            <option value="all_ages">All Ages</option>
            <option value="16_plus">16+</option>
            <option value="18_plus">18+</option>
            <option value="21_plus">21+</option>
          </select>
        </div>

        {/* Price Range */}
        <div className="filter-group">
          <label>Price (€)</label>
          <select
            value={filters.priceRange}
            onChange={(e) => updateFilter('priceRange', e.target.value)}
            className="filter-select"
            aria-label="Filter by price range"
          >
            <option value="">Any Price</option>
            <option value="0-0">Free</option>
            <option value="0-10">Under €10</option>
            <option value="10-25">€10 - €25</option>
            <option value="25-50">€25 - €50</option>
            <option value="50-100">€50 - €100</option>
            <option value="100">€100+</option>
          </select>
        </div>

        {/* Status */}
        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="filter-select"
            aria-label="Filter by event status"
          >
            <option value="upcoming">Upcoming</option>
            <option value="all">All Events</option>
            <option value="sold_out">Sold Out</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Past Events</option>
          </select>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="quick-filters">
        <h4>Quick Filters</h4>
        <div className="quick-filter-buttons">
          <button 
            onClick={() => updateFilter('dateRange', 'today')}
            className={`quick-filter-btn ${filters.dateRange === 'today' ? 'active' : ''}`}
          >
            🌟 Tonight
          </button>
          <button 
            onClick={() => updateFilter('dateRange', 'week')}
            className={`quick-filter-btn ${filters.dateRange === 'week' ? 'active' : ''}`}
          >
            📅 This Week
          </button>
          <button 
            onClick={() => updateFilter('priceRange', '0-0')}
            className={`quick-filter-btn ${filters.priceRange === '0-0' ? 'active' : ''}`}
          >
            🆓 Free Gigs
          </button>
          <button 
            onClick={() => updateFilter('ageRestriction', 'all_ages')}
            className={`quick-filter-btn ${filters.ageRestriction === 'all_ages' ? 'active' : ''}`}
          >
            👨‍👩‍👧‍👦 All Ages
          </button>
          <button 
            onClick={() => updateFilter('selectedCity', 'Dublin')}
            className={`quick-filter-btn ${filters.selectedCity === 'Dublin' ? 'active' : ''}`}
          >
            🏛️ Dublin
          </button>
          <button 
            onClick={() => updateFilter('selectedCity', 'Cork')}
            className={`quick-filter-btn ${filters.selectedCity === 'Cork' ? 'active' : ''}`}
          >
            🌊 Cork
          </button>
        </div>
      </div>
    </div>
  );
};

export default GigsFilters;
