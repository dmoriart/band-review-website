import React, { useState } from 'react';
import FeatureCard from './FeatureCard';
import './FeatureList.css';

const FeatureList = ({ features, onVoteChange, userIsAuthenticated }) => {
  const [expandedFeature, setExpandedFeature] = useState(null);

  const handleToggleExpanded = (featureId) => {
    setExpandedFeature(expandedFeature === featureId ? null : featureId);
  };

  if (!features || features.length === 0) {
    return (
      <div className="feature-list-empty">
        <div className="empty-state">
          <div className="empty-icon">💡</div>
          <h3>No features found</h3>
          <p>Be the first to suggest a new feature or report a bug!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-list">
      <div className="feature-list-header">
        <h3>{features.length} {features.length === 1 ? 'item' : 'items'} found</h3>
      </div>
      
      <div className="feature-cards">
        {features.map(feature => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            isExpanded={expandedFeature === feature.id}
            onToggleExpanded={() => handleToggleExpanded(feature.id)}
            onVoteChange={onVoteChange}
            userIsAuthenticated={userIsAuthenticated}
          />
        ))}
      </div>
    </div>
  );
};

export default FeatureList;
