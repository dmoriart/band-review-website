import React from 'react';
import './FeatureStatsCard.css';

const FeatureStatsCard = ({ title, value, subtitle, trend, icon, color = 'blue' }) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend > 0) {
      return <span className="trend-up">↗ +{trend}%</span>;
    } else if (trend < 0) {
      return <span className="trend-down">↘ {trend}%</span>;
    }
    return <span className="trend-neutral">→ 0%</span>;
  };

  return (
    <div className={`feature-stats-card card-${color}`}>
      <div className="card-header">
        <div className="card-icon">
          {icon || '📊'}
        </div>
        <div className="card-title">
          {title}
        </div>
      </div>
      
      <div className="card-content">
        <div className="card-value">
          {value}
        </div>
        
        {subtitle && (
          <div className="card-subtitle">
            {subtitle}
          </div>
        )}
        
        {trend !== undefined && (
          <div className="card-trend">
            {getTrendIcon()}
          </div>
        )}
      </div>
    </div>
  );
};

// Common stat card configurations
export const StatsCardConfigs = {
  totalFeatures: {
    title: 'Total Features',
    icon: '💡',
    color: 'blue'
  },
  pendingReview: {
    title: 'Pending Review',
    icon: '⏳',
    color: 'yellow'
  },
  inProgress: {
    title: 'In Progress',
    icon: '🚀',
    color: 'green'
  },
  completed: {
    title: 'Completed',
    icon: '✅',
    color: 'green'
  },
  totalVotes: {
    title: 'Total Votes',
    icon: '👍',
    color: 'purple'
  },
  activeUsers: {
    title: 'Active Contributors',
    icon: '👥',
    color: 'blue'
  }
};

export default FeatureStatsCard;
