import React from 'react';
import { Gig, UserRSVP } from '../GigsPage';
import { urlFor } from '../sanity';
import './GigsList.css';

interface GigsListProps {
  gigs: Gig[];
  userRSVPs: UserRSVP[];
  onGigClick: (gig: Gig) => void;
  onRSVPClick: (gig: Gig) => void;
  generateCalendarLink: (gig: Gig) => string;
  isLoggedIn: boolean;
}

const GigsList: React.FC<GigsListProps> = ({
  gigs,
  userRSVPs,
  onGigClick,
  onRSVPClick,
  generateCalendarLink,
  isLoggedIn
}) => {
  const getUserRSVP = (gigId: string): UserRSVP | undefined => {
    return userRSVPs.find(rsvp => rsvp.gigId === gigId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString('en-IE', { weekday: 'short' }).toUpperCase(),
      date: date.getDate(),
      month: date.toLocaleDateString('en-IE', { month: 'short' }).toUpperCase(),
      time: date.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  const getRSVPBadge = (rsvp?: UserRSVP) => {
    if (!rsvp) return null;
    
    switch (rsvp.status) {
      case 'attending':
        return <span className="rsvp-badge attending">✓ Attending</span>;
      case 'interested':
        return <span className="rsvp-badge interested">★ Interested</span>;
      case 'not_attending':
        return <span className="rsvp-badge not-attending">✗ Not Going</span>;
      default:
        return null;
    }
  };

  if (gigs.length === 0) {
    return (
      <div className="gigs-empty">
        <div className="empty-state">
          <h3>🎭 No Gigs Found</h3>
          <p>No gigs match your current filters. Try adjusting your search criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gigs-list">
      <div className="gigs-list-header">
        <h3>📋 Upcoming Gigs ({gigs.length})</h3>
        <p>Click on any gig for full details</p>
      </div>

      <div className="gigs-grid">
        {gigs.map((gig) => {
          const dateInfo = formatDate(gig.date);
          const userRSVP = getUserRSVP(gig._id);
          
          return (
            <div 
              key={gig._id} 
              className={`gig-card ${gig.featured ? 'featured' : ''} ${gig.status}`}
              onClick={() => onGigClick(gig)}
            >
              {/* Date Column */}
              <div className="gig-date">
                <div className="day">{dateInfo.day}</div>
                <div className="date-number">{dateInfo.date}</div>
                <div className="month">{dateInfo.month}</div>
                <div className="time">{dateInfo.time}</div>
              </div>

              {/* Poster/Image */}
              <div className="gig-image">
                {gig.poster ? (
                  <img 
                    src={urlFor(gig.poster).width(200).height(200).url()} 
                    alt={`${gig.title} poster`}
                  />
                ) : (
                  <div className="gig-placeholder">
                    <span>🎤</span>
                  </div>
                )}
                {gig.featured && <div className="featured-badge">⭐ FEATURED</div>}
                {getStatusBadge(gig.status)}
              </div>

              {/* Gig Info */}
              <div className="gig-info">
                <h3 className="gig-title">{gig.title}</h3>
                
                {gig.headliner && (
                  <div className="headliner">
                    🎸 <strong>{gig.headliner.name}</strong>
                    {gig.headliner.genre && <span className="genre">• {gig.headliner.genre}</span>}
                  </div>
                )}

                {gig.supportActs && gig.supportActs.length > 0 && (
                  <div className="support-acts">
                    🎵 Support: {gig.supportActs.map(act => act.name).join(', ')}
                  </div>
                )}

                <div className="venue-info">
                  🏛️ <strong>{gig.venue.name}</strong>
                  {gig.venue.address?.city && (
                    <span className="location">
                      📍 {gig.venue.address.city}
                      {gig.venue.address.county && `, ${gig.venue.address.county}`}
                    </span>
                  )}
                </div>

                {gig.genre && (
                  <div className="gig-genre">
                    🎭 {gig.genre.name}
                  </div>
                )}

                {gig.description && (
                  <p className="gig-description">
                    {gig.description.length > 120 
                      ? `${gig.description.substring(0, 120)}...` 
                      : gig.description
                    }
                  </p>
                )}

                <div className="gig-details">
                  {gig.ticketPrice !== undefined && (
                    <span className="price">
                      💰 {gig.ticketPrice === 0 ? 'FREE' : `€${gig.ticketPrice}`}
                    </span>
                  )}
                  
                  {gig.ageRestriction && (
                    <span className="age-restriction">
                      🔞 {gig.ageRestriction.replace('_', ' ').toUpperCase()}
                    </span>
                  )}
                </div>

                {/* RSVP Status */}
                {isLoggedIn && getRSVPBadge(userRSVP)}
              </div>

              {/* Action Buttons */}
              <div className="gig-actions" onClick={(e) => e.stopPropagation()}>
                {isLoggedIn && (
                  <button 
                    onClick={() => onRSVPClick(gig)}
                    className={`rsvp-btn ${userRSVP ? userRSVP.status : ''}`}
                    title="RSVP to this gig"
                  >
                    {userRSVP ? (
                      userRSVP.status === 'attending' ? '✓' :
                      userRSVP.status === 'interested' ? '★' : '✗'
                    ) : '+'} RSVP
                  </button>
                )}

                <a 
                  href={generateCalendarLink(gig)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="calendar-btn"
                  title="Add to Google Calendar"
                >
                  📅 Add to Calendar
                </a>

                {gig.ticketUrl && (
                  <a 
                    href={gig.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tickets-btn"
                    title="Buy tickets"
                  >
                    🎫 Tickets
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GigsList;
