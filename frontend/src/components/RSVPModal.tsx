import React, { useState } from 'react';
import { Gig, UserRSVP } from '../GigsPage';
import { urlFor } from '../sanity';
import './RSVPModal.css';

interface RSVPModalProps {
  gig: Gig;
  currentRSVP?: UserRSVP;
  onRSVP: (gig: Gig, status: 'attending' | 'interested' | 'not_attending', reminder?: boolean) => void;
  onClose: () => void;
  isLoggedIn: boolean;
}

const RSVPModal: React.FC<RSVPModalProps> = ({
  gig,
  currentRSVP,
  onRSVP,
  onClose,
  isLoggedIn
}) => {
  const [selectedStatus, setSelectedStatus] = useState<'attending' | 'interested' | 'not_attending'>(
    currentRSVP?.status || 'interested'
  );
  const [reminder, setReminder] = useState(currentRSVP?.reminder || false);
  const [notes, setNotes] = useState(currentRSVP?.notes || '');

  const handleSubmit = () => {
    onRSVP(gig, selectedStatus, reminder);
  };

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
      })
    };
  };

  const dateInfo = formatDate(gig.date);

  if (!isLoggedIn) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="rsvp-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>RSVP to Event</h3>
            <button onClick={onClose} className="close-btn">×</button>
          </div>
          
          <div className="modal-body">
            <div className="login-required">
              <h4>🔐 Login Required</h4>
              <p>You need to be logged in to RSVP to events and set reminders.</p>
              <p>Please log in or create an account to continue.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="rsvp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>RSVP to Event</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="modal-body">
          {/* Event Summary */}
          <div className="event-summary">
            {gig.poster && (
              <img 
                src={urlFor(gig.poster).width(100).height(100).url()} 
                alt={gig.title}
                className="event-poster"
              />
            )}
            
            <div className="event-details">
              <h4>{gig.title}</h4>
              {gig.headliner && (
                <p className="headliner">🎸 {gig.headliner.name}</p>
              )}
              <p className="venue">🏛️ {gig.venue.name}</p>
              <p className="date">📅 {dateInfo.fullDate}</p>
              <p className="time">🕐 {dateInfo.time}</p>
              {gig.ticketPrice !== undefined && (
                <p className="price">
                  💰 {gig.ticketPrice === 0 ? 'FREE' : `€${gig.ticketPrice}`}
                </p>
              )}
            </div>
          </div>

          {/* RSVP Options */}
          <div className="rsvp-options">
            <h4>Your Response</h4>
            
            <div className="status-options">
              <label className={`status-option ${selectedStatus === 'attending' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="rsvp-status"
                  value="attending"
                  checked={selectedStatus === 'attending'}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                />
                <div className="option-content">
                  <span className="icon">✓</span>
                  <div>
                    <strong>Attending</strong>
                    <p>I'll definitely be there!</p>
                  </div>
                </div>
              </label>

              <label className={`status-option ${selectedStatus === 'interested' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="rsvp-status"
                  value="interested"
                  checked={selectedStatus === 'interested'}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                />
                <div className="option-content">
                  <span className="icon">★</span>
                  <div>
                    <strong>Interested</strong>
                    <p>Sounds good, might attend</p>
                  </div>
                </div>
              </label>

              <label className={`status-option ${selectedStatus === 'not_attending' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="rsvp-status"
                  value="not_attending"
                  checked={selectedStatus === 'not_attending'}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                />
                <div className="option-content">
                  <span className="icon">✗</span>
                  <div>
                    <strong>Can't Attend</strong>
                    <p>Won't be able to make it</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Reminder Option */}
          {(selectedStatus === 'attending' || selectedStatus === 'interested') && (
            <div className="reminder-option">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={reminder}
                  onChange={(e) => setReminder(e.target.checked)}
                />
                <span className="checkmark">📱</span>
                <div>
                  <strong>Set Reminder</strong>
                  <p>Get notified before the event</p>
                </div>
              </label>
            </div>
          )}

          {/* Notes (Future Feature) */}
          <div className="notes-section">
            <label htmlFor="rsvp-notes">Notes (optional)</label>
            <textarea
              id="rsvp-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this event..."
              rows={3}
            />
          </div>

          {/* Current RSVP Status */}
          {currentRSVP && (
            <div className="current-status">
              <p>
                <strong>Current Status:</strong> 
                {currentRSVP.status === 'attending' && ' ✓ Attending'}
                {currentRSVP.status === 'interested' && ' ★ Interested'}
                {currentRSVP.status === 'not_attending' && ' ✗ Not Attending'}
                {currentRSVP.reminder && ' (with reminder)'}
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button onClick={handleSubmit} className="confirm-btn">
            {currentRSVP ? 'Update RSVP' : 'Save RSVP'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RSVPModal;
