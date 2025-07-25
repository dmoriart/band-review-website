#!/usr/bin/env python3
"""
Irish Live Music Venues Directory Scraper
Searches for live music venues across Ireland using Google Places API
Covers major cities and regional areas with venue-specific keywords
"""

import requests
import json
import time
import re
import logging
from datetime import datetime
from urllib.parse import urljoin, urlparse
from typing import Dict, List, Optional, Any, Union
import os
import sys
from dataclasses import dataclass, asdict
from difflib import SequenceMatcher

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from irish_locations import get_all_irish_cities_and_towns, get_all_irish_counties, get_search_areas_with_coordinates

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class VenueData:
    name: str
    slug: str
    description: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    county: Optional[str] = None
    country: str = "Ireland"
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    capacity: Optional[int] = None
    venueType: str = "live_music"  # live_music, pub, club, concert_hall, festival_site
    musicGenres: List[str] = None
    hasStage: bool = True
    hasPA: bool = False
    hasLighting: bool = False
    hasParking: bool = False
    isAccessible: bool = False
    allowsAllAges: bool = False
    servesFood: bool = False
    servesAlcohol: bool = False
    bandFriendly: bool = True
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    profileImage: Optional[str] = None
    googlePlaceId: Optional[str] = None
    rating: Optional[float] = None
    totalReviews: Optional[int] = None
    priceLevel: Optional[int] = None  # 0-4 (0=Free, 1=Inexpensive, 2=Moderate, 3=Expensive, 4=Very Expensive)
    
    def __post_init__(self):
        if self.musicGenres is None:
            self.musicGenres = []

class IrishVenueDirectoryScraper:
    def __init__(self, google_api_key: str):
        self.google_api_key = google_api_key
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        
        # Known prominent Irish venues (manually curated seed list)
        self.known_venues = [
            {
                "name": "3Arena",
                "city": "Dublin",
                "type": "arena",
                "description": "Major concert arena in Dublin's Docklands"
            },
            {
                "name": "Olympia Theatre",
                "city": "Dublin", 
                "type": "theatre",
                "description": "Historic Dublin music venue"
            },
            {
                "name": "Vicar Street",
                "city": "Dublin",
                "type": "concert_hall",
                "description": "Intimate Dublin music venue"
            },
            {
                "name": "The Academy",
                "city": "Dublin",
                "type": "club",
                "description": "Multi-room music venue in Dublin"
            },
            {
                "name": "Whelan's",
                "city": "Dublin",
                "type": "pub",
                "description": "Iconic Dublin music pub"
            },
            {
                "name": "The Button Factory",
                "city": "Dublin",
                "type": "club",
                "description": "Dublin live music and club venue"
            },
            {
                "name": "Cyprus Avenue",
                "city": "Cork",
                "type": "concert_hall",
                "description": "Cork's premier live music venue"
            },
            {
                "name": "Cork Opera House",
                "city": "Cork",
                "type": "opera_house",
                "description": "Cork's main performance venue"
            },
            {
                "name": "The Crane Bar",
                "city": "Galway",
                "type": "pub",
                "description": "Traditional music pub in Galway"
            },
            {
                "name": "Roisin Dubh",
                "city": "Galway",
                "type": "pub",
                "description": "Alternative music venue in Galway"
            },
            {
                "name": "Ulster Hall",
                "city": "Belfast",
                "type": "concert_hall",
                "description": "Historic Belfast concert venue"
            },
            {
                "name": "The Empire Music Hall",
                "city": "Belfast",
                "type": "music_hall",
                "description": "Belfast live music venue"
            },
            {
                "name": "Dolan's Warehouse",
                "city": "Limerick",
                "type": "warehouse",
                "description": "Limerick's premier live music venue"
            }
        ]

    def get_irish_search_areas(self) -> List[Dict[str, Any]]:
        """Define search areas covering Ireland comprehensively"""
        return get_search_areas_with_coordinates()

    def get_venue_search_terms(self) -> List[str]:
        """Get comprehensive list of venue search terms"""
        return [
            "live music venue",
            "music venue", 
            "concert venue",
            "music club",
            "live music pub",
            "music bar",
            "concert hall",
            "music hall",
            "band venue",
            "gig venue",
            "performance venue",
            "music theater",
            "music theatre",
            "nightclub with live music",
            "entertainment venue",
            "arts center music",
            "cultural center music"
        ]

    def search_google_places_for_venues(self, area: Dict[str, Any], search_term: str) -> List[Dict]:
        """Search Google Places for music venues in a specific area"""
        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        
        params = {
            'location': f"{area['lat']},{area['lng']}",
            'radius': area['radius'],
            'keyword': search_term,
            'type': 'establishment',
            'key': self.google_api_key
        }
        
        all_places = []
        
        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            if data.get('status') == 'OK':
                places = data.get('results', [])
                logger.info(f"Found {len(places)} venues for '{search_term}' in {area['name']}")
                all_places.extend(places)
                
                # Handle pagination
                while data.get('next_page_token'):
                    time.sleep(2)  # Required delay for next_page_token
                    params['pagetoken'] = data['next_page_token']
                    params.pop('location', None)  # Remove location when using page token
                    params.pop('radius', None)
                    params.pop('keyword', None)
                    params.pop('type', None)
                    
                    response = self.session.get(url, params=params)
                    response.raise_for_status()
                    
                    data = response.json()
                    if data.get('status') == 'OK':
                        places = data.get('results', [])
                        all_places.extend(places)
                        logger.info(f"Found {len(places)} additional venues (pagination)")
                    else:
                        break
            else:
                logger.warning(f"Google Places search failed for {search_term}: {data.get('status')}")
            
            time.sleep(1)  # Rate limiting
            
        except Exception as e:
            logger.error(f"Error searching Google Places for {search_term} in {area['name']}: {e}")
        
        return all_places

    def get_place_details(self, place_id: str) -> Dict:
        """Get detailed information for a specific place"""
        url = "https://maps.googleapis.com/maps/api/place/details/json"
        params = {
            'place_id': place_id,
            'fields': 'name,formatted_address,geometry,formatted_phone_number,website,rating,user_ratings_total,price_level,opening_hours,photos',
            'key': self.google_api_key
        }
        
        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            if data.get('status') == 'OK':
                return data.get('result', {})
        except Exception as e:
            logger.error(f"Error getting place details for {place_id}: {e}")
        
        return {}

    def process_google_place_to_venue(self, place: Dict) -> Optional[VenueData]:
        """Convert Google Place to VenueData"""
        try:
            name = place.get('name', '')
            place_id = place.get('place_id', '')
            
            if not name or not place_id:
                return None
            
            # Get detailed place information
            details = self.get_place_details(place_id)
            if not details:
                return None
            
            # Extract city from address
            address = details.get('formatted_address', '')
            city = self.extract_city_from_address(address)
            
            # Determine venue type based on name and types
            venue_type = self.determine_venue_type(name, place.get('types', []))
            
            venue = VenueData(
                name=name,
                slug=self.create_slug(name),
                description=f"{venue_type.replace('_', ' ').title()} venue in {city}",
                city=city,
                website=details.get('website'),
                phone=details.get('formatted_phone_number'),
                venueType=venue_type,
                googlePlaceId=place_id,
                rating=details.get('rating'),
                totalReviews=details.get('user_ratings_total'),
                priceLevel=details.get('price_level')
            )
            
            # Add location if available
            geometry = details.get('geometry', {})
            location = geometry.get('location', {})
            if location:
                venue.latitude = location.get('lat')
                venue.longitude = location.get('lng')
            
            # Parse address
            if address:
                address_parts = [part.strip() for part in address.split(',')]
                if len(address_parts) >= 2:
                    venue.street = address_parts[0]
                    venue.county = self.extract_county_from_address(address)
            
            # Set venue characteristics based on type
            self.set_venue_characteristics(venue)
            
            return venue
            
        except Exception as e:
            logger.error(f"Error processing place {place.get('name', 'Unknown')}: {e}")
            return None

    def determine_venue_type(self, name: str, types: List[str]) -> str:
        """Determine venue type based on name and Google types"""
        name_lower = name.lower()
        
        # Check Google types first
        if 'night_club' in types:
            return 'club'
        elif 'bar' in types:
            return 'pub'
        elif 'restaurant' in types and any(music_word in name_lower for music_word in ['music', 'live', 'stage']):
            return 'restaurant_with_music'
        
        # Check name patterns
        if any(word in name_lower for word in ['arena', 'stadium']):
            return 'arena'
        elif any(word in name_lower for word in ['opera', 'theatre', 'theater']):
            return 'theatre'
        elif any(word in name_lower for word in ['hall', 'auditorium']):
            return 'concert_hall'
        elif any(word in name_lower for word in ['club', 'disco']):
            return 'club'
        elif any(word in name_lower for word in ['pub', 'bar', 'inn', 'tavern']):
            return 'pub'
        elif any(word in name_lower for word in ['center', 'centre', 'arts']):
            return 'arts_center'
        else:
            return 'live_music'

    def set_venue_characteristics(self, venue: VenueData):
        """Set venue characteristics based on type"""
        venue_type = venue.venueType
        
        if venue_type == 'arena':
            venue.capacity = 5000  # Default estimate
            venue.hasPA = True
            venue.hasLighting = True
            venue.hasParking = True
            venue.isAccessible = True
            venue.servesFood = True
            venue.servesAlcohol = True
        elif venue_type == 'concert_hall':
            venue.capacity = 1000
            venue.hasPA = True
            venue.hasLighting = True
            venue.isAccessible = True
            venue.servesAlcohol = True
        elif venue_type == 'club':
            venue.capacity = 300
            venue.hasPA = True
            venue.hasLighting = True
            venue.servesAlcohol = True
            venue.allowsAllAges = False
        elif venue_type == 'pub':
            venue.capacity = 150
            venue.servesFood = True
            venue.servesAlcohol = True
        elif venue_type == 'theatre':
            venue.capacity = 800
            venue.hasPA = True
            venue.hasLighting = True
            venue.isAccessible = True
            venue.allowsAllAges = True

    def extract_city_from_address(self, address: str) -> str:
        """Extract city from Google Places address"""
        if not address:
            return "Ireland"
        
        parts = [part.strip() for part in address.split(',')]
        
        # Get standardized list of Irish cities
        irish_cities = get_all_irish_cities_and_towns()
        
        for part in parts:
            for city in irish_cities:
                if city.lower() in part.lower():
                    return city
        
        # If no known city found, use the second-to-last part (before country)
        if len(parts) >= 2:
            return parts[-2].strip()
        
        return "Ireland"

    def extract_county_from_address(self, address: str) -> Optional[str]:
        """Extract county from address"""
        irish_counties = get_all_irish_counties()
        
        address_lower = address.lower()
        for county in irish_counties:
            if county.lower() in address_lower:
                return county
        
        return None

    def create_slug(self, name: str) -> str:
        """Create URL-friendly slug from venue name"""
        # Remove special characters and convert to lowercase
        slug = re.sub(r'[^\w\s-]', '', name.lower())
        # Replace spaces with hyphens
        slug = re.sub(r'\s+', '-', slug)
        # Remove multiple hyphens
        slug = re.sub(r'-+', '-', slug)
        # Remove leading/trailing hyphens
        slug = slug.strip('-')
        return slug

    def is_valid_venue(self, venue: VenueData) -> bool:
        """Validate if this looks like a legitimate music venue"""
        name = venue.name.lower()
        
        # Filter out obviously non-venue results
        exclude_keywords = [
            'hotel', 'pharmacy', 'bank', 'shop', 'store', 'supermarket',
            'church', 'school', 'hospital', 'dental', 'medical', 'law',
            'solicitor', 'gym', 'fitness', 'car', 'auto', 'gas station',
            'petrol', 'estate agent', 'hair', 'beauty', 'nail', 'spa'
        ]
        
        for keyword in exclude_keywords:
            if keyword in name and not any(music_word in name for music_word in ['music', 'live', 'venue', 'bar', 'pub']):
                logger.info(f"❌ Filtering out non-venue: {venue.name}")
                return False
        
        # Skip if it's clearly not a venue (no indication of entertainment/music)
        venue_indicators = [
            'music', 'live', 'venue', 'club', 'bar', 'pub', 'hall', 'theatre',
            'theater', 'stage', 'concert', 'performance', 'entertainment',
            'arts', 'cultural', 'center', 'centre', 'opera', 'academy'
        ]
        
        has_venue_indicator = any(indicator in name for indicator in venue_indicators)
        if not has_venue_indicator:
            # Check if it's in our known venues list
            is_known_venue = any(known['name'].lower() in name for known in self.known_venues)
            if not is_known_venue:
                logger.info(f"❌ No venue indicators found: {venue.name}")
                return False
        
        return True

    def deduplicate_venues(self, venues: List[VenueData]) -> List[VenueData]:
        """Remove duplicate venues based on Google Place ID and name similarity"""
        seen_place_ids = set()
        seen_names = set()
        unique_venues = []
        
        for venue in venues:
            # Skip if we've seen this Place ID
            if venue.googlePlaceId and venue.googlePlaceId in seen_place_ids:
                logger.info(f"🔄 Skipping duplicate Place ID: {venue.name}")
                continue
            
            # Check for name similarity (simple approach)
            normalized_name = venue.name.lower().strip()
            is_duplicate = False
            
            for seen_name in seen_names:
                if self.are_names_similar(normalized_name, seen_name):
                    logger.info(f"🔄 Skipping similar name: {venue.name}")
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_venues.append(venue)
                if venue.googlePlaceId:
                    seen_place_ids.add(venue.googlePlaceId)
                seen_names.add(normalized_name)
        
        logger.info(f"✅ Deduplication: {len(venues)} → {len(unique_venues)} venues")
        return unique_venues

    def are_names_similar(self, name1: str, name2: str) -> bool:
        """Check if two venue names are similar enough to be duplicates"""
        # Simple similarity check - could be enhanced with more sophisticated algorithms
        if name1 == name2:
            return True
        
        # Remove common words
        common_words = {'the', 'a', 'an', 'and', 'or', 'of', 'in', 'at', 'to', 'for', 'with'}
        words1 = set(name1.split()) - common_words
        words2 = set(name2.split()) - common_words
        
        # If most words match, consider it similar
        if words1 and words2:
            intersection = len(words1.intersection(words2))
            union = len(words1.union(words2))
            similarity = intersection / union
            return similarity > 0.7
        
        return False

    def scrape_all_venues(self) -> List[VenueData]:
        """Main method to scrape venues from all sources"""
        logger.info("🎵 Starting Irish music venues scraping...")
        
        all_venues = []
        search_areas = self.get_irish_search_areas()
        search_terms = self.get_venue_search_terms()
        
        # Search each area with each search term
        for area in search_areas:
            logger.info(f"🏙️ Searching area: {area['name']}")
            
            for term in search_terms:
                try:
                    logger.info(f"🔍 Searching for '{term}' in {area['name']}...")
                    places = self.search_google_places_for_venues(area, term)
                    
                    for place in places:
                        venue = self.process_google_place_to_venue(place)
                        if venue and self.is_valid_venue(venue):
                            all_venues.append(venue)
                            logger.info(f"✅ Added venue: {venue.name} ({venue.city})")
                        
                        time.sleep(0.5)  # Rate limiting
                        
                except Exception as e:
                    logger.error(f"Error searching {area['name']} for {term}: {e}")
            
            time.sleep(2)  # Longer pause between areas
        
        # Deduplicate
        unique_venues = self.deduplicate_venues(all_venues)
        
        logger.info(f"✅ Total unique venues collected: {len(unique_venues)}")
        return unique_venues

    def save_to_json(self, venues: List[VenueData], filename: str = 'irish_venues_data.json'):
        """Save venues to JSON file"""
        venues_data = [asdict(venue) for venue in venues]
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(venues_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved {len(venues_data)} venues to {filename}")

    def create_sanity_cms_format(self, venues: List[VenueData], filename: str = 'venues_for_sanity.json'):
        """Convert venues to Sanity CMS format"""
        sanity_venues = []
        
        for venue in venues:
            sanity_venue = {
                "_id": venue.slug,
                "_type": "venue",
                "name": venue.name,
                "slug": {"_type": "slug", "current": venue.slug},
                "description": venue.description,
                "address": {
                    "_type": "address",
                    "street": venue.street,
                    "city": venue.city,
                    "county": venue.county,
                    "country": venue.country
                },
                "contact": {
                    "_type": "contact",
                    "phone": venue.phone,
                    "email": venue.email,
                    "website": venue.website,
                    "facebook": venue.facebook,
                    "instagram": venue.instagram,
                    "twitter": venue.twitter
                },
                "venueDetails": {
                    "_type": "venueDetails",
                    "capacity": venue.capacity,
                    "venueType": venue.venueType,
                    "hasStage": venue.hasStage,
                    "hasPA": venue.hasPA,
                    "hasLighting": venue.hasLighting,
                    "hasParking": venue.hasParking,
                    "isAccessible": venue.isAccessible,
                    "allowsAllAges": venue.allowsAllAges,
                    "servesFood": venue.servesFood,
                    "servesAlcohol": venue.servesAlcohol
                },
                "musicGenres": venue.musicGenres,
                "location": {
                    "_type": "geopoint",
                    "lat": venue.latitude,
                    "lng": venue.longitude
                } if venue.latitude and venue.longitude else None,
                "googleData": {
                    "_type": "googleData",
                    "placeId": venue.googlePlaceId,
                    "rating": venue.rating,
                    "totalReviews": venue.totalReviews,
                    "priceLevel": venue.priceLevel
                },
                "bandFriendly": venue.bandFriendly,
                "verified": False,
                "featured": False
            }
            
            # Remove None values
            sanity_venue = {k: v for k, v in sanity_venue.items() if v is not None}
            sanity_venues.append(sanity_venue)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(sanity_venues, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Created Sanity CMS format file: {filename}")

def main():
    """Main execution function"""
    # Get Google API key from environment
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    if not api_key:
        api_key = "AIzaSyCEjWukCdjVFH8PuUWlz9AQ7GQse87NhZA"  # Your existing key
        logger.warning("Using hardcoded API key - consider using environment variable")
    
    scraper = IrishVenueDirectoryScraper(api_key)
    
    try:
        # Scrape all venues
        venues = scraper.scrape_all_venues()
        
        # Save results
        scraper.save_to_json(venues)
        scraper.create_sanity_cms_format(venues)
        
        # Print summary
        print(f"\n📊 SCRAPING SUMMARY:")
        print(f"Total venues found: {len(venues)}")
        
        city_counts = {}
        type_counts = {}
        
        for venue in venues:
            city_counts[venue.city] = city_counts.get(venue.city, 0) + 1
            type_counts[venue.venueType] = type_counts.get(venue.venueType, 0) + 1
        
        print(f"\n🏙️ By City:")
        for city, count in sorted(city_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"  {city}: {count}")
        
        print(f"\n🎭 By Type:")
        for venue_type, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"  {venue_type}: {count}")
        
        print(f"\n✅ Scraping completed successfully!")
        print(f"📁 Files saved:")
        print(f"  - irish_venues_data.json")
        print(f"  - venues_for_sanity.json")
        
    except Exception as e:
        logger.error(f"❌ Scraping failed: {e}")
        raise

if __name__ == "__main__":
    main()
