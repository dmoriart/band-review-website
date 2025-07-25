import { createClient } from '@sanity/client';
import logger from './logger';

// Sanity client configuration for backend services
export const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'sy7ko2cx',
  dataset: process.env.SANITY_DATASET || 'production',
  useCdn: false, // Don't use CDN for backend operations
  apiVersion: '2022-06-01',
  token: process.env.SANITY_API_TOKEN, // Required for write operations
  timeout: 30000,
});

// Helper function to create or get venue reference
export async function createOrGetVenue(venueData: {
  name: string;
  city: string;
  country: string;
  address: string;
}): Promise<string> {
  try {
    // First, try to find existing venue by name and city
    const existingVenue = await sanityClient.fetch(
      `*[_type == "venue" && name == $name && address.city == $city][0]`,
      { name: venueData.name, city: venueData.city }
    );

    if (existingVenue?._id) {
      logger.debug(`Found existing venue: ${venueData.name}`);
      return existingVenue._id;
    }

    // Create new venue if not found
    const newVenue = await sanityClient.create({
      _type: 'venue',
      name: venueData.name,
      slug: {
        _type: 'slug',
        current: venueData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      },
      address: {
        street: venueData.address,
        city: venueData.city,
        county: '', // Could be enhanced to map cities to counties
        country: venueData.country
      },
      capacity: null, // Unknown from scraping
      website: null,
      phone: null,
      amenities: [],
      accessibility: null,
      description: `Auto-generated venue from ${venueData.city}, ${venueData.country}`,
      featured: false
    });

    logger.info(`Created new venue: ${venueData.name} (${newVenue._id})`);
    return newVenue._id;
  } catch (error) {
    logger.error(`Error creating/getting venue ${venueData.name}:`, error);
    throw error;
  }
}

// Helper function to create or get band reference
export async function createOrGetBand(artistName: string, genres?: string[]): Promise<string> {
  try {
    // First, try to find existing band by name
    const existingBand = await sanityClient.fetch(
      `*[_type == "band" && name == $name][0]`,
      { name: artistName }
    );

    if (existingBand?._id) {
      logger.debug(`Found existing band: ${artistName}`);
      return existingBand._id;
    }

    // Create new band if not found
    const newBand = await sanityClient.create({
      _type: 'band',
      name: artistName,
      slug: {
        _type: 'slug',
        current: artistName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      },
      bio: `Auto-generated band profile from gig scraping.`,
      locationText: 'Ireland', // Default assumption
      genres: [], // Could be enhanced to map genres
      formedYear: null,
      profileImage: null,
      website: null,
      socialMedia: {
        facebook: null,
        instagram: null,
        twitter: null,
        spotify: null,
        bandcamp: null
      },
      members: [],
      featured: false
    });

    logger.info(`Created new band: ${artistName} (${newBand._id})`);
    return newBand._id;
  } catch (error) {
    logger.error(`Error creating/getting band ${artistName}:`, error);
    throw error;
  }
}

// Helper function to check if gig already exists
export async function checkGigExists(title: string, venueId: string, date: string): Promise<boolean> {
  try {
    const existingGig = await sanityClient.fetch(
      `*[_type == "gig" && title == $title && venue._ref == $venueId && date == $date][0]`,
      { title, venueId, date }
    );

    return !!existingGig;
  } catch (error) {
    logger.error('Error checking if gig exists:', error);
    return false;
  }
}

// Helper function to upload image from URL
export async function uploadImageFromUrl(imageUrl: string, filename: string): Promise<any> {
  try {
    if (!imageUrl || !imageUrl.startsWith('http')) {
      return null;
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      logger.warn(`Failed to fetch image from ${imageUrl}`);
      return null;
    }

    const imageBuffer = await response.arrayBuffer();
    const uploadedImage = await sanityClient.assets.upload('image', Buffer.from(imageBuffer), {
      filename: filename,
      contentType: response.headers.get('content-type') || 'image/jpeg'
    });

    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: uploadedImage._id
      },
      alt: filename
    };
  } catch (error) {
    logger.error(`Error uploading image from ${imageUrl}:`, error);
    return null;
  }
}
