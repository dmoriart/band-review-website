export interface SoundStudioImport {
  _id: string;
  _type: 'soundStudio';
  name: string;
  slug: {
    _type: 'slug';
    current: string;
  };
  description?: string;
  address?: {
    street?: string;
    city?: string;
    county?: string;
    country?: string;
    eircode?: string;
  };
  location?: {
    _type: 'geopoint';
    lat: number;
    lng: number;
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  pricing?: {
    hourlyRate?: number;
    halfDayRate?: number;
    fullDayRate?: number;
    currency: string;
    engineerIncluded?: boolean;
  };
  amenities?: string[];
  genresSupported?: string[];
  features?: string[];
  capacity?: number;
  bandFriendly: boolean;
  studioType: string;
  verified: boolean;
  featured: boolean;
  claimed: boolean;
  openingHours?: Record<string, string>;
  _profileImageUrl?: string; // For manual image import
  _createdAt: string;
  _updatedAt: string;
}

export const STUDIO_AMENITIES = [
  'ssl_console',
  'neve_console', 
  'api_console',
  'pro_tools',
  'logic_pro',
  'cubase',
  'ableton',
  'reaper',
  'neumann_microphones',
  'vintage_microphones',
  'genelec_monitors',
  'yamaha_monitors',
  'grand_piano',
  'vintage_equipment',
  'live_room',
  'vocal_booth',
  'control_room',
  'mastering_suite',
  'mixing_suite',
  '24_hour_access',
  'residential_accommodation',
  'multiple_rooms'
] as const;

export const STUDIO_GENRES = [
  'rock',
  'pop',
  'indie',
  'alternative',
  'electronic',
  'jazz',
  'classical',
  'folk',
  'country',
  'hip_hop',
  'r_and_b',
  'blues',
  'metal',
  'punk',
  'reggae',
  'traditional'
] as const;

export const STUDIO_TYPES = [
  'professional',
  'home',
  'project',
  'residential',
  'rehearsal',
  'live'
] as const;
