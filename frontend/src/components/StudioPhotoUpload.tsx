import React, { useState, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { client } from '../sanity';
import './StudioPhotoUpload.css';

interface StudioPhotoUploadProps {
  studioId: string;
  studioName: string;
  onPhotoUploaded: (newPhoto: any) => void;
}

const StudioPhotoUpload: React.FC<StudioPhotoUploadProps> = ({
  studioId,
  studioName,
  onPhotoUploaded
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, GIF, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file must be smaller than 10MB');
      return;
    }

    await uploadPhoto(file);
  };

  const uploadPhoto = async (file: File) => {
    if (!user) {
      setError('You must be signed in to upload photos');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🖼️ Starting photo upload for studio:', studioId);

      // Upload image to Sanity
      console.log('📤 Uploading image to Sanity...');
      const imageAsset = await client.assets.upload('image', file, {
        filename: `${studioName}-${Date.now()}.${file.name.split('.').pop()}`,
      });

      console.log('✅ Image uploaded to Sanity:', imageAsset._id);

      // Create image reference
      const imageRef = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: imageAsset._id,
        },
        alt: `Photo of ${studioName} uploaded by ${user.displayName || user.email}`,
        caption: `Uploaded by ${user.displayName || user.email} on ${new Date().toLocaleDateString()}`,
        uploadedBy: {
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || user.email,
          uploadedAt: new Date().toISOString(),
        }
      };

      console.log('✅ Image uploaded successfully to Sanity assets');

      setSuccess('Photo uploaded successfully! The studio owner can add it to the gallery.');
      
      // Call the callback to update the parent component
      onPhotoUploaded(imageRef);

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (err: any) {
      console.error('❌ Photo upload failed:', err);
      
      // Handle specific error cases
      if (err.message?.includes('permission')) {
        setError('Permission denied. Please ensure you have the necessary permissions to upload photos.');
      } else if (err.message?.includes('network')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (err.message?.includes('size')) {
        setError('File too large. Please choose a smaller image (max 10MB).');
      } else {
        setError(`Upload failed: ${err.message || 'Unknown error occurred'}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  if (!user) {
    return (
      <div className="photo-upload-signin">
        <p>🔒 Sign in to upload photos of this studio</p>
      </div>
    );
  }

  return (
    <div className="studio-photo-upload">
      <div className="upload-header">
        <h4>📸 Add Photos</h4>
        <p>Share photos of this studio to help other musicians</p>
      </div>

      <div className="upload-area">
        <label htmlFor="studio-photo-upload-input" className="visually-hidden">
          Upload a photo of the studio
        </label>
        <input
          id="studio-photo-upload-input"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="studio-photo-upload-input"
          disabled={uploading}
          title="Upload a photo of the studio"
          placeholder="Choose a photo to upload"
        />

        <button
          className={`upload-button ${uploading ? 'uploading' : ''}`}
          onClick={triggerFileSelect}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <div className="upload-spinner"></div>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <span className="upload-icon">📷</span>
              <span>Choose Photo</span>
            </>
          )}
        </button>

        <div className="upload-info">
          <p>Supported formats: JPG, PNG, GIF</p>
          <p>Maximum size: 10MB</p>
        </div>
      </div>

      {error && (
        <div className="upload-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="upload-success">
          <span className="success-icon">✅</span>
          <span>{success}</span>
        </div>
      )}

      <div className="upload-guidelines">
        <h5>📋 Photo Guidelines</h5>
        <ul>
          <li>Show the studio space, equipment, or atmosphere</li>
          <li>Ensure good lighting and clear image quality</li>
          <li>Respect privacy - no personal information visible</li>
          <li>Only upload photos you have permission to share</li>
        </ul>
      </div>
    </div>
  );
};

export default StudioPhotoUpload;
