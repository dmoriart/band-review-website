import React, { useState, useMemo } from 'react';
import { Gig, UserRSVP } from '../GigsPage';
import { urlFor } from '../sanity';
import './GigsCalendar.css';

interface GigsCalendarProps {
  gigs: Gig[];
  userRSVPs: UserRSVP[];
  onGigClick: (gig: Gig) => void;
  onDateSelect: (date: Date) => void;
}

const GigsCalendar: React.FC<GigsCalendarProps> = ({
  gigs,
  userRSVPs,
  onGigClick,
  onDateSelect
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Group gigs by date
  const gigsByDate = useMemo(() => {
    const grouped: { [key: string]: Gig[] } = {};
    
    gigs.forEach(gig => {
      const date = new Date(gig.date);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(gig);
    });
    
    return grouped;
  }, [gigs]);

  const getUserRSVP = (gigId: string): UserRSVP | undefined => {
    return userRSVPs.find(rsvp => rsvp.gigId === gigId);
  };

  // Calendar navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days for month view
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);
    
    // Start from Sunday of the week containing the first day
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // End on Saturday of the week containing the last day
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // Generate week days for week view
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const renderGigPreview = (gig: Gig) => {
    const userRSVP = getUserRSVP(gig._id);
    const time = new Date(gig.date).toLocaleTimeString('en-IE', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });

    return (
      <div 
        key={gig._id}
        className={`gig-preview ${gig.featured ? 'featured' : ''} ${userRSVP ? userRSVP.status : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onGigClick(gig);
        }}
        title={`${gig.title} at ${gig.venue.name} - ${time}`}
      >
        <div className="gig-time">{time}</div>
        <div className="gig-title">{gig.title}</div>
        <div className="gig-venue">{gig.venue.name}</div>
        {userRSVP && (
          <div className="rsvp-indicator">
            {userRSVP.status === 'attending' ? '✓' : 
             userRSVP.status === 'interested' ? '★' : '✗'}
          </div>
        )}
      </div>
    );
  };

  const renderCalendarDay = (date: Date) => {
    const dateKey = formatDateKey(date);
    const dayGigs = gigsByDate[dateKey] || [];
    const isCurrentMonthDay = isCurrentMonth(date);
    
    return (
      <div 
        key={dateKey}
        className={`calendar-day ${isToday(date) ? 'today' : ''} 
                   ${!isCurrentMonthDay ? 'other-month' : ''}
                   ${dayGigs.length > 0 ? 'has-gigs' : ''}`}
        onClick={() => onDateSelect(date)}
      >
        <div className="day-number">{date.getDate()}</div>
        
        {dayGigs.length > 0 && (
          <div className="day-gigs">
            {viewMode === 'month' ? (
              // Month view: show dots or count
              dayGigs.length > 3 ? (
                <div className="gigs-count">+{dayGigs.length} gigs</div>
              ) : (
                dayGigs.slice(0, 3).map(gig => (
                  <div 
                    key={gig._id}
                    className={`gig-dot ${gig.featured ? 'featured' : ''}`}
                    title={`${gig.title} at ${gig.venue.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onGigClick(gig);
                    }}
                  />
                ))
              )
            ) : (
              // Week view: show full gig previews
              dayGigs.map(gig => renderGigPreview(gig))
            )}
          </div>
        )}
      </div>
    );
  };

  const days = viewMode === 'month' ? getMonthDays() : getWeekDays();
  const monthName = currentDate.toLocaleDateString('en-IE', { month: 'long', year: 'numeric' });

  return (
    <div className="gigs-calendar">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button 
            onClick={() => viewMode === 'month' ? navigateMonth('prev') : navigateWeek('prev')}
            className="nav-btn"
          >
            ←
          </button>
          
          <div className="current-period">
            <h3>{monthName}</h3>
            {viewMode === 'week' && (
              <p>Week of {days[0].toLocaleDateString('en-IE', { month: 'short', day: 'numeric' })}</p>
            )}
          </div>
          
          <button 
            onClick={() => viewMode === 'month' ? navigateMonth('next') : navigateWeek('next')}
            className="nav-btn"
          >
            →
          </button>
        </div>

        <div className="calendar-controls">
          <button 
            onClick={goToToday}
            className="today-btn"
          >
            Today
          </button>
          
          <div className="view-toggle">
            <button 
              onClick={() => setViewMode('month')}
              className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
            >
              Month
            </button>
            <button 
              onClick={() => setViewMode('week')}
              className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      <div className={`calendar-grid ${viewMode}`}>
        {/* Day headers */}
        <div className="day-headers">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="calendar-days">
          {days.map(day => renderCalendarDay(day))}
        </div>
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-dot featured"></div>
          <span>Featured Events</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot attending"></div>
          <span>Attending</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot interested"></div>
          <span>Interested</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot"></div>
          <span>Regular Events</span>
        </div>
      </div>

      {/* Today's Gigs Summary */}
      {(() => {
        const todayKey = formatDateKey(new Date());
        const todayGigs = gigsByDate[todayKey] || [];
        
        if (todayGigs.length > 0) {
          return (
            <div className="today-summary">
              <h4>🌟 Tonight's Gigs ({todayGigs.length})</h4>
              <div className="today-gigs">
                {todayGigs.map(gig => (
                  <div 
                    key={gig._id}
                    className="today-gig"
                    onClick={() => onGigClick(gig)}
                  >
                    {gig.poster && (
                      <img 
                        src={urlFor(gig.poster).width(60).height(60).url()} 
                        alt={gig.title}
                        className="gig-thumb"
                      />
                    )}
                    <div className="gig-info">
                      <div className="gig-title">{gig.title}</div>
                      <div className="gig-venue">{gig.venue.name}</div>
                      <div className="gig-time">
                        {new Date(gig.date).toLocaleTimeString('en-IE', { 
                          hour: '2-digit', 
                          minute: '2-digit', 
                          hour12: false 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
};

export default GigsCalendar;
