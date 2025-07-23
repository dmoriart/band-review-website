import { useState, useEffect } from 'react'
import { client } from '../sanity'

// Generic hook for fetching Sanity data
export function useSanityData<T>(query: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async (retryCount = 0) => {
      try {
        console.log(`Fetching from Sanity with query (attempt ${retryCount + 1}):`, query)
        console.log('Client config:', {
          projectId: process.env.REACT_APP_SANITY_PROJECT_ID || 'sy7ko2cx',
          dataset: process.env.REACT_APP_SANITY_DATASET || 'production',
          useCdn: false,
          apiVersion: '2022-06-01',
          timeout: 30000
        })
        
        // Type assertion to work around TypeScript definition issues
        const result = await (client as any).fetch(query)
        setData(result)
        setError(null) // Clear any previous errors on success
        console.log('Sanity fetch successful:', result?.length || 'unknown', 'items')
      } catch (err) {
        console.error('Sanity fetch error details:', {
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          query: query,
          attempt: retryCount + 1
        })
        
        // Retry logic for network errors (max 2 retries)
        if (retryCount < 2 && err instanceof Error && 
            (err.message.includes('Request error') || err.message.includes('fetch'))) {
          console.log(`Retrying request in ${(retryCount + 1) * 1000}ms...`)
          setTimeout(() => fetchData(retryCount + 1), (retryCount + 1) * 1000)
          return
        }
        
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data from Sanity CMS'
        setError(`${errorMessage}. Falling back to local data...`)
      } finally {
        if (retryCount === 0) { // Only set loading false on the initial attempt
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [query])

  return { data, loading, error, refetch: () => setLoading(true) }
}

// Specific hooks for common queries
export function useBands() {
  const query = `*[_type == "band" && !(_id in path("drafts.**"))] | order(name asc) {
    _id,
    name,
    slug,
    bio,
    "genres": genres[]->{ name, slug, color },
    locationText,
    formedYear,
    profileImage,
    socialLinks,
    verified,
    featured
  }`
  
  return useSanityData<Array<{
    _id: string
    name: string
    slug: { current: string }
    bio?: string
    genres?: Array<{ name: string; slug: { current: string }; color?: any }>
    locationText?: string
    formedYear?: number
    profileImage?: any
    socialLinks?: Record<string, string>
    verified: boolean
    featured: boolean
  }>>(query)
}

export function useVenues() {
  const query = `*[_type == "venue" && !(_id in path("drafts.**"))] | order(name asc) {
    _id,
    name,
    slug,
    description,
    address,
    location,
    capacity,
    type,
    profileImage,
    contactInfo,
    verified,
    featured
  }`
  
  return useSanityData(query)
}

export function useBandBySlug(slug: string) {
  const query = `*[_type == "band" && slug.current == "${slug}"][0] {
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
  }`
  
  return useSanityData(query)
}

export function useVenueBySlug(slug: string) {
  const query = `*[_type == "venue" && slug.current == "${slug}"][0] {
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
  }`
  
  return useSanityData(query)
}

export function useReviewsByVenue(venueId: string) {
  const query = `*[_type == "review" && venue._ref == "${venueId}" && published == true] | order(_createdAt desc) {
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
  }`
  
  return useSanityData(query)
}

export function useUpcomingGigs() {
  const query = `*[_type == "gig" && date > now() && status == "upcoming"] | order(date asc) {
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
  }`
  
  return useSanityData(query)
}

export function useFeaturedContent() {
  const query = `{
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
  }`
  
  return useSanityData(query)
}
