// Sanity client configuration for frontend integration
import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.REACT_APP_SANITY_PROJECT_ID || 'sy7ko2cx',
  dataset: process.env.REACT_APP_SANITY_DATASET || 'production',
  useCdn: false, // Disable CDN to ensure fresh data and avoid caching issues
  apiVersion: '2022-06-01', // Use stable API version
  withCredentials: false, // Explicitly disable credentials to avoid CORS issues
  timeout: 30000, // 30 second timeout for slower connections
  requestTagPrefix: 'bandvenuereview-', // Add request tag prefix for debugging
})

// Helper for generating image URLs
const builder = imageUrlBuilder(client)
export const urlFor = (source: any) => builder.image(source)

// GROQ queries for your application
export const queries = {
  // Get all bands with basic info
  allBands: `*[_type == "band"] | order(name asc) {
    _id,
    name,
    slug,
    bio,
    genres[]->{name, slug},
    locationText,
    formedYear,
    profileImage,
    socialLinks,
    verified,
    featured
  }`,

  // Get all venues with basic info
  allVenues: `*[_type == "venue"] | order(name asc) {
    _id,
    name,
    slug,
    description,
    address,
    contact,
    capacity,
    venueType,
    heroImage,
    verified,
    claimed,
    featured
  }`,

  // Get band by slug with full details
  bandBySlug: `*[_type == "band" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    bio,
    genres[]->{name, slug, color},
    locationText,
    formedYear,
    profileImage,
    bannerImage,
    gallery,
    socialLinks,
    members,
    verified,
    featured
  }`,

  // Get venue by slug with full details
  venueBySlug: `*[_type == "venue" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    description,
    address,
    location,
    contact,
    capacity,
    venueType,
    primaryGenres[]->{name, slug, color},
    facilities,
    techSpecs,
    heroImage,
    gallery,
    verified,
    claimed,
    featured
  }`,

  // Get reviews for a specific venue
  reviewsByVenue: `*[_type == "review" && venue._ref == $venueId && published == true] | order(_createdAt desc) {
    _id,
    title,
    reviewer->{name, slug, profileImage},
    overallRating,
    ratings,
    reviewText,
    photos,
    gigDate,
    gigDetails,
    wouldPlayAgain,
    recommendToOthers,
    featured,
    _createdAt
  }`,

  // Get reviews by a specific band
  reviewsByBand: `*[_type == "review" && reviewer._ref == $bandId && published == true] | order(_createdAt desc) {
    _id,
    title,
    venue->{name, slug, heroImage},
    overallRating,
    ratings,
    reviewText,
    photos,
    gigDate,
    gigDetails,
    wouldPlayAgain,
    recommendToOthers,
    featured,
    _createdAt
  }`,

  // Get upcoming gigs
  upcomingGigs: `*[_type == "gig" && date > now() && status == "upcoming"] | order(date asc) {
    _id,
    title,
    slug,
    venue->{name, slug, address, heroImage},
    headliner->{name, slug, profileImage},
    supportActs[]->{name, slug, profileImage},
    date,
    ticketPrice,
    ticketUrl,
    poster,
    status,
    ageRestriction
  }`,

  // Get featured content
  featuredContent: `{
    "bands": *[_type == "band" && featured == true] | order(_createdAt desc) [0...4] {
      _id, name, slug, bio, profileImage, locationText, verified
    },
    "venues": *[_type == "venue" && featured == true] | order(_createdAt desc) [0...4] {
      _id, name, slug, description, heroImage, address, verified, claimed
    },
    "reviews": *[_type == "review" && featured == true && published == true] | order(_createdAt desc) [0...4] {
      _id, title, reviewer->{name, slug}, venue->{name, slug}, overallRating, photos[0], _createdAt
    },
    "gigs": *[_type == "gig" && featured == true && date > now()] | order(date asc) [0...4] {
      _id, title, slug, venue->{name, slug}, headliner->{name, slug}, date, poster
    }
  }`,

  // Search across all content
  searchAll: `{
    "bands": *[_type == "band" && (name match $searchTerm || bio match $searchTerm)] {
      _id, _type, name, slug, bio, profileImage, locationText
    },
    "venues": *[_type == "venue" && (name match $searchTerm || description match $searchTerm)] {
      _id, _type, name, slug, description, heroImage, address
    },
    "reviews": *[_type == "review" && published == true && (title match $searchTerm || pt::text(reviewText) match $searchTerm)] {
      _id, _type, title, reviewer->{name, slug}, venue->{name, slug}, overallRating
    }
  }`
}

// Helper functions for common operations
export const sanityHelpers = {
  // Get image URL with transformations
  getImageUrl: (image: any, width?: number, height?: number) => {
    if (!image) return null
    let url = urlFor(image)
    if (width) url = url.width(width)
    if (height) url = url.height(height)
    return url.url()
  },

  // Format portable text to plain text
  portableTextToPlainText: (blocks: any[] = []) => {
    return blocks
      .map(block => {
        if (block._type !== 'block' || !block.children) {
          return ''
        }
        return block.children.map((child: any) => child.text).join('')
      })
      .join('\n\n')
  },

  // Calculate average rating from detailed ratings
  calculateAverageRating: (ratings: any) => {
    if (!ratings) return 0
    const values = Object.values(ratings).filter(rating => typeof rating === 'number') as number[]
    if (values.length === 0) return 0
    return values.reduce((sum, rating) => sum + rating, 0) / values.length
  }
}
