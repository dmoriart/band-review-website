import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import './VotingButton.css';

const VotingButton = ({ 
  featureId, 
  upvotesCount, 
  userHasVoted, 
  userIsAuthenticated, 
  onVoteChange 
}) => {
  const { user } = useAuth();
  const [voting, setVoting] = useState(false);
  const [animating, setAnimating] = useState(false);

  const handleVote = async () => {
    if (!userIsAuthenticated) {
      // Could show login modal here
      alert('Please log in to vote on features');
      return;
    }

    setVoting(true);
    setAnimating(true);

    try {
      const token = await user.getIdToken();
      
      if (userHasVoted) {
        // Remove vote
        const response = await fetch(`/api/features/${featureId}/vote`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const newCount = upvotesCount - 1;
          onVoteChange(featureId, newCount, false);
        }
      } else {
        // Add vote
        const response = await fetch(`/api/features/${featureId}/vote`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ vote_type: 'upvote' })
        });

        if (response.ok) {
          const newCount = upvotesCount + 1;
          onVoteChange(featureId, newCount, true);
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to vote. Please try again.');
    } finally {
      setVoting(false);
      setTimeout(() => setAnimating(false), 300);
    }
  };

  return (
    <button
      className={`voting-button ${userHasVoted ? 'voted' : ''} ${animating ? 'animating' : ''}`}
      onClick={handleVote}
      disabled={voting || !userIsAuthenticated}
      title={userIsAuthenticated 
        ? (userHasVoted ? 'Remove your vote' : 'Vote for this feature')
        : 'Login to vote'
      }
    >
      <div className="vote-icon">
        {userHasVoted ? '❤️' : '🤍'}
      </div>
      <div className="vote-count">
        {upvotesCount}
      </div>
      {voting && <div className="vote-spinner">⏳</div>}
    </button>
  );
};

export default VotingButton;
