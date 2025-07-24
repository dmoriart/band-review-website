import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import VotingButton from './VotingButton';
import StatusBadge from './StatusBadge';
import './FeatureCard.css';

const FeatureCard = ({ 
  feature, 
  isExpanded, 
  onToggleExpanded, 
  onVoteChange, 
  userIsAuthenticated 
}) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async () => {
    if (!userIsAuthenticated) return;

    setSubscribing(true);
    try {
      const token = await user.getIdToken();
      const method = feature.user_is_subscribed ? 'DELETE' : 'POST';
      
      const response = await fetch(`/api/features/${feature.id}/subscribe`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: method === 'POST' ? JSON.stringify({
          notify_email: true,
          notify_in_app: true
        }) : undefined
      });

      if (response.ok) {
        // Update local state - this would ideally come from parent component
        feature.user_is_subscribed = !feature.user_is_subscribed;
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
    } finally {
      setSubscribing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTypeIcon = (type) => {
    return type === 'bug' ? '🐛' : '💡';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      critical: '#dc3545'
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div className={`feature-card ${feature.type} ${isExpanded ? 'expanded' : ''}`}>
      <div className="feature-card-header">
        <div className="feature-meta">
          <span className="feature-type-icon">{getTypeIcon(feature.type)}</span>
          <StatusBadge status={feature.status} />
          <span 
            className="feature-priority"
            style={{ color: getPriorityColor(feature.priority) }}
          >
            {feature.priority}
          </span>
        </div>
        
        <div className="feature-actions">
          <VotingButton
            featureId={feature.id}
            upvotesCount={feature.upvotes_count}
            userHasVoted={feature.user_has_voted}
            userIsAuthenticated={userIsAuthenticated}
            onVoteChange={onVoteChange}
          />
        </div>
      </div>

      <div className="feature-card-content">
        <h3 className="feature-title" onClick={onToggleExpanded}>
          {feature.title}
          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        </h3>

        <div className="feature-description">
          {isExpanded ? (
            <div className="full-description">
              <p>{feature.description}</p>
              
              {feature.tags && feature.tags.length > 0 && (
                <div className="feature-tags">
                  {feature.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="short-description">
              {feature.description.length > 150 
                ? `${feature.description.substring(0, 150)}...`
                : feature.description
              }
            </p>
          )}
        </div>

        {isExpanded && (
          <div className="feature-details">
            <div className="feature-author">
              <span>Suggested by {feature.author.name}</span>
              <span className="date">{formatDate(feature.created_at)}</span>
            </div>

            {feature.completed_at && (
              <div className="completion-info">
                <span>✅ Completed on {formatDate(feature.completed_at)}</span>
                {feature.completed_by && (
                  <span>by {feature.completed_by}</span>
                )}
              </div>
            )}

            <div className="feature-stats">
              <button 
                className="comments-toggle"
                onClick={() => setShowComments(!showComments)}
              >
                💬 {feature.comments_count} {feature.comments_count === 1 ? 'comment' : 'comments'}
              </button>
              
              {userIsAuthenticated && (
                <button
                  className={`subscribe-button ${feature.user_is_subscribed ? 'subscribed' : ''}`}
                  onClick={handleSubscribe}
                  disabled={subscribing}
                >
                  {subscribing ? '...' : (
                    feature.user_is_subscribed ? '🔔 Subscribed' : '🔕 Subscribe'
                  )}
                </button>
              )}
            </div>

            {showComments && (
              <div className="comments-section">
                <p>Comments section would be loaded here...</p>
                {/* This would load the CommentsSection component */}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureCard;
