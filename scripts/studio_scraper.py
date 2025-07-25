#!/usr/bin/env python3
"""
Music Studios Data Scraper for Ireland
Collects studio information using Google Maps API and website scraping
"""

import requests
import json
import time
import re
import logging
from datetime import datetime
from urllib.parse import urljoin, urlparse
from typing import Dict, List, Optional, Any
import os
import sys
from dataclasses import dataclass, asdict
from bs4 import BeautifulSoup, Tag
import urllib.robotparser
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from irish_locations import get_all_irish_cities_and_towns, get_search_areas_with_coordinates

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('studio_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class StudioContact:
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None

@dataclass
class StudioAddress:
    street: Optional[str] = None
    city: Optional[str] = None
    county: Optional[str] = None
    country: str = "Ireland"
    eircode: Optional[str] = None

@dataclass
class StudioPricing:
    hourlyRate: Optional[float] = None
    halfDayRate: Optional[float] = None
    fullDayRate: Optional[float] = None
    engineerIncluded: bool = False
    mixingRate: Optional[float] = None
    masteringRate: Optional[float] = None
    currency: str = "EUR"

@dataclass
class SoundStudio:
    name: str
    slug: str
    description: Optional[str] = None
    address: Optional[StudioAddress] = None
    location: Optional[Dict[str, float]] = None  # {"lat": float, "lng": float}
    contact: Optional[StudioContact] = None
    profileImage: Optional[str] = None
    images: Optional[List[str]] = None
    amenities: Optional[List[str]] = None
    pricing: Optional[StudioPricing] = None
    genresSupported: Optional[List[str]] = None
    bandFriendly: bool = True
    studioType: str = "professional"
    features: Optional[List[str]] = None
    capacity: Optional[int] = None
    verified: bool = False
    featured: bool = False
    claimed: bool = False
    google_place_id: Optional[str] = None
    google_rating: Optional[float] = None
    google_reviews_count: Optional[int] = None

    def __post_init__(self):
        if self.images is None:
            self.images = []
        if self.amenities is None:
            self.amenities = []
        if self.genresSupported is None:
            self.genresSupported = []
        if self.features is None:
            self.features = []

class MusicStudioScraper:
    def __init__(self, google_api_key: str):
        self.google_api_key = google_api_key
        self.base_url = "https://maps.googleapis.com/maps/api"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.scraped_studios = []
        
        # Common search terms for music studios
        self.search_terms = [
            "recording studio",
            "music studio", 
            "sound studio",
            "audio recording",
            "music production",
            "recording facility"
        ]
        
        # Get standardized Irish search areas
        self.search_areas = get_search_areas_with_coordinates()
        self.irish_cities = get_all_irish_cities_and_towns()

    def check_robots_txt(self, url: str) -> bool:
        """Check if scraping is allowed by robots.txt"""
        try:
            parsed_url = urlparse(url)
            robots_url = f"{parsed_url.scheme}://{parsed_url.netloc}/robots.txt"
            
            rp = urllib.robotparser.RobotFileParser()
            rp.set_url(robots_url)
            rp.read()
            
            return rp.can_fetch('*', url)
        except Exception as e:
            logger.warning(f"Could not check robots.txt for {url}: {e}")
            return True  # Default to allowing if we can't check

    def create_slug(self, name: str) -> str:
        """Create URL-friendly slug from studio name"""
        slug = re.sub(r'[^\w\s-]', '', name.lower())
        slug = re.sub(r'[-\s]+', '-', slug)
        return slug.strip('-')

    def search_google_places(self, query: str, location: str) -> List[Dict]:
        """Search for studios using Google Places API"""
        url = f"{self.base_url}/place/textsearch/json"
        
        params = {
            'query': f"{query} in {location} Ireland",
            'key': self.google_api_key,
            'type': 'establishment',
            'region': 'ie'  # Ireland region
        }
        
        try:
            logger.info(f"Searching Google Places for: {query} in {location}")
            response = self.session.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            if data.get('status') != 'OK':
                logger.warning(f"Google Places API returned status: {data.get('status')}")
                return []
            
            return data.get('results', [])
            
        except Exception as e:
            logger.error(f"Error searching Google Places: {e}")
            return []

    def get_place_details(self, place_id: str) -> Dict:
        """Get detailed information about a place"""
        url = f"{self.base_url}/place/details/json"
        
        params = {
            'place_id': place_id,
            'key': self.google_api_key,
            'fields': 'name,formatted_address,geometry,formatted_phone_number,website,rating,user_ratings_total,photos,opening_hours,reviews'
        }
        
        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            if data.get('status') == 'OK':
                return data.get('result', {})
            else:
                logger.warning(f"Place details API returned status: {data.get('status')}")
                return {}
                
        except Exception as e:
            logger.error(f"Error getting place details: {e}")
            return {}

    def get_place_photo_url(self, photo_reference: str, max_width: int = 800) -> Optional[str]:
        """Get photo URL from Google Places photo reference"""
        if not photo_reference:
            return None
            
        url = f"{self.base_url}/place/photo"
        params = {
            'photo_reference': photo_reference,
            'maxwidth': max_width,
            'key': self.google_api_key
        }
        
        # This returns a redirect, so we get the final URL
        try:
            response = self.session.get(url, params=params, allow_redirects=False)
            if response.status_code == 302:
                return response.headers.get('Location')
        except Exception as e:
            logger.error(f"Error getting photo URL: {e}")
        
        return None

    def parse_address(self, formatted_address: str) -> StudioAddress:
        """Parse Google's formatted address into components"""
        if not formatted_address:
            return StudioAddress()
        
        # Split by commas and clean up
        parts = [part.strip() for part in formatted_address.split(',')]
        
        address = StudioAddress()
        
        # Last part should be country
        if parts and parts[-1].lower() in ['ireland', 'northern ireland']:
            address.country = parts[-1]
            parts = parts[:-1]
        
        # Second to last might be county
        if len(parts) >= 2:
            potential_county = parts[-1].strip()
            # Check if it looks like a county (often starts with "Co." or ends with common county suffixes)
            if (potential_county.startswith('Co.') or 
                any(potential_county.endswith(suffix) for suffix in ['shire', 'ford', 'low', 'try'])):
                address.county = potential_county
                parts = parts[:-1]
        
        # Try to identify city (usually the last remaining part after removing county)
        if parts:
            address.city = parts[-1].strip()
            parts = parts[:-1]
        
        # Remaining parts form the street address
        if parts:
            address.street = ', '.join(parts).strip()
        
        return address

    def scrape_website_details(self, website_url: str) -> Dict[str, Any]:
        """Scrape additional details from studio website"""
        if not website_url or not self.check_robots_txt(website_url):
            return {}
        
        details = {
            'contact': {},
            'amenities': [],
            'pricing': {},
            'description': None,
            'genres': [],
            'features': []
        }
        
        try:
            logger.info(f"Scraping website: {website_url}")
            time.sleep(2)  # Be respectful
            
            response = self.session.get(website_url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract email addresses
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            emails = re.findall(email_pattern, response.text)
            if emails:
                details['contact']['email'] = emails[0]
            
            # Extract phone numbers (Irish format)
            phone_pattern = r'(\+353|0)\s*\d{1,2}\s*\d{3,4}\s*\d{4}'
            phones = re.findall(phone_pattern, response.text)
            if phones:
                details['contact']['phone'] = phones[0]
            
            # Look for social media links
            for link in soup.find_all('a', href=True):
                href = link['href']
                if 'facebook.com' in href:
                    details['contact']['facebook'] = href
                elif 'instagram.com' in href:
                    details['contact']['instagram'] = href
                elif 'twitter.com' in href:
                    details['contact']['twitter'] = href
            
            # Extract description from meta tags or about sections
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc and isinstance(meta_desc, Tag):
                content = meta_desc.get('content')
                if content:
                    details['description'] = str(content).strip()
            
            # Look for equipment/amenities keywords
            text_content = soup.get_text().lower()
            
            equipment_keywords = [
                'pro tools', 'logic pro', 'cubase', 'reaper', 'ableton',
                'mixing console', 'ssl', 'neve', 'api', 'focusrite',
                'microphone', 'neumann', 'akg', 'shure', 'rode',
                'monitors', 'yamaha', 'genelec', 'krk', 'adam',
                'piano', 'grand piano', 'keyboard', 'synthesizer',
                'guitar amp', 'bass amp', 'drum kit', 'percussion',
                'vocal booth', 'live room', 'control room', 'isolation booth',
                'mastering', 'mixing', 'tracking', 'overdubbing'
            ]
            
            for keyword in equipment_keywords:
                if keyword in text_content:
                    details['amenities'].append(keyword.replace(' ', '_'))
            
            # Look for pricing information
            price_pattern = r'[€£$]\s*(\d+)'
            prices = re.findall(price_pattern, response.text)
            if prices:
                # Try to categorize prices (this is basic and may need refinement)
                price_values = [int(p) for p in prices if int(p) < 1000]  # Filter out unrealistic prices
                if price_values:
                    details['pricing']['hourlyRate'] = min(price_values)  # Take the lowest as likely hourly rate
            
            # Look for genre keywords
            genre_keywords = [
                'rock', 'pop', 'jazz', 'classical', 'electronic', 'hip hop',
                'folk', 'country', 'blues', 'metal', 'punk', 'indie',
                'alternative', 'reggae', 'funk', 'r&b', 'soul'
            ]
            
            for genre in genre_keywords:
                if genre in text_content:
                    details['genres'].append(genre)
            
        except Exception as e:
            logger.error(f"Error scraping website {website_url}: {e}")
        
        return details

    def process_google_place(self, place_data: Dict) -> Optional[SoundStudio]:
        """Convert Google Places data to SoundStudio object"""
        try:
            # Get detailed information
            place_details = self.get_place_details(place_data['place_id'])
            if not place_details:
                return None
            
            name = place_details.get('name', '')
            if not name:
                return None
            
            # Create studio object
            studio = SoundStudio(
                name=name,
                slug=self.create_slug(name),
                google_place_id=place_data['place_id'],
                google_rating=place_details.get('rating'),
                google_reviews_count=place_details.get('user_ratings_total')
            )
            
            # Parse address
            formatted_address = place_details.get('formatted_address', '')
            studio.address = self.parse_address(formatted_address)
            
            # Extract location coordinates
            geometry = place_details.get('geometry', {})
            location = geometry.get('location', {})
            if location:
                studio.location = {
                    'lat': location.get('lat'),
                    'lng': location.get('lng')
                }
            
            # Set contact information
            studio.contact = StudioContact()
            if place_details.get('formatted_phone_number'):
                studio.contact.phone = place_details['formatted_phone_number']
            if place_details.get('website'):
                studio.contact.website = place_details['website']
            
            # Get first photo if available
            photos = place_details.get('photos', [])
            if photos:
                photo_ref = photos[0].get('photo_reference')
                if photo_ref:
                    studio.profileImage = self.get_place_photo_url(photo_ref)
            
            # Try to scrape additional details from website
            if studio.contact.website:
                website_details = self.scrape_website_details(studio.contact.website)
                
                # Update contact info
                contact_info = website_details.get('contact', {})
                if contact_info.get('email'):
                    studio.contact.email = contact_info['email']
                if contact_info.get('facebook'):
                    studio.contact.facebook = contact_info['facebook']
                if contact_info.get('instagram'):
                    studio.contact.instagram = contact_info['instagram']
                if contact_info.get('twitter'):
                    studio.contact.twitter = contact_info['twitter']
                
                # Update other details
                if website_details.get('description'):
                    studio.description = website_details['description']
                
                if website_details.get('amenities'):
                    if studio.amenities is None:
                        studio.amenities = []
                    studio.amenities.extend(website_details['amenities'])
                
                if website_details.get('genres'):
                    if studio.genresSupported is None:
                        studio.genresSupported = []
                    studio.genresSupported.extend(website_details['genres'])
                
                # Set pricing if found
                pricing_info = website_details.get('pricing', {})
                if pricing_info:
                    studio.pricing = StudioPricing()
                    if pricing_info.get('hourlyRate'):
                        studio.pricing.hourlyRate = pricing_info['hourlyRate']
            
            return studio
            
        except Exception as e:
            logger.error(f"Error processing Google Place data: {e}")
            return None

    def search_all_studios(self) -> List[SoundStudio]:
        """Search for all music studios across Irish search areas"""
        all_studios = []
        seen_place_ids = set()
        
        for area in self.search_areas:
            logger.info(f"Searching in {area['name']}...")
            
            for search_term in self.search_terms:
                try:
                    places = self.search_google_places(search_term, area['name'])
                    
                    for place in places:
                        place_id = place.get('place_id')
                        if place_id in seen_place_ids:
                            continue
                        
                        seen_place_ids.add(place_id)
                        
                        studio = self.process_google_place(place)
                        if studio:
                            all_studios.append(studio)
                            logger.info(f"Found studio: {studio.name} in {studio.address.city if studio.address else 'Unknown'}")
                    
                    # Rate limiting
                    time.sleep(1)
                    
                except Exception as e:
                    logger.error(f"Error searching {search_term} in {area['name']}: {e}")
                    continue
        
        return all_studios

    def save_to_json(self, studios: List[SoundStudio], filename: str = 'irish_music_studios.json'):
        """Save studios data to JSON file"""
        studios_data = []
        
        for studio in studios:
            studio_dict = asdict(studio)
            # Clean up None values and empty lists
            studio_dict = {k: v for k, v in studio_dict.items() if v is not None and v != []}
            studios_data.append(studio_dict)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(studios_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved {len(studios_data)} studios to {filename}")

    def create_sanity_import_format(self, studios: List[SoundStudio], filename: str = 'studios_sanity_import.ndjson'):
        """Create NDJSON format for Sanity import"""
        with open(filename, 'w', encoding='utf-8') as f:
            for studio in studios:
                # Create Sanity document format
                sanity_doc = {
                    '_type': 'soundStudio',
                    'name': studio.name,
                    'slug': {
                        '_type': 'slug',
                        'current': studio.slug
                    },
                    'description': studio.description,
                    'address': asdict(studio.address) if studio.address else None,
                    'location': {
                        '_type': 'geopoint',
                        'lat': studio.location['lat'],
                        'lng': studio.location['lng']
                    } if studio.location else None,
                    'contact': asdict(studio.contact) if studio.contact else None,
                    'amenities': studio.amenities,
                    'pricing': asdict(studio.pricing) if studio.pricing else None,
                    'genresSupported': studio.genresSupported,
                    'bandFriendly': studio.bandFriendly,
                    'studioType': studio.studioType,
                    'features': studio.features,
                    'capacity': studio.capacity,
                    'verified': studio.verified,
                    'featured': studio.featured,
                    'claimed': studio.claimed
                }
                
                # Remove None values
                sanity_doc = {k: v for k, v in sanity_doc.items() if v is not None}
                
                f.write(json.dumps(sanity_doc, ensure_ascii=False) + '\n')
        
        logger.info(f"Created Sanity import file: {filename}")

def main():
    # Load Google Maps API key from environment
    GOOGLE_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
    
    if not GOOGLE_API_KEY:
        logger.error("GOOGLE_MAPS_API_KEY environment variable not found!")
        logger.error("Please set your Google Maps API key in a .env file or environment variable")
        return
    
    scraper = MusicStudioScraper(GOOGLE_API_KEY)
    
    logger.info("Starting music studios data collection...")
    
    # Search for studios
    studios = scraper.search_all_studios()
    
    logger.info(f"Found {len(studios)} studios total")
    
    # Save results
    scraper.save_to_json(studios)
    scraper.create_sanity_import_format(studios)
    
    # Print summary
    print(f"\n=== SCRAPING SUMMARY ===")
    print(f"Total studios found: {len(studios)}")
    print(f"Studios with websites: {len([s for s in studios if s.contact and s.contact.website])}")
    print(f"Studios with phone numbers: {len([s for s in studios if s.contact and s.contact.phone])}")
    print(f"Studios with photos: {len([s for s in studios if s.profileImage])}")
    
    # Show sample data
    if studios:
        print(f"\n=== SAMPLE STUDIO ===")
        sample = studios[0]
        print(f"Name: {sample.name}")
        print(f"Location: {sample.address.city if sample.address else 'Unknown'}")
        print(f"Website: {sample.contact.website if sample.contact else 'None'}")
        print(f"Amenities: {', '.join(sample.amenities[:5]) if sample.amenities else 'None'}")

if __name__ == "__main__":
    main()
