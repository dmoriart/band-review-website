import React, { useState } from 'react';
import { signInWithGoogle, signInWithEmail, createUserWithEmail, signOutUser } from './firebase';
import { useAuth } from './AuthContext';
import './Auth.css';

interface AuthComponentProps {
  onClose: () => void;
}

const AuthComponent: React.FC<AuthComponentProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      if (isSignUp) {
        await createUserWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      onClose();
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (user) {
    return (
      <div className="auth-container">
        <div className="auth-modal">
          <button className="auth-close" onClick={onClose}>×</button>
          <h2>Welcome back!</h2>
          <div className="user-info">
            <img 
              src={user.photoURL || '/api/placeholder/64/64'} 
              alt="Profile" 
              className="user-avatar"
            />
            <p><strong>{user.displayName || 'User'}</strong></p>
            <p>{user.email}</p>
          </div>
          <button className="auth-button secondary" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose}>×</button>
        <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        <div className="auth-methods">
          {/* Google Sign In */}
          <button 
            className="auth-button google-button" 
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.54C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z"/>
              <path fill="#34A853" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.21 1.18-.82 2.27-1.94 3.03l2.99 2.33c1.81-1.67 2.63-4.12 2.63-6.86z"/>
              <path fill="#FBBC04" d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z"/>
              <path fill="#EA4335" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.99-2.33c-.76.53-1.78.9-2.97.9-2.38 0-4.4-1.57-5.12-3.74L.96 13.04C2.45 15.98 5.48 18 9 18z"/>
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="auth-form">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
              minLength={6}
            />
            {isSignUp && (
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="auth-input"
                minLength={6}
              />
            )}
            <button 
              type="submit" 
              className="auth-button primary"
              disabled={loading}
            >
              {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="auth-toggle">
            <button 
              type="button"
              className="auth-link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthComponent;
