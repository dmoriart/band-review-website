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
    <>
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

      {/* Mobile Navigation Menu - Outside of nav to prevent duplication */}
      {isMobileMenuOpen && (
        <>
          {/* Mobile Menu Overlay */}
          <div 
            className="mobile-nav-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Mobile Navigation Panel */}
          <div className="mobile-nav">
            <div className="mobile-nav-header">
              <button 
                className="mobile-nav-close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <div className="mobile-nav-links">
              <button 
                className={`mobile-nav-link ${currentView === 'home' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('home');
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className="nav-icon">🏠</span>
                <span>Home</span>
              </button>
              <button 
                className={`mobile-nav-link ${currentView === 'venues' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('venues');
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className="nav-icon">🏛️</span>
                <span>Venues</span>
              </button>
              <button 
                className={`mobile-nav-link ${currentView === 'studios' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('studios');
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className="nav-icon">🎙️</span>
                <span>Studios</span>
              </button>
              <button 
                className={`mobile-nav-link ${currentView === 'bands' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('bands');
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className="nav-icon">🎵</span>
                <span>Bands</span>
              </button>
              <button 
                className={`mobile-nav-link ${currentView === 'store' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('store');
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className="nav-icon">🛍️</span>
                <span>Store</span>
              </button>
              <button 
                className={`mobile-nav-link ${currentView === 'gigs' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('gigs');
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className="nav-icon">🎤</span>
                <span>Gigs</span>
              </button>
              <button 
                className={`mobile-nav-link ${currentView === 'features' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('features');
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className="nav-icon">💡</span>
                <span>Feature Ideas</span>
              </button>
              <button 
                className={`mobile-nav-link ${(currentView as string) === 'forum' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('forum');
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className="nav-icon">💬</span>
                <span>Forum</span>
              </button>
              <div className="mobile-nav-divider"></div>
              <button 
                className="mobile-nav-link account-link"
                onClick={() => {
                  setShowAuthModal(true);
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className="nav-icon">{user ? '👤' : '🔑'}</span>
                <span>{user ? 'My Account' : 'Sign In'}</span>
              </button>
              {!isAdmin && (
                <button 
                  className="mobile-nav-link admin-link"
                  onClick={() => {
                    setCurrentView('admin');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span className="nav-icon">🛠️</span>
                  <span>Admin Panel</span>
                </button>
              )}
              {isAdmin && (
                <button 
                  className="mobile-nav-link admin-active"
                  onClick={() => {
                    setIsAdmin(false);
                    setAdminToken('');
                    setCurrentView('home');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span className="nav-icon">👑</span>
                  <span>Exit Admin</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default NavigationHeader;
