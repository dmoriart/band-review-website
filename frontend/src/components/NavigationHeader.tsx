import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import '../App.css';

interface NavigationHeaderProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  setShowAuthModal: (show: boolean) => void;
  adminToken: string;
  setAdminToken: (token: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentView,
  setCurrentView,
  isAdmin,
  setIsAdmin,
  setShowAuthModal,
  adminToken,
  setAdminToken,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const { user } = useAuth();

  return (
    <nav className="navigation">
      <div className="nav-brand" onClick={() => setCurrentView('home')}>
        🎵 BandVenueReview.ie
      </div>
      <div className="nav-links desktop-nav">
        <button className={`nav-link ${currentView === 'home' ? 'active' : ''}`} onClick={() => setCurrentView('home')}>Home</button>
        <button className={`nav-link ${currentView === 'venues' ? 'active' : ''}`} onClick={() => setCurrentView('venues')}>Venues</button>
        <button className={`nav-link ${currentView === 'studios' ? 'active' : ''}`} onClick={() => setCurrentView('studios')}>Studios</button>
        <button className={`nav-link ${currentView === 'bands' ? 'active' : ''}`} onClick={() => setCurrentView('bands')}>Bands</button>
        <button className={`nav-link ${currentView === 'store' ? 'active' : ''}`} onClick={() => setCurrentView('store')}>🛍️ Store</button>
        <button className={`nav-link ${currentView === 'gigs' ? 'active' : ''}`} onClick={() => setCurrentView('gigs')}>🎵 Gigs</button>
        <button className={`nav-link ${currentView === 'features' ? 'active' : ''}`} onClick={() => setCurrentView('features')}>💡 Features</button>
        <button className={`nav-link ${(currentView as string) === 'forum' ? 'active' : ''}`} onClick={() => setCurrentView('forum')}>
          💬 Forum
        </button>
        <button className="nav-link" onClick={() => setShowAuthModal(true)}>
          {user ? '👤 Account' : '🔑 Sign In'}
        </button>
        {!isAdmin && (
          <button className="nav-link admin-link" onClick={() => setCurrentView('admin')}>
            🛠️ Admin
          </button>
        )}
        {isAdmin && (
          <button className="nav-link admin-active" onClick={() => {
            setIsAdmin(false);
            setAdminToken('');
            setCurrentView('home');
          }}>
            Logout Admin
          </button>
        )}
      </div>
      <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle mobile menu">
        <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>
    </nav>
  );
};

export default NavigationHeader;
