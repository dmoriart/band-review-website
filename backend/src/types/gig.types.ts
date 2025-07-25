export interface GigData {
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

export interface ApiGigData {
  id: string;
  title: string;
  artist: string;
  venue: {
    name: string;
    city: string;
    country: string;
    address: string;
  };
  date: string;
  description?: string;
  ticketUrl?: string;
  ticketPrice?: number;
  image?: string;
  source: 'bandsintown' | 'songkick' | 'eventbrite' | 'manual';
  sourceUrl?: string;
  genres?: string[];
  ageRestriction?: string;
  status: 'upcoming' | 'sold_out' | 'cancelled' | 'completed';
}

export interface ScrapingJob {
  id: string;
  source: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  gigsFound: number;
  errors?: string[];
}

export interface GigProcessingResult {
  source: string;
  gigsScraped: number;
  gigsProcessed: number;
  gigsAdded: number;
  gigsDuplicated: number;
  errors: string[];
}
