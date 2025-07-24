import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import './VenueClaimButton.css';

const VenueClaimButton = ({ venue, onClaimSubmitted }) => {
  const { user } = useAuth();
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimStatus, setClaimStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userCanClaim, setUserCanClaim] = useState(false);

  useEffect(() => {
    if (user && venue) {
      checkClaimEligibility();
    }
  }, [user, venue]);

  const checkClaimEligibility = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/venues/${venue.slug}/claim-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setClaimStatus(data.data.claim_status);
        setUserCanClaim(data.data.can_claim);
      }
    } catch (error) {
      console.error('Error checking claim eligibility:', error);
    }
  };

  const handleClaimClick = () => {
    if (!user) {
      // Redirect to login or show login modal
      alert('Please log in to claim this venue');
      return;
    }
    setShowClaimForm(true);
  };

  const renderClaimStatus = () => {
    if (!claimStatus) return null;

    const statusConfig = {
      pending: {
        text: 'Claim Pending Review',
        icon: '⏳',
        className: 'claim-status-pending'
      },
      approved: {
        text: 'You Own This Venue',
        icon: '✅',
        className: 'claim-status-approved'
      },
      rejected: {
        text: 'Claim Rejected',
        icon: '❌',
        className: 'claim-status-rejected'
      }
    };

    const config = statusConfig[claimStatus.status];
    if (!config) return null;

    return (
      <div className={`claim-status ${config.className}`}>
        <span className="claim-status-icon">{config.icon}</span>
        <span className="claim-status-text">{config.text}</span>
        {claimStatus.status === 'pending' && (
          <span className="claim-status-date">
            Submitted {new Date(claimStatus.submitted_at).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  };

  if (claimStatus) {
    return renderClaimStatus();
  }

  if (!userCanClaim) {
    return null; // Don't show claim button if user can't claim
  }

  return (
    <div className="venue-claim-button">
      <button 
        className="claim-button"
        onClick={handleClaimClick}
        disabled={loading}
      >
        <span className="claim-icon">🏛️</span>
        Claim This Venue
      </button>

      {showClaimForm && (
        <VenueClaimModal
          venue={venue}
          onClose={() => setShowClaimForm(false)}
          onSubmitted={(claim) => {
            setClaimStatus(claim);
            setShowClaimForm(false);
            onClaimSubmitted && onClaimSubmitted(claim);
          }}
        />
      )}
    </div>
  );
};

const VenueClaimModal = ({ venue, onClose, onSubmitted }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    claim_type: 'ownership',
    verification_data: {
      website: '',
      phone: '',
      social_facebook: '',
      social_instagram: ''
    },
    additional_notes: '',
    business_documents: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    if (field.startsWith('verification_data.')) {
      const subField = field.replace('verification_data.', '');
      setFormData(prev => ({
        ...prev,
        verification_data: {
          ...prev.verification_data,
          [subField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.verification_data.phone) {
      newErrors['verification_data.phone'] = 'Phone number is required for verification';
    }

    if (!formData.additional_notes.trim()) {
      newErrors.additional_notes = 'Please explain why you should own this venue';
    } else if (formData.additional_notes.length < 50) {
      newErrors.additional_notes = 'Please provide more details (minimum 50 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/venues/${venue.slug}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        onSubmitted(data.data.claim);
      } else {
        setErrors({ submit: data.error.message });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to submit claim. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="venue-claim-modal-overlay">
      <div className="venue-claim-modal">
        <div className="modal-header">
          <h2>Claim {venue.name}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="claim-info">
            <p>To claim this venue, please provide verification information and explain your relationship to the venue.</p>
            <p><strong>Note:</strong> All claims are reviewed by our team. False claims may result in account suspension.</p>
          </div>

          <form onSubmit={handleSubmit} className="claim-form">
            <div className="form-group">
              <label htmlFor="claim_type">Claim Type</label>
              <select
                id="claim_type"
                value={formData.claim_type}
                onChange={(e) => handleChange('claim_type', e.target.value)}
                className="form-control"
              >
                <option value="ownership">I own this venue</option>
                <option value="management">I manage this venue</option>
              </select>
            </div>

            <div className="verification-section">
              <h3>Verification Information</h3>
              
              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.verification_data.phone}
                  onChange={(e) => handleChange('verification_data.phone', e.target.value)}
                  className={`form-control ${errors['verification_data.phone'] ? 'error' : ''}`}
                  placeholder="+353 1 234 5678"
                />
                {errors['verification_data.phone'] && (
                  <span className="error-message">{errors['verification_data.phone']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="website">Official Website</label>
                <input
                  type="url"
                  id="website"
                  value={formData.verification_data.website}
                  onChange={(e) => handleChange('verification_data.website', e.target.value)}
                  className="form-control"
                  placeholder="https://venue.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="facebook">Facebook Page</label>
                <input
                  type="url"
                  id="facebook"
                  value={formData.verification_data.social_facebook}
                  onChange={(e) => handleChange('verification_data.social_facebook', e.target.value)}
                  className="form-control"
                  placeholder="https://facebook.com/venue"
                />
              </div>

              <div className="form-group">
                <label htmlFor="instagram">Instagram Handle</label>
                <input
                  type="text"
                  id="instagram"
                  value={formData.verification_data.social_instagram}
                  onChange={(e) => handleChange('verification_data.social_instagram', e.target.value)}
                  className="form-control"
                  placeholder="@venue_handle"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Additional Information *</label>
              <textarea
                id="notes"
                value={formData.additional_notes}
                onChange={(e) => handleChange('additional_notes', e.target.value)}
                className={`form-control ${errors.additional_notes ? 'error' : ''}`}
                rows={4}
                placeholder="Please explain your relationship to this venue and why you should be granted ownership/management access. Include any additional verification details."
              />
              {errors.additional_notes && (
                <span className="error-message">{errors.additional_notes}</span>
              )}
              <div className="character-count">
                {formData.additional_notes.length}/500 characters
              </div>
            </div>

            {errors.submit && (
              <div className="error-message submit-error">{errors.submit}</div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Claim'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VenueClaimButton;
