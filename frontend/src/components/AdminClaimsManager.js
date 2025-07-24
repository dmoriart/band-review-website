import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import './AdminClaimsManager.css';

const AdminClaimsManager = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedClaim, setSelectedClaim] = useState(null);

  useEffect(() => {
    if (user) {
      fetchClaims();
    }
  }, [user, filter]);

  const fetchClaims = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/claims/pending?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setClaims(data.data.claims);
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReview = async (claimId, action, reviewData) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/claims/${claimId}/review`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          ...reviewData
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh claims list
        fetchClaims();
        setSelectedClaim(null);
      } else {
        alert('Error: ' + data.error.message);
      }
    } catch (error) {
      console.error('Error reviewing claim:', error);
      alert('Failed to review claim. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="admin-claims-manager">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading claims...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-claims-manager">
      <div className="claims-header">
        <h1>Venue Claims Management</h1>
        <p>Review and approve venue ownership claims</p>
      </div>

      <div className="claims-filters">
        <button 
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({claims.filter(c => c.status === 'pending').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'requires_verification' ? 'active' : ''}`}
          onClick={() => setFilter('requires_verification')}
        >
          Needs Verification ({claims.filter(c => c.status === 'requires_verification').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Claims ({claims.length})
        </button>
      </div>

      <div className="claims-content">
        <div className="claims-list">
          {claims.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No Claims Found</h3>
              <p>No {filter} claims at the moment.</p>
            </div>
          ) : (
            claims.map(claim => (
              <ClaimCard 
                key={claim.id} 
                claim={claim} 
                onSelect={() => setSelectedClaim(claim)}
                isSelected={selectedClaim?.id === claim.id}
              />
            ))
          )}
        </div>

        {selectedClaim && (
          <ClaimReviewPanel 
            claim={selectedClaim}
            onClose={() => setSelectedClaim(null)}
            onReview={handleClaimReview}
          />
        )}
      </div>
    </div>
  );
};

const ClaimCard = ({ claim, onSelect, isSelected }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#fdcb6e';
      case 'approved': return '#00b894';
      case 'rejected': return '#d63031';
      case 'requires_verification': return '#74b9ff';
      default: return '#636e72';
    }
  };

  const getPriorityScore = (claim) => {
    let score = 0;
    
    // Recent submissions get higher priority
    const daysSinceSubmission = (Date.now() - new Date(claim.submitted_at)) / (1000 * 60 * 60 * 24);
    if (daysSinceSubmission > 7) score += 2;
    
    // Claims with verification data get higher priority
    if (claim.verification_data?.phone) score += 1;
    if (claim.verification_data?.website) score += 1;
    
    // Ownership claims vs management claims
    if (claim.claim_type === 'ownership') score += 1;
    
    return score;
  };

  const priorityScore = getPriorityScore(claim);

  return (
    <div 
      className={`claim-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="claim-card-header">
        <div className="claim-venue">
          <h3>{claim.venue_name}</h3>
          <span className="claim-id">#{claim.id}</span>
        </div>
        <div className="claim-badges">
          {priorityScore >= 3 && (
            <span className="priority-badge high">High Priority</span>
          )}
          <span 
            className="status-badge"
            style={{ backgroundColor: getStatusColor(claim.status) }}
          >
            {claim.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="claim-info">
        <div className="claim-user">
          <strong>Claimant:</strong> {claim.user_display_name} ({claim.user_email})
        </div>
        <div className="claim-type">
          <strong>Type:</strong> {claim.claim_type}
        </div>
        <div className="claim-submitted">
          <strong>Submitted:</strong> {new Date(claim.submitted_at).toLocaleDateString()}
        </div>
      </div>

      <div className="claim-verification">
        <div className="verification-items">
          {claim.verification_data?.phone && (
            <span className="verification-item verified">📞 Phone</span>
          )}
          {claim.verification_data?.website && (
            <span className="verification-item verified">🌐 Website</span>
          )}
          {claim.verification_data?.social_facebook && (
            <span className="verification-item verified">📘 Facebook</span>
          )}
          {claim.verification_data?.social_instagram && (
            <span className="verification-item verified">📷 Instagram</span>
          )}
          {claim.business_documents?.length > 0 && (
            <span className="verification-item verified">📄 Documents</span>
          )}
        </div>
      </div>

      {claim.additional_notes && (
        <div className="claim-preview">
          <p>"{claim.additional_notes.substring(0, 100)}..."</p>
        </div>
      )}
    </div>
  );
};

const ClaimReviewPanel = ({ claim, onClose, onReview }) => {
  const [reviewData, setReviewData] = useState({
    admin_notes: '',
    granted_role: 'owner',
    granted_permissions: ['edit', 'respond_to_reviews'],
    rejection_reason: ''
  });
  const [action, setAction] = useState('');

  const availablePermissions = [
    'edit',
    'respond_to_reviews', 
    'manage_staff',
    'view_analytics',
    'manage_events',
    'upload_images'
  ];

  const handlePermissionToggle = (permission) => {
    setReviewData(prev => ({
      ...prev,
      granted_permissions: prev.granted_permissions.includes(permission)
        ? prev.granted_permissions.filter(p => p !== permission)
        : [...prev.granted_permissions, permission]
    }));
  };

  const handleSubmitReview = () => {
    if (!action) return;
    
    if (action === 'reject' && !reviewData.rejection_reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    onReview(claim.id, action, reviewData);
  };

  return (
    <div className="claim-review-panel">
      <div className="panel-header">
        <h2>Review Claim #{claim.id}</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="panel-content">
        <div className="claim-details-full">
          <h3>{claim.venue_name}</h3>
          
          <div className="detail-section">
            <h4>Claimant Information</h4>
            <p><strong>Name:</strong> {claim.user_display_name}</p>
            <p><strong>Email:</strong> {claim.user_email}</p>
            <p><strong>Claim Type:</strong> {claim.claim_type}</p>
            <p><strong>Submitted:</strong> {new Date(claim.submitted_at).toLocaleString()}</p>
          </div>

          <div className="detail-section">
            <h4>Verification Data</h4>
            {claim.verification_data?.phone && (
              <p><strong>Phone:</strong> {claim.verification_data.phone}</p>
            )}
            {claim.verification_data?.website && (
              <p><strong>Website:</strong> 
                <a href={claim.verification_data.website} target="_blank" rel="noopener noreferrer">
                  {claim.verification_data.website}
                </a>
              </p>
            )}
            {claim.verification_data?.social_facebook && (
              <p><strong>Facebook:</strong> 
                <a href={claim.verification_data.social_facebook} target="_blank" rel="noopener noreferrer">
                  {claim.verification_data.social_facebook}
                </a>
              </p>
            )}
            {claim.verification_data?.social_instagram && (
              <p><strong>Instagram:</strong> {claim.verification_data.social_instagram}</p>
            )}
          </div>

          {claim.business_documents?.length > 0 && (
            <div className="detail-section">
              <h4>Business Documents</h4>
              {claim.business_documents.map((doc, index) => (
                <p key={index}>
                  <a href={doc} target="_blank" rel="noopener noreferrer">
                    Document {index + 1}
                  </a>
                </p>
              ))}
            </div>
          )}

          <div className="detail-section">
            <h4>Additional Notes</h4>
            <p>{claim.additional_notes}</p>
          </div>
        </div>

        <div className="review-form">
          <h4>Review Decision</h4>
          
          <div className="action-buttons">
            <button 
              className={`action-btn approve ${action === 'approve' ? 'active' : ''}`}
              onClick={() => setAction('approve')}
            >
              ✅ Approve
            </button>
            <button 
              className={`action-btn verification ${action === 'require_verification' ? 'active' : ''}`}
              onClick={() => setAction('require_verification')}
            >
              📋 Require Verification
            </button>
            <button 
              className={`action-btn reject ${action === 'reject' ? 'active' : ''}`}
              onClick={() => setAction('reject')}
            >
              ❌ Reject
            </button>
          </div>

          {action === 'approve' && (
            <div className="approval-options">
              <div className="form-group">
                <label>Granted Role:</label>
                <select 
                  value={reviewData.granted_role}
                  onChange={(e) => setReviewData(prev => ({
                    ...prev,
                    granted_role: e.target.value
                  }))}
                >
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                  <option value="editor">Editor</option>
                </select>
              </div>

              <div className="form-group">
                <label>Permissions:</label>
                <div className="permissions-grid">
                  {availablePermissions.map(permission => (
                    <label key={permission} className="permission-checkbox">
                      <input
                        type="checkbox"
                        checked={reviewData.granted_permissions.includes(permission)}
                        onChange={() => handlePermissionToggle(permission)}
                      />
                      {permission.replace('_', ' ')}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {action === 'reject' && (
            <div className="form-group">
              <label>Rejection Reason:</label>
              <textarea
                value={reviewData.rejection_reason}
                onChange={(e) => setReviewData(prev => ({
                  ...prev,
                  rejection_reason: e.target.value
                }))}
                placeholder="Explain why this claim is being rejected..."
                rows={4}
              />
            </div>
          )}

          <div className="form-group">
            <label>Admin Notes:</label>
            <textarea
              value={reviewData.admin_notes}
              onChange={(e) => setReviewData(prev => ({
                ...prev,
                admin_notes: e.target.value
              }))}
              placeholder="Internal notes about this review..."
              rows={3}
            />
          </div>

          <div className="review-actions">
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="btn-primary" 
              onClick={handleSubmitReview}
              disabled={!action}
            >
              Submit Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminClaimsManager;
