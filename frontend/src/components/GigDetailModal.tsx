import React from 'react';
import { Gig, UserRSVP } from '../GigsPage';
import { urlFor } from '../sanity';
import './GigDetailModal.css';

interface GigDetailModalProps {
  gig: Gig;
  userRSVP?: UserRSVP;
  onRSVP: () => void;
  onClose: () => void;
  generateCalendarLink: (gig: Gig) => string;
  isLoggedIn: boolean;
}

const GigDetailModal: React.FC<GigDetailModalProps> = ({
  gig,
  userRSVP,
  onRSVP,
  onClose,
  generateCalendarLink,
  isLoggedIn
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      fullDate: date.toLocaleDateString('en-IE', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-IE', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      }),
      timeUntil: getTimeUntil(date)
    };
  };

  const getTimeUntil = (eventDate: Date) => {
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    
    if (diff < 0) return 'Event has passed';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} away`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} away`;
    } else {
      return 'Starting soon!';
    }
  };

  const getStatusBadge = () => {
    switch (gig.status) {
      case 'sold_out':
        return <span className="status-badge sold-out">SOLD OUT</span>;
      case 'cancelled':
        return <span className="status-badge cancelled">CANCELLED</span>;
      case 'completed':
        return <span className="status-badge completed">PAST EVENT</span>;
      default:
        return null;
    }
  };

  const getRSVPStatus = () => {
    if (!userRSVP) return null;
    
    switch (userRSVP.status) {
      case 'attending':
        return <span className="rsvp-status attending">✓ You're attending</span>;
      case 'interested':
        return <span className="rsvp-status interested">★ You're interested</span>;
      case 'not_attending':
        return <span className="rsvp-status not-attending">✗ You're not attending</span>;
      default:
        return null;
    }
  };

  const dateInfo = formatDate(gig.date);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="gig-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="modal-content">
          {/* Hero Section */}
          <div className="gig-hero">
            {gig.poster && (
              <div className="poster-container">
                <img 
                  src={urlFor(gig.poster).width(300).height(400).url()} 
                  alt={`${gig.title} poster`}
                  className="gig-poster"
                />
                {gig.featured && <div className="featured-badge">⭐ FEATURED</div>}
                {getStatusBadge()}
              </div>
            )}
            
            <div className="gig-info">
              <h1>{gig.title}</h1>
              
              {gig.headliner && (
                <div className="headliner-info">
                  <h2>🎸 {gig.headliner.name}</h2>
                  {gig.headliner.genre && (
                    <span className="genre-tag">{gig.headliner.genre}</span>
                  )}
                </div>
              )}

              {gig.supportActs && gig.supportActs.length > 0 && (
                <div className="support-acts">
                  <h3>🎵 Support Acts:</h3>
                  <ul>
                    {gig.supportActs.map(act => (
                      <li key={act._id}>{act.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="event-details">
                <div className="detail-item">
                  <span className="icon">📅</span>
                  <div>
                    <strong>{dateInfo.fullDate}</strong>
                    <p>{dateInfo.timeUntil}</p>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="icon">🕐</span>
                  <div>
                    <strong>{dateInfo.time}</strong>
                    <p>Event start time</p>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="icon">🏛️</span>
                  <div>
                    <strong>{gig.venue.name}</strong>
                    {gig.venue.address && (
                      <p>
                        {gig.venue.address.street && `${gig.venue.address.street}, `}
                        {gig.venue.address.city}
                        {gig.venue.address.county && `, ${gig.venue.address.county}`}
                      </p>
                    )}
                  </div>
                </div>

                {gig.ticketPrice !== undefined && (
                  <div className="detail-item">
                    <span className="icon">💰</span>
                    <div>
                      <strong>{gig.ticketPrice === 0 ? 'FREE ENTRY' : `€${gig.ticketPrice}`}</strong>
                      <p>Ticket price</p>
                    </div>
                  </div>
                )}

                {gig.ageRestriction && (
                  <div className="detail-item">
                    <span className="icon">🔞</span>
                    <div>
                      <strong>{gig.ageRestriction.replace('_', ' ').toUpperCase()}</strong>
                      <p>Age restriction</p>
                    </div>
                  </div>
                )}

                {gig.genre && (
                  <div className="detail-item">
                    <span className="icon">🎭</span>
                    <div>
                      <strong>{gig.genre.name}</strong>
                      <p>Music genre</p>
                    </div>
                  </div>
                )}
              </div>

              {/* RSVP Status */}
              {isLoggedIn && getRSVPStatus()}
            </div>
          </div>

          {/* Description */}
          {gig.description && (
            <div className="gig-description">
              <h3>About This Event</h3>
              <p>{gig.description}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            {isLoggedIn && (
              <button onClick={onRSVP} className="rsvp-btn primary">
                {userRSVP ? 'Update RSVP' : 'RSVP to Event'}
              </button>
            )}

            <a 
              href={generateCalendarLink(gig)}
              target="_blank"
              rel="noopener noreferrer"
              className="calendar-btn"
            >
              📅 Add to Google Calendar
            </a>

            {gig.ticketUrl && (
              <a 
                href={gig.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tickets-btn primary"
              >
                🎫 Buy Tickets
              </a>
            )}
          </div>

          {/* Share Options */}
          <div className="share-section">
            <h4>Share This Event</h4>
            <div className="share-buttons">
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: gig.title,
                      text: `Check out ${gig.title} at ${gig.venue.name}`,
                      url: window.location.href
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Event link copied to clipboard!');
                  }
                }}
                className="share-btn"
              >
                📱 Share
              </button>

              <button 
                onClick={() => {
                  const text = `Check out ${gig.title} at ${gig.venue.name} on ${dateInfo.fullDate}!`;
                  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                  window.open(url, '_blank');
                }}
                className="share-btn twitter"
              >
                🐦 Twitter
              </button>

              <button 
                onClick={() => {
                  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
                  window.open(url, '_blank');
                }}
                className="share-btn facebook"
              >
                📘 Facebook
              </button>
            </div>
          </div>

          {/* Similar Events (Future Feature) */}
          <div className="similar-events">
            <h4>More Events at {gig.venue.name}</h4>
            <p>See more upcoming events at this venue</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GigDetailModal;
