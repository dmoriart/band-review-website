import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useGigs } from './hooks/useSanity';
import GigsCalendar from './components/GigsCalendar';
import GigsList from './components/GigsList';
import GigsFilters from './components/GigsFilters';
import RSVPModal from './components/RSVPModal';
import GigDetailModal from './components/GigDetailModal';
import { getMajorCitiesForDropdown } from './utils/irishLocations';
import './GigsPage.css';

export interface Gig {
  _id: string;
  title: string;
  slug?: { current: string };
  venue: {
    _id: string;
    name: string;
    address?: {
      city?: string;
      county?: string;
      street?: string;
    };
  };
  headliner?: {
    _id: string;
    name: string;
    genre?: string;
  };
  supportActs?: Array<{
    _id: string;
    name: string;
  }>;
  date: string;
  ticketPrice?: number;
  ticketUrl?: string;
  description?: string;
  poster?: any;
  status: 'upcoming' | 'sold_out' | 'cancelled' | 'completed';
  genre?: {
    name: string;
    slug: { current: string };
  };
  ageRestriction?: string;
  featured?: boolean;
}

export interface UserRSVP {
  gigId: string;
  status: 'attending' | 'interested' | 'not_attending';
  reminder?: boolean;
  notes?: string;
}

const GigsPage: React.FC = () => {
  const { user } = useAuth();
  const { data: gigsData, loading, error, refetch } = useGigs();
  
  // State management
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [showRSVPModal, setShowRSVPModal] = useState(false);
  const [showGigDetail, setShowGigDetail] = useState(false);
  const [userRSVPs, setUserRSVPs] = useState<UserRSVP[]>([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    searchQuery: '',
    selectedCity: '',
    selectedGenre: '',
    dateRange: 'all', // 'today', 'week', 'month', 'all'
    ageRestriction: '',
    priceRange: '',
    status: 'upcoming'
  });

  const gigs: Gig[] = Array.isArray(gigsData) ? gigsData : [];

  // Load user RSVPs from localStorage (in a real app, this would be from your backend)
  useEffect(() => {
    const savedRSVPs = localStorage.getItem(`rsvps_${user?.uid || 'anonymous'}`);
    if (savedRSVPs) {
      setUserRSVPs(JSON.parse(savedRSVPs));
    }
  }, [user]);

  // Save RSVPs to localStorage
  const saveRSVPs = (rsvps: UserRSVP[]) => {
    setUserRSVPs(rsvps);
    localStorage.setItem(`rsvps_${user?.uid || 'anonymous'}`, JSON.stringify(rsvps));
  };

  // Filter gigs based on current filters
  const filteredGigs = gigs.filter(gig => {
    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesTitle = gig.title.toLowerCase().includes(query);
      const matchesVenue = gig.venue.name.toLowerCase().includes(query);
      const matchesHeadliner = gig.headliner?.name.toLowerCase().includes(query);
      const matchesDescription = gig.description?.toLowerCase().includes(query);
      
      if (!matchesTitle && !matchesVenue && !matchesHeadliner && !matchesDescription) {
        return false;
      }
    }

    // Location filter
    if (filters.selectedCity) {
      const venueCity = gig.venue.address?.city || '';
      const venueCounty = gig.venue.address?.county || '';
      if (!venueCity.includes(filters.selectedCity) && !venueCounty.includes(filters.selectedCity)) {
        return false;
      }
    }

    // Genre filter
    if (filters.selectedGenre && gig.genre?.name !== filters.selectedGenre) {
      return false;
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const gigDate = new Date(gig.date);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (filters.dateRange) {
        case 'today':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          if (gigDate < today || gigDate >= tomorrow) return false;
          break;
        case 'week':
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          if (gigDate < today || gigDate >= nextWeek) return false;
          break;
        case 'month':
          const nextMonth = new Date(today);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          if (gigDate < today || gigDate >= nextMonth) return false;
          break;
      }
    }

    // Age restriction filter
    if (filters.ageRestriction && gig.ageRestriction !== filters.ageRestriction) {
      return false;
    }

    // Price range filter
    if (filters.priceRange && gig.ticketPrice) {
      const [min, max] = filters.priceRange.split('-').map(Number);
      if (max && (gig.ticketPrice < min || gig.ticketPrice > max)) {
        return false;
      } else if (!max && gig.ticketPrice < min) {
        return false;
      }
    }

    // Status filter
    if (filters.status !== 'all' && gig.status !== filters.status) {
      return false;
    }

    return true;
  });

  // Handle RSVP
  const handleRSVP = (gig: Gig, status: 'attending' | 'interested' | 'not_attending', reminder = false) => {
    const existingRSVPIndex = userRSVPs.findIndex(rsvp => rsvp.gigId === gig._id);
    const newRSVP: UserRSVP = {
      gigId: gig._id,
      status,
      reminder,
      notes: ''
    };

    let updatedRSVPs;
    if (existingRSVPIndex >= 0) {
      updatedRSVPs = [...userRSVPs];
      updatedRSVPs[existingRSVPIndex] = newRSVP;
    } else {
      updatedRSVPs = [...userRSVPs, newRSVP];
    }

    saveRSVPs(updatedRSVPs);
    setShowRSVPModal(false);

    // Set reminder if requested (in a real app, this would trigger email/push notifications)
    if (reminder) {
      console.log(`Reminder set for ${gig.title} on ${new Date(gig.date).toLocaleDateString()}`);
      // TODO: Implement actual reminder system
    }
  };

  // Get user's RSVP status for a gig
  const getUserRSVP = (gigId: string): UserRSVP | undefined => {
    return userRSVPs.find(rsvp => rsvp.gigId === gigId);
  };

  // Handle gig click
  const handleGigClick = (gig: Gig) => {
    setSelectedGig(gig);
    setShowGigDetail(true);
  };

  // Generate calendar download link
  const generateCalendarLink = (gig: Gig) => {
    const startDate = new Date(gig.date);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 3); // Assume 3-hour event

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const details = `${gig.description || ''}\n\nVenue: ${gig.venue.name}\n${gig.ticketUrl ? `Tickets: ${gig.ticketUrl}` : ''}`;
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(gig.title)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(gig.venue.name)}`;
    
    return googleCalendarUrl;
  };

  if (loading) {
    return (
      <div className="gigs-page">
        <div className="gigs-loading">
          <div className="loading-spinner"></div>
          <p>Loading upcoming gigs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gigs-page">
        <div className="gigs-error">
          <h2>Error Loading Gigs</h2>
          <p>{error}</p>
          <button onClick={() => refetch?.()} className="retry-button">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gigs-page">
      <div className="gigs-header">
        <h1>🎵 Irish Gigs</h1>
        <p>Discover live music across Ireland - from Dublin venues to Cork pubs</p>
        
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            📋 List View
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            📅 Calendar View
          </button>
        </div>
      </div>

      <GigsFilters 
        filters={filters}
        onFiltersChange={setFilters}
        totalGigs={filteredGigs.length}
      />

      {viewMode === 'list' ? (
        <GigsList 
          gigs={filteredGigs}
          userRSVPs={userRSVPs}
          onGigClick={handleGigClick}
          onRSVPClick={(gig: Gig) => {
            setSelectedGig(gig);
            setShowRSVPModal(true);
          }}
          generateCalendarLink={generateCalendarLink}
          isLoggedIn={!!user}
        />
      ) : (
        <GigsCalendar 
          gigs={filteredGigs}
          userRSVPs={userRSVPs}
          onGigClick={handleGigClick}
          onDateSelect={(date: Date) => {
            // Filter to selected date
            setFilters(prev => ({ ...prev, dateRange: 'today' }));
          }}
        />
      )}

      {/* RSVP Modal */}
      {showRSVPModal && selectedGig && (
        <RSVPModal
          gig={selectedGig}
          currentRSVP={getUserRSVP(selectedGig._id)}
          onRSVP={handleRSVP}
          onClose={() => setShowRSVPModal(false)}
          isLoggedIn={!!user}
        />
      )}

      {/* Gig Detail Modal */}
      {showGigDetail && selectedGig && (
        <GigDetailModal
          gig={selectedGig}
          userRSVP={getUserRSVP(selectedGig._id)}
          onRSVP={() => setShowRSVPModal(true)}
          onClose={() => setShowGigDetail(false)}
          generateCalendarLink={generateCalendarLink}
          isLoggedIn={!!user}
        />
      )}
    </div>
  );
};

export default GigsPage;
