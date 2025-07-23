import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { client } from '../sanity';
import './BandEditForm.css';

interface BandEditFormProps {
  band: any; // Sanity band object
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface Genre {
  _id: string;
  name: string;
  slug: { current: string };
  color?: { hex: string };
}

const BandEditForm: React.FC<BandEditFormProps> = ({
  band,
  isOpen,
  onClose,
  onSaved
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    locationText: '',
    formedYear: '',
    socialLinks: {
      website: '',
      spotify: '',
      instagram: '',
      facebook: '',
      youtube: '',
      bandcamp: '',
      soundcloud: '',
      twitter: ''
    },
    genres: [] as string[] // Array of genre IDs
  });

  // Load available genres
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        // Type assertion to work around TypeScript definition issues
        const genres = await (client as any).fetch(`
          *[_type == "genre" && !(_id in path("drafts.**"))] | order(name asc) {
            _id,
            name,
            slug,
            color
          }
        `);
        setAvailableGenres(genres);
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    };

    fetchGenres();
  }, []);

  // Populate form with current band data
  useEffect(() => {
    if (band && isOpen) {
      setFormData({
        name: band.name || '',
        bio: band.bio || '',
        locationText: band.locationText || '',
        formedYear: band.formedYear?.toString() || '',
        socialLinks: {
          website: band.socialLinks?.website || '',
          spotify: band.socialLinks?.spotify || '',
          instagram: band.socialLinks?.instagram || '',
          facebook: band.socialLinks?.facebook || '',
          youtube: band.socialLinks?.youtube || '',
          bandcamp: band.socialLinks?.bandcamp || '',
          soundcloud: band.socialLinks?.soundcloud || '',
          twitter: band.socialLinks?.twitter || ''
        },
        genres: band.genres?.map((g: any) => g._id) || []
      });
    }
  }, [band, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  const handleGenreChange = (genreId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      genres: checked 
        ? [...prev.genres, genreId]
        : prev.genres.filter(id => id !== genreId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Prepare update data
      const updateData: any = {
        name: formData.name,
        bio: formData.bio,
        locationText: formData.locationText,
        socialLinks: formData.socialLinks
      };

      // Add formed year if provided
      if (formData.formedYear) {
        updateData.formedYear = parseInt(formData.formedYear);
      }

      // Add genre references
      if (formData.genres.length > 0) {
        updateData.genres = formData.genres.map(genreId => ({
          _type: 'reference',
          _ref: genreId
        }));
      }

      // Update the band document in Sanity
      await (client as any)
        .patch(band._id)
        .set(updateData)
        .commit();

      setSuccess(true);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('Error updating band:', err);
      setError(err.message || 'Failed to update band information');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content band-edit-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="band-edit-header">
          <h2>Edit Band Profile</h2>
          <p>Update your band's information</p>
        </div>

        {success ? (
          <div className="success-message">
            <h3>✅ Profile Updated!</h3>
            <p>Your band profile has been successfully updated.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="band-edit-form">
            {/* Basic Information */}
            <div className="form-section">
              <h3>Basic Information</h3>
              
              <div className="form-group">
                <label>Band Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  title="Enter the band's name"
                  placeholder="Band Name"
                />
              </div>

              <div className="form-group">
                <label>Bio/Description</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={6}
                  placeholder="Tell people about your band, your music style, history, and what makes you unique..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData.locationText}
                    onChange={(e) => handleInputChange('locationText', e.target.value)}
                    title="Enter the band's location"
                    placeholder="e.g., Dublin, Ireland"
                  />
                </div>

                <div className="form-group">
                  <label>Formed Year</label>
                  <input
                    type="number"
                    value={formData.formedYear}
                    onChange={(e) => handleInputChange('formedYear', e.target.value)}
                    min="1900"
                    max={new Date().getFullYear()}
                    placeholder="e.g., 2020"
                  />
                </div>
              </div>
            </div>

            {/* Genres */}
            <div className="form-section">
              <h3>Genres</h3>
              <div className="genres-grid">
                {availableGenres.map(genre => (
                  <label key={genre._id} className="genre-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.genres.includes(genre._id)}
                      onChange={(e) => handleGenreChange(genre._id, e.target.checked)}
                      aria-label={`Select ${genre.name} genre`}
                    />
                    <span className="genre-label" data-genre-color={genre.color?.hex}>
                      {genre.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="form-section">
              <h3>Social Media & Links</h3>
              
              <div className="social-links-grid">
                <div className="form-group">
                  <label>🌐 Website</label>
                  <input
                    type="url"
                    value={formData.socialLinks.website}
                    onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                    placeholder="https://yourband.com"
                  />
                </div>

                <div className="form-group">
                  <label>🎵 Spotify</label>
                  <input
                    type="url"
                    value={formData.socialLinks.spotify}
                    onChange={(e) => handleSocialLinkChange('spotify', e.target.value)}
                    placeholder="https://open.spotify.com/artist/..."
                  />
                </div>

                <div className="form-group">
                  <label>📷 Instagram</label>
                  <input
                    type="url"
                    value={formData.socialLinks.instagram}
                    onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                    placeholder="https://instagram.com/yourband"
                  />
                </div>

                <div className="form-group">
                  <label>👍 Facebook</label>
                  <input
                    type="url"
                    value={formData.socialLinks.facebook}
                    onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                    placeholder="https://facebook.com/yourband"
                  />
                </div>

                <div className="form-group">
                  <label>📺 YouTube</label>
                  <input
                    type="url"
                    value={formData.socialLinks.youtube}
                    onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                    placeholder="https://youtube.com/c/yourband"
                  />
                </div>

                <div className="form-group">
                  <label>🎶 Bandcamp</label>
                  <input
                    type="url"
                    value={formData.socialLinks.bandcamp}
                    onChange={(e) => handleSocialLinkChange('bandcamp', e.target.value)}
                    placeholder="https://yourband.bandcamp.com"
                  />
                </div>

                <div className="form-group">
                  <label>🎧 SoundCloud</label>
                  <input
                    type="url"
                    value={formData.socialLinks.soundcloud}
                    onChange={(e) => handleSocialLinkChange('soundcloud', e.target.value)}
                    placeholder="https://soundcloud.com/yourband"
                  />
                </div>

                <div className="form-group">
                  <label>🐦 Twitter/X</label>
                  <input
                    type="url"
                    value={formData.socialLinks.twitter}
                    onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                    placeholder="https://twitter.com/yourband"
                  />
                </div>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button type="button" onClick={onClose} className="cancel-btn">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="save-btn">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BandEditForm;
