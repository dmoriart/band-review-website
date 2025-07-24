import React, { useState, useEffect } from 'react';
import './CookieNotice.css';

const CookieNotice: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem('cookieNoticeAccepted');
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieNoticeAccepted', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-notice">
      <div className="cookie-notice-content">
        <span className="cookie-notice-text">
          This site uses essential cookies for authentication and functionality.
        </span>
        <button className="cookie-notice-button" onClick={handleAccept}>
          Got it
        </button>
      </div>
    </div>
  );
};

export default CookieNotice;
