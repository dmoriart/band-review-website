import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { bandUserService, BandClaimRequest } from '../services/bandUserService';
import './BandClaimModal.css';

interface BandClaimModalProps {
  band: any; // Sanity band object
  isOpen: boolean;
  onClose: () => void;
  onClaimSubmitted: () => void;
}

const BandClaimModal: React.FC<BandClaimModalProps> = ({
  band,
  isOpen,
  onClose,
  onClaimSubmitted
}) => {
  const { user } = useAuth();
  const [claimMethod, setClaimMethod] = useState<'email' | 'social' | 'manual'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form data
  const [email, setEmail] = useState('');
  const [socialPlatform, setSocialPlatform] = useState('');
  const [socialPostUrl, setSocialPostUrl] = useState('');
  const [verificationCode] = useState(() => bandUserService.generateVerificationCode());
  const [description, setDescription] = useState('');
  const [supportingLinks, setSupportingLinks] = useState(['']);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate required fields based on claim method
    if (claimMethod === 'email' && !email.trim()) {
      setError('Please enter your band email address');
      return;
    }
    if (claimMethod === 'social' && (!socialPlatform || !socialPostUrl.trim())) {
      setError('Please select a platform and provide the post URL');
      return;
    }
    if (claimMethod === 'manual' && !description.trim()) {
      setError('Please provide a description of your connection to the band');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🎸 Starting band claim submission...', { bandId: band._id, claimMethod, userId: user.uid });
      
      // Check if user has valid email
      if (!user.email) {
        throw new Error('User email is required for band claims');
      }

      // Check Firebase environment
      console.log('🔥 Firebase environment check:', {
        hasApiKey: !!process.env.REACT_APP_FIREBASE_API_KEY,
        hasProjectId: !!process.env.REACT_APP_FIREBASE_PROJECT_ID,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        userUid: user.uid,
        userEmail: user.email
      });

      // Test database connection first
      console.log('🔗 Testing database connection...');
      const connectionTest = await bandUserService.testConnection();
      if (!connectionTest) {
        console.warn('⚠️ Database connection test failed, but attempting submission anyway...');
        // Don't throw error immediately, let the actual submission attempt handle it
        // This allows us to get more specific error information
      } else {
        console.log('✅ Database connection test passed');
      }
      
      const claimData: BandClaimRequest = {
        bandId: band._id,
        bandName: band.name,
        claimMethod
      };

      if (claimMethod === 'email') {
        claimData.email = email.trim();
        console.log('📧 Email claim data prepared');
      } else if (claimMethod === 'social') {
        // Only add socialProof if we have valid data
        if (socialPlatform && socialPostUrl.trim()) {
          claimData.socialProof = {
            platform: socialPlatform,
            postUrl: socialPostUrl.trim(),
            verificationCode
          };
          console.log('📱 Social proof claim data prepared');
        }
      } else if (claimMethod === 'manual') {
        const filteredLinks = supportingLinks.filter(link => link.trim() !== '');
        claimData.manualData = {
          description: description.trim(),
          supportingLinks: filteredLinks
        };
        console.log('📝 Manual claim data prepared');
      }

      console.log('🔄 Submitting to bandUserService...');
      
      // Simple retry mechanism for timeout errors
      const MAX_RETRIES = 2;
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`🔄 Attempt ${attempt}/${MAX_RETRIES} to submit band claim...`);
          
          const result = await bandUserService.submitBandClaim(user.uid, user.email || '', claimData);
          
          console.log('✅ Band claim submitted successfully');
          setSuccess(true);
          setTimeout(() => {
            onClaimSubmitted();
            onClose();
          }, 2000);
          return; // Success, exit retry loop
          
        } catch (err: any) {
          lastError = err;
          console.error(`❌ Attempt ${attempt}/${MAX_RETRIES} failed:`, err.message);
          
          // Only retry for timeout errors
          const isTimeoutError = err.message?.includes('timed out') || err.message?.includes('timeout');
          
          if (!isTimeoutError || attempt === MAX_RETRIES) {
            // Not a timeout error, or we've exhausted retries
            throw err;
          }
          
          console.log(`⏳ Waiting before retry attempt ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        }
      }
      
      // If we get here, all retries failed
      throw lastError;

    } catch (err: any) {
      console.error('❌ Band claim submission error:', err);
      setError(err.message || 'Failed to submit claim');
    } finally {
      console.log('🔄 Resetting loading state');
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content band-claim-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="band-claim-header">
          <h2>Claim Band Profile</h2>
          <div className="band-info">
            <h3>{band.name}</h3>
            {band.locationText && <p>📍 {band.locationText}</p>}
          </div>
        </div>

        {success ? (
          <div className="success-message">
            <h3>✅ Claim Submitted!</h3>
            <p>Your claim has been submitted for review. You'll be notified once it's approved.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="band-claim-form">
            <div className="verification-methods">
              <h4>How would you like to verify your connection to this band?</h4>
              
              <div className="method-options">
                <label className="method-option">
                  <input
                    type="radio"
                    value="email"
                    checked={claimMethod === 'email'}
                    onChange={(e) => setClaimMethod(e.target.value as 'email')}
                  />
                  <div className="method-content">
                    <strong>📧 Email Verification</strong>
                    <p>Provide an official band email (website, label, management)</p>
                  </div>
                </label>

                <label className="method-option">
                  <input
                    type="radio"
                    value="social"
                    checked={claimMethod === 'social'}
                    onChange={(e) => setClaimMethod(e.target.value as 'social')}
                  />
                  <div className="method-content">
                    <strong>📱 Social Media Proof</strong>
                    <p>Post a verification code on your official social media</p>
                  </div>
                </label>

                <label className="method-option">
                  <input
                    type="radio"
                    value="manual"
                    checked={claimMethod === 'manual'}
                    onChange={(e) => setClaimMethod(e.target.value as 'manual')}
                  />
                  <div className="method-content">
                    <strong>📋 Manual Review</strong>
                    <p>Provide detailed information for admin review</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Email Verification Form */}
            {claimMethod === 'email' && (
              <div className="verification-form">
                <h4>Email Verification</h4>
                <div className="form-group">
                  <label>Official Band Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="band@example.com or management@label.com"
                    required
                  />
                  <small>We'll send a verification email to this address</small>
                </div>
              </div>
            )}

            {/* Social Media Verification Form */}
            {claimMethod === 'social' && (
              <div className="verification-form">
                <h4>Social Media Verification</h4>
                <div className="verification-code-box">
                  <strong>Your Verification Code: {verificationCode}</strong>
                  <p>Post this code on your official social media, then provide the link below</p>
                </div>
                
                <div className="form-group">
                  <label>Social Media Platform</label>
                  <select
                    value={socialPlatform}
                    onChange={(e) => setSocialPlatform(e.target.value)}
                    aria-label="Select social media platform"
                    required
                  >
                    <option value="">Select platform...</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="twitter">Twitter/X</option>
                    <option value="bandcamp">Bandcamp</option>
                    <option value="spotify">Spotify</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Link to Post with Verification Code</label>
                  <input
                    type="url"
                    value={socialPostUrl}
                    onChange={(e) => setSocialPostUrl(e.target.value)}
                    placeholder="https://..."
                    required
                  />
                </div>
              </div>
            )}

            {/* Manual Review Form */}
            {claimMethod === 'manual' && (
              <div className="verification-form">
                <h4>Manual Review Information</h4>
                
                <div className="form-group">
                  <label>Describe your connection to the band</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., I'm the lead singer, I'm the band's manager, etc."
                    rows={4}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Supporting Links (optional)</label>
                  {supportingLinks.map((link, index) => (
                    <div key={index} className="link-input-group">
                      <input
                        type="url"
                        value={link}
                        onChange={(e) => updateSupportingLink(index, e.target.value)}
                        placeholder="https://... (website, social media, music platforms)"
                      />
                      {supportingLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSupportingLink(index)}
                          className="remove-link-btn"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSupportingLink}
                    className="add-link-btn"
                  >
                    + Add Another Link
                  </button>
                </div>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button type="button" onClick={onClose} className="cancel-btn">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Submitting...' : 'Submit Claim'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BandClaimModal;
