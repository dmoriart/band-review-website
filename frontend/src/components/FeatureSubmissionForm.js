import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import './FeatureSubmissionForm.css';

const FeatureSubmissionForm = ({ onSubmitted, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'feature',
    tags: '',
    priority: 'medium'
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const commonTags = [
    'mobile', 'desktop', 'ui', 'ux', 'performance', 'search', 'navigation',
    'venues', 'reviews', 'authentication', 'notifications', 'accessibility',
    'api', 'database', 'admin', 'security', 'integration'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTagClick = (tag) => {
    const currentTags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (currentTags.includes(tag)) {
      // Remove tag
      const newTags = currentTags.filter(t => t !== tag);
      setFormData(prev => ({ ...prev, tags: newTags.join(', ') }));
    } else {
      // Add tag
      const newTags = [...currentTags, tag];
      setFormData(prev => ({ ...prev, tags: newTags.join(', ') }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
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
      // TODO: Replace with actual API call when backend is ready
      // For now, simulate submission with mock data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      const mockSubmittedFeature = {
        id: Date.now(), // Use timestamp as unique ID for demo
        title: formData.title,
        description: formData.description,
        type: formData.type,
        status: 'proposed',
        priority: formData.priority,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        author: {
          id: user?.uid || 'mock-user-id',
          name: user?.displayName || user?.email || 'Anonymous User',
          email: user?.email || 'user@example.com'
        },
        upvotes_count: 1, // Creator automatically upvotes
        comments_count: 0,
        user_has_voted: true,
        user_is_subscribed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      onSubmitted(mockSubmittedFeature);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'feature',
        tags: '',
        priority: 'medium'
      });
    } catch (error) {
      setErrors({ submit: 'Failed to submit. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

  return (
    <div className="feature-submission-form">
      <div className="form-header">
        <h2>Submit a {formData.type === 'feature' ? 'Feature Request' : 'Bug Report'}</h2>
        <p>Help us improve BandVenueReview.ie by sharing your ideas or reporting issues.</p>
      </div>

      <form onSubmit={handleSubmit} className="submission-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="form-control"
            >
              <option value="feature">Feature Request</option>
              <option value="bug">Bug Report</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="form-control"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              {formData.type === 'bug' && <option value="critical">Critical</option>}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="title">
            Title <span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`form-control ${errors.title ? 'error' : ''}`}
            placeholder={formData.type === 'feature' 
              ? "e.g., Add dark mode support" 
              : "e.g., Mobile navigation menu not working"
            }
            maxLength="100"
          />
          {errors.title && <span className="error-message">{errors.title}</span>}
          <div className="character-count">{formData.title.length}/100</div>
        </div>

        <div className="form-group">
          <label htmlFor="description">
            Description <span className="required">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`form-control ${errors.description ? 'error' : ''}`}
            placeholder={formData.type === 'feature' 
              ? "Describe the feature you'd like to see. What problem would it solve? How would it work?"
              : "Describe the bug. What did you expect to happen? What actually happened? Steps to reproduce?"
            }
            rows="6"
            maxLength="1000"
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
          <div className="character-count">{formData.description.length}/1000</div>
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (optional)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="form-control"
            placeholder="mobile, ui, search (comma-separated)"
          />
          
          <div className="tag-suggestions">
            <p>Common tags:</p>
            <div className="tag-cloud">
              {commonTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-button ${selectedTags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {errors.submit && (
          <div className="error-message submit-error">{errors.submit}</div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : `Submit ${formData.type === 'feature' ? 'Feature' : 'Bug Report'}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeatureSubmissionForm;
