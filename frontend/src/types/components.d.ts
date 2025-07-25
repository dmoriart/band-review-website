// TypeScript module declarations for gigs components
declare module './components/GigsCalendar' {
  import { ComponentType } from 'react';
  import { Gig, UserRSVP } from './GigsPage';
  
  interface GigsCalendarProps {
    gigs: Gig[];
    userRSVPs: UserRSVP[];
    onGigClick: (gig: Gig) => void;
    onDateSelect?: (date: Date) => void;
  }
  
  const GigsCalendar: ComponentType<GigsCalendarProps>;
  export default GigsCalendar;
}

declare module './components/GigsList' {
  import { ComponentType } from 'react';
  import { Gig, UserRSVP } from './GigsPage';
  
  interface GigsListProps {
    gigs: Gig[];
    userRSVPs: UserRSVP[];
    onGigClick: (gig: Gig) => void;
    onRSVPClick: (gig: Gig) => void;
    generateCalendarLink: (gig: Gig) => string;
    isLoggedIn: boolean;
  }
  
  const GigsList: ComponentType<GigsListProps>;
  export default GigsList;
}

declare module './components/GigsFilters' {
  import { ComponentType } from 'react';
  
  interface GigsFiltersProps {
    filters: any;
    onFiltersChange: (filters: any) => void;
    totalGigs: number;
  }
  
  const GigsFilters: ComponentType<GigsFiltersProps>;
  export default GigsFilters;
}

declare module './components/RSVPModal' {
  import { ComponentType } from 'react';
  import { Gig, UserRSVP } from './GigsPage';
  
  interface RSVPModalProps {
    gig: Gig;
    currentRSVP?: UserRSVP;
    onRSVP: (gig: Gig, status: 'attending' | 'interested' | 'not_attending', reminder?: boolean) => void;
    onClose: () => void;
    isLoggedIn: boolean;
  }
  
  const RSVPModal: ComponentType<RSVPModalProps>;
  export default RSVPModal;
}

declare module './components/GigDetailModal' {
  import { ComponentType } from 'react';
  import { Gig, UserRSVP } from './GigsPage';
  
  interface GigDetailModalProps {
    gig: Gig;
    userRSVP?: UserRSVP;
    onRSVP: () => void;
    onClose: () => void;
    generateCalendarLink: (gig: Gig) => string;
    isLoggedIn: boolean;
  }
  
  const GigDetailModal: ComponentType<GigDetailModalProps>;
  export default GigDetailModal;
}
