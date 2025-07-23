import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { ApiClient } from '../services/apiClient';
import './BandClaimModal.css';

interface BandClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  band: {
    _id: string;
    name: string;
  };
  onClaimSubmitted: () => void;
}

const BandClaimModalV2: React.FC<BandClaimModalProps> = ({
  isOpen,
  onClose,
  band,
  onClaimSubmitted
}) => {
  const { user } = useAuth();
  const [claimMethod, setClaimMethod] = useState<'email' | 'social' | 'manual'>('email');
  const [email, setEmail] = useState('');
  const [socialPlatform, setSocialPlatform] = useState('instagram');
  const [socialPostUrl, setSocialPostUrl] = useState('');
  const [description, setDescription] = useState('');
  const [supportingLinks, setSupportingLinks] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verificationCode] = useState(() => 
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to claim a band');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare claim data based on method
      const claimData: any = {
        bandName: band.name,
        claimMethod,
      };

      if (claimMethod === 'email') {
        if (!email.trim()) {
          setError('Email is required for email verification');
          return;
        }
        claimData.email = email.trim();
      } else if (claimMethod === 'social') {
        if (!socialPostUrl.trim()) {
          setError('Social media post URL is required');
          return;
        }
        claimData.socialProof = {
          platform: socialPlatform,
          postUrl: socialPostUrl.trim(),
          verificationCode: verificationCode
        };
      } else if (claimMethod === 'manual') {
        if (!description.trim()) {
          setError('Description is required for manual verification');
          return;
        }
        const filteredLinks = supportingLinks.filter(link => link.trim() !== '');
        claimData.manualData = {
          description: description.trim(),
          supportingLinks: filteredLinks
        };
      }

      console.log('🔄 Submitting band claim via API...');
      
      // Submit via API instead of direct Firestore
      const result = await ApiClient.submitBandClaim(band._id, claimData);
      
      console.log('✅ Band claim submitted successfully:', result);
      setSuccess(true);
      
      setTimeout(() => {
        onClaimSubmitted();
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('❌ Band claim submission error:', err);
      setError(err.message || 'Failed to submit claim');
    } finally {
      setLoading(false);
    }
  };

  const addSupportingLink = () => {
    setSupportingLinks([...supportingLinks, '']);
  };

  const updateSupportingLink = (index: number, value: string) => {
    const newLinks = [...supportingLinks];
    newLinks[index] = value;
    setSupportingLinks(newLinks);
  };

  const removeSupportingLink = (index: number) => {
    setSupportingLinks(supportingLinks.filter((_, i) => i !== index));
  };

  if (success) {
    return (
      <div className="modal-overlay">
        <div className="modal-content band-claim-modal">
          <div className="success-message">
            <h2>✅ Claim Submitted Successfully!</h2>
            <p>Your band ownership claim has been submitted for review.</p>
            <p>You'll be notified once it's been processed by our admin team.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content band-claim-modal">
        <div className="modal-header">
          <h2>Claim Band Ownership</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="band-info">
          <h3>{band.name}</h3>
          <p>Choose how you'd like to verify your ownership of this band:</p>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="claim-methods">
            <div className="method-tabs">
              <button
                type="button"
                className={`method-tab ${claimMethod === 'email' ? 'active' : ''}`}
                onClick={() => setClaimMethod('email')}
              >
                📧 Email Verification
              </button>
              <button
                type="button"
                className={`method-tab ${claimMethod === 'social' ? 'active' : ''}`}
                onClick={() => setClaimMethod('social')}
              >
                📱 Social Media Proof
              </button>
              <button
                type="button"
                className={`method-tab ${claimMethod === 'manual' ? 'active' : ''}`}
                onClick={() => setClaimMethod('manual')}
              >
                📝 Manual Review
              </button>
            </div>

            <div className="method-content">
              {claimMethod === 'email' && (
                <div className="method-section">
                  <h4>Email Verification</h4>
                  <p>We'll send a verification email to an official band email address.</p>
                  <div className="form-group">
                    <label htmlFor="email">Official Band Email:</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="band@example.com"
                      required
                    />
                  </div>
                </div>
              )}

              {claimMethod === 'social' && (
                <div className="method-section">
                  <h4>Social Media Proof</h4>
                  <p>Post this verification code on your official social media, then provide the link:</p>
                  <div className="verification-code">
                    <strong>Verification Code: {verificationCode}</strong>
                  </div>
                  <div className="form-group">
                    <label htmlFor="platform">Platform:</label>
                    <select
                      id="platform"
                      value={socialPlatform}
                      onChange={(e) => setSocialPlatform(e.target.value)}
                    >
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="twitter">Twitter/X</option>
                      <option value="tiktok">TikTok</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="postUrl">Post URL:</label>
                    <input
                      type="url"
                      id="postUrl"
                      value={socialPostUrl}
                      onChange={(e) => setSocialPostUrl(e.target.value)}
                      placeholder="https://instagram.com/p/..."
                      required
                    />
                  </div>
                </div>
              )}

              {claimMethod === 'manual' && (
                <div className="method-section">
                  <h4>Manual Review</h4>
                  <p>Describe your relationship to the band and provide supporting evidence:</p>
                  <div className="form-group">
                    <label htmlFor="description">Description:</label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="I am the lead singer of this band. We formed in 2020 and have released..."
                      rows={4}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Supporting Links (optional):</label>
                    {supportingLinks.map((link, index) => (
                      <div key={index} className="link-input-group">
                        <input
                          type="url"
                          value={link}
                          onChange={(e) => updateSupportingLink(index, e.target.value)}
                          placeholder="https://example.com/proof"
                        />
                        {supportingLinks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSupportingLink(index)}
                            className="remove-link-button"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSupportingLink}
                      className="add-link-button"
                    >
                      + Add Another Link
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BandClaimModalV2;
