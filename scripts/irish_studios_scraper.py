#!/usr/bin/env python3
"""
Irish Music Studios Directory Scraper
Scrapes specific Irish music directories and websites for studio information
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
from dataclasses import dataclass, asdict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class StudioData:
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
    amenities: Optional[List[str]] = None
    hourlyRate: Optional[float] = None
    genresSupported: Optional[List[str]] = None
    studioType: str = "professional"
    bandFriendly: bool = True
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    profileImage: Optional[str] = None
    
    def __post_init__(self):
        if self.amenities is None:
            self.amenities = []
        if self.genresSupported is None:
            self.genresSupported = []

class IrishStudioDirectoryScraper:
    def __init__(self, google_api_key: str):
        self.google_api_key = google_api_key
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        
        # Expanded Irish music studios (manually curated list)
        self.known_studios = [
            {
                "name": "Windmill Lane Studios",
                "city": "Dublin",
                "website": "https://windmilllanerecording.com/",
                "description": "Legendary Dublin recording studio where U2, Lady Gaga, and many others recorded"
            },
            {
                "name": "Grouse Lodge Studios",
                "city": "Westmeath", 
                "website": "https://grouselodge.com/",
                "description": "Residential recording studio in the Irish countryside"
            },
            {
                "name": "Temple Lane Studios",
                "city": "Dublin",
                "website": "https://templelane.com/",
                "description": "Professional recording studio in Dublin's Temple Bar"
            },
            {
                "name": "Sun Studios",
                "city": "Dublin",
                "website": "https://sunstudios.ie/",
                "description": "Multi-room recording facility in Dublin"
            },
            {
                "name": "Westland Studios",
                "city": "Dublin",
                "website": "https://westlandstudios.com/",
                "description": "State-of-the-art recording facility"
            },
            {
                "name": "Pulse Recording",
                "city": "Dublin",
                "website": "https://pulserecording.ie/",
                "description": "Professional audio recording and production"
            },
            {
                "name": "Big Space Studios",
                "city": "Dublin",
                "website": "https://bigspacestudios.com/",
                "description": "Large format recording studio with live room"
            },
            {
                "name": "Sonic Studios",
                "city": "Cork",
                "website": "https://sonicstudios.ie/",
                "description": "Cork's premier recording facility"
            },
            {
                "name": "Studio 1",
                "city": "Belfast",
                "website": "https://studio1belfast.com/",
                "description": "Professional recording studio in Belfast"
            },
            {
                "name": "Orphan Studios",
                "city": "Dublin",
                "website": "https://orphanstudios.ie/",
                "description": "Boutique recording studio in Dublin"
            },
            # Additional Dublin Studios
            {
                "name": "Clique Recordings",
                "city": "Dublin",
                "website": "https://cliquerecordings.ie/",
                "description": "Modern recording studio in Dublin"
            },
            {
                "name": "JAM Studios",
                "city": "Dublin",
                "website": "https://jamstudios.ie/",
                "description": "Professional recording and rehearsal facility"
            },
            {
                "name": "Depot Recording Studios",
                "city": "Dublin",
                "website": "https://depotrecording.ie/",
                "description": "High-end recording facility in Dublin"
            },
            {
                "name": "Darklands Audio",
                "city": "Dublin",
                "website": "https://darklandsaudio.com/",
                "description": "Professional mixing and mastering studio"
            },
            {
                "name": "Fascination Street Studios Dublin",
                "city": "Dublin",
                "website": "https://fascinationstreet.ie/",
                "description": "World-class recording and mixing facility"
            },
            # Cork Studios
            {
                "name": "Monique Studios",
                "city": "Cork",
                "website": "https://moniquestudios.ie/",
                "description": "Premier recording studio in Cork"
            },
            {
                "name": "De Barras Studios",
                "city": "Cork",
                "website": "https://debarras.ie/",
                "description": "Historic recording venue in Clonakilty"
            },
            {
                "name": "MAD Studios Cork",
                "city": "Cork",
                "website": "https://madstudios.ie/",
                "description": "Modern audio production facility"
            },
            # Belfast Studios
            {
                "name": "Blast Furnace Studios",
                "city": "Belfast",
                "website": "https://blastfurnacestudios.com/",
                "description": "Professional recording studio in Belfast"
            },
            {
                "name": "Start Together Studios",
                "city": "Belfast",
                "website": "https://starttogetherstudios.com/",
                "description": "Independent recording studio"
            },
            {
                "name": "Analogue Catalogue",
                "city": "Belfast",
                "website": "https://analoguecatalogue.com/",
                "description": "Boutique recording and mixing studio"
            },
            # Galway Studios
            {
                "name": "Aimsir Studios",
                "city": "Galway",
                "website": "https://aimsirgalway.com/",
                "description": "Recording studio in Galway"
            },
            {
                "name": "DNA Studios Galway",
                "city": "Galway",
                "website": "https://dnastudios.ie/",
                "description": "Professional recording facility"
            },
            # Limerick Studios
            {
                "name": "Troy Studios Limerick",
                "city": "Limerick",
                "website": "https://troystudios.ie/",
                "description": "State-of-the-art recording facility"
            },
            {
                "name": "Redbox Studios",
                "city": "Limerick",
                "website": "https://redboxstudios.ie/",
                "description": "Modern recording studio in Limerick"
            },
            # Regional Studios
            {
                "name": "Cauldron Studios",
                "city": "Sligo",
                "website": "https://cauldronstudios.ie/",
                "description": "Recording studio in the northwest"
            },
            {
                "name": "Black Mountain Studios",
                "city": "Dundalk",
                "website": "https://blackmountainstudios.ie/",
                "description": "Professional recording in Louth"
            },
            {
                "name": "Ocean Recording Studios",
                "city": "Waterford",
                "website": "https://oceanrecording.ie/",
                "description": "Coastal recording facility"
            },
            {
                "name": "Athlone Audio",
                "city": "Athlone",
                "website": "https://athloneaudio.ie/",
                "description": "Midlands recording studio"
            },
            {
                "name": "Kilkenny Sound",
                "city": "Kilkenny",
                "website": "https://kilkennysound.ie/",
                "description": "Professional audio production"
            }
        ]

    def create_slug(self, name: str) -> str:
        """Create URL-friendly slug"""
        slug = re.sub(r'[^\w\s-]', '', name.lower())
        slug = re.sub(r'[-\s]+', '-', slug)
        return slug.strip('-')

    def extract_contact_from_text(self, text: str) -> Dict[str, str]:
        """Extract contact information from text"""
        contact = {}
        
        # Email regex
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        if emails:
            contact['email'] = emails[0]
        
        # Irish phone number patterns
        phone_patterns = [
            r'(\+353|0)\s*\d{1,2}\s*\d{3,4}\s*\d{4}',
            r'\d{3}\s*\d{4}',
            r'\d{2}\s*\d{3}\s*\d{4}'
        ]
        
        for pattern in phone_patterns:
            phones = re.findall(pattern, text)
            if phones:
                contact['phone'] = phones[0]
                break
        
        return contact

    def geocode_address(self, address: str) -> Optional[Dict[str, float]]:
        """Get coordinates for an address using Google Geocoding API"""
        if not address:
            return None
            
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            'address': f"{address}, Ireland",
            'key': self.google_api_key
        }
        
        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            if data.get('status') == 'OK' and data.get('results'):
                location = data['results'][0]['geometry']['location']
                return {
                    'lat': location['lat'],
                    'lng': location['lng']
                }
        except Exception as e:
            logger.error(f"Geocoding error for {address}: {e}")
        
        return None

    def search_google_places_for_studios(self, city: str) -> List[Dict]:
        """Search Google Places for recording studios in a city"""
        search_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
        
        search_terms = [
            f"recording studio {city} Ireland",
            f"music studio {city} Ireland", 
            f"sound studio {city} Ireland",
            f"audio recording {city} Ireland"
        ]
        
        all_places = []
        seen_place_ids = set()
        
        for term in search_terms:
            try:
                logger.info(f"Searching Google Places: {term}")
                
                params = {
                    'query': term,
                    'key': self.google_api_key,
                    'type': 'establishment'
                }
                
                response = self.session.get(search_url, params=params)
                response.raise_for_status()
                
                data = response.json()
                if data.get('status') == 'OK':
                    for place in data.get('results', []):
                        place_id = place.get('place_id')
                        if place_id and place_id not in seen_place_ids:
                            seen_place_ids.add(place_id)
                            all_places.append(place)
                
                time.sleep(1)  # Rate limiting
                
            except Exception as e:
                logger.error(f"Error searching Google Places for {term}: {e}")
        
        return all_places

    def process_google_place_to_studio(self, place: Dict) -> Optional[StudioData]:
        """Convert Google Place to StudioData"""
        try:
            name = place.get('name', '')
            if not name:
                return None
            
            # Get detailed place information
            details_url = "https://maps.googleapis.com/maps/api/place/details/json"
            params = {
                'place_id': place['place_id'],
                'fields': 'name,formatted_address,geometry,formatted_phone_number,website,rating,user_ratings_total',
                'key': self.google_api_key
            }
            
            response = self.session.get(details_url, params=params)
            response.raise_for_status()
            
            details_data = response.json()
            if details_data.get('status') != 'OK':
                return None
            
            details = details_data.get('result', {})
            
            # Extract city from address
            address = details.get('formatted_address', '')
            city = self.extract_city_from_address(address)
            
            studio = StudioData(
                name=name,
                slug=self.create_slug(name),
                description=f"Recording studio in {city}",
                city=city,
                website=details.get('website'),
                phone=details.get('formatted_phone_number'),
                studioType="professional"
            )
            
            # Add location if available
            geometry = details.get('geometry', {})
            location = geometry.get('location', {})
            if location:
                studio.latitude = location.get('lat')
                studio.longitude = location.get('lng')
            
            # Parse address
            if address:
                address_parts = [part.strip() for part in address.split(',')]
                if len(address_parts) >= 2:
                    studio.street = address_parts[0]
                    for part in address_parts:
                        if 'Co.' in part or 'County' in part:
                            studio.county = part.strip()
                            break
            
            return studio
            
        except Exception as e:
            logger.error(f"Error processing Google Place {place.get('name', 'Unknown')}: {e}")
            return None

    def extract_city_from_address(self, address: str) -> str:
        """Extract city name from formatted address"""
        if not address:
            return "Ireland"
        
        # Split by commas and look for known Irish cities
        parts = [part.strip() for part in address.split(',')]
        
        irish_cities = [
            "Dublin", "Cork", "Belfast", "Galway", "Limerick", "Waterford",
            "Drogheda", "Kilkenny", "Wexford", "Sligo", "Dundalk", "Bray",
            "Navan", "Ennis", "Tralee", "Carlow", "Naas", "Athlone",
            "Portlaoise", "Mullingar", "Clonakilty", "Moate"
        ]
        
        for part in parts:
            for city in irish_cities:
                if city.lower() in part.lower():
                    return city
        
        # If no known city found, use the second-to-last part (before country)
        if len(parts) >= 2:
            return parts[-2].strip()
        
        return "Ireland"
        """Get first photo from Google Places for a studio"""
        # Search for the place
        search_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
        search_params = {
            'query': f"{studio_name} {city} Ireland recording studio",
            'key': self.google_api_key
        }
        
        try:
            response = self.session.get(search_url, params=search_params)
            response.raise_for_status()
            
            data = response.json()
            if data.get('status') == 'OK' and data.get('results'):
                place_id = data['results'][0]['place_id']
                
                # Get place details with photos
                details_url = "https://maps.googleapis.com/maps/api/place/details/json"
                details_params = {
                    'place_id': place_id,
                    'fields': 'photos',
                    'key': self.google_api_key
                }
                
                details_response = self.session.get(details_url, params=details_params)
                details_response.raise_for_status()
                
                details_data = details_response.json()
                if (details_data.get('status') == 'OK' and 
                    details_data.get('result', {}).get('photos')):
                    
                    photo_ref = details_data['result']['photos'][0]['photo_reference']
                    
                    # Get photo URL
                    photo_url = f"https://maps.googleapis.com/maps/api/place/photo"
                    photo_params = {
                        'photo_reference': photo_ref,
                        'maxwidth': 800,
                        'key': self.google_api_key
                    }
                    
                    # This returns a redirect, get the final URL
                    photo_response = self.session.get(photo_url, params=photo_params, allow_redirects=False)
                    if photo_response.status_code == 302:
                        return photo_response.headers.get('Location')
                        
        except Exception as e:
            logger.error(f"Error getting photo for {studio_name}: {e}")
        
        return None

    def scrape_studio_website(self, studio_info: Dict) -> StudioData:
        """Scrape individual studio website for details"""
        name = studio_info['name']
        city = studio_info['city']
        website = studio_info.get('website')
        
        logger.info(f"Processing: {name}")
        
        studio = StudioData(
            name=name,
            slug=self.create_slug(name),
            city=city,
            description=studio_info.get('description', ''),
            website=website,
            studioType="professional"
        )
        
        if website:
            try:
                time.sleep(2)  # Be respectful
                response = self.session.get(website, timeout=10)
                response.raise_for_status()
                
                text_content = response.text.lower()
                
                # Extract contact info
                contact = self.extract_contact_from_text(response.text)
                studio.email = contact.get('email')
                studio.phone = contact.get('phone')
                
                # Look for social media links
                if 'facebook.com' in text_content:
                    fb_match = re.search(r'facebook\.com/[\w.-]+', response.text)
                    if fb_match:
                        studio.facebook = f"https://{fb_match.group()}"
                
                if 'instagram.com' in text_content:
                    ig_match = re.search(r'instagram\.com/[\w.-]+', response.text)
                    if ig_match:
                        studio.instagram = f"https://{ig_match.group()}"
                
                # Extract equipment/amenities
                equipment_keywords = [
                    'pro tools', 'logic pro', 'cubase', 'ableton', 'reaper',
                    'ssl', 'neve', 'api', 'focusrite', 'universal audio',
                    'neumann', 'akg', 'shure', 'rode', 'tube-tech',
                    'genelec', 'yamaha', 'krk', 'adam audio',
                    'piano', 'grand piano', 'hammond', 'vintage',
                    'vocal booth', 'live room', 'control room', 'mastering'
                ]
                
                for keyword in equipment_keywords:
                    if keyword in text_content:
                        if studio.amenities is None:
                            studio.amenities = []
                        studio.amenities.append(keyword.replace(' ', '_'))
                
                # Look for pricing
                price_matches = re.findall(r'[€]\s*(\d+)', response.text)
                if price_matches:
                    prices = [int(p) for p in price_matches if 20 <= int(p) <= 500]
                    if prices:
                        studio.hourlyRate = min(prices)
                
                # Extract genres
                genre_keywords = [
                    'rock', 'pop', 'jazz', 'classical', 'electronic', 'hip hop',
                    'folk', 'country', 'blues', 'metal', 'indie', 'alternative'
                ]
                
                for genre in genre_keywords:
                    if genre in text_content:
                        if studio.genresSupported is None:
                            studio.genresSupported = []
                        studio.genresSupported.append(genre)
                
            except Exception as e:
                logger.error(f"Error scraping {website}: {e}")
        
        # Get coordinates
        address = f"{name}, {city}"
        coords = self.geocode_address(address)
        if coords:
            studio.latitude = coords['lat']
            studio.longitude = coords['lng']
        
        # Get photo from Google Places
        # TODO: Implement photo fetching if needed
        # photo_url = self.get_google_places_photo(name, city)
        # if photo_url:
        #     studio.profileImage = photo_url
        
        return studio

    def scrape_all_studios(self) -> List[StudioData]:
        """Scrape all known studios + discover new ones via Google Places"""
        studios = []
        seen_names = set()  # Track duplicates by name
        seen_websites = set()  # Track duplicates by website
        
        logger.info("🎵 Phase 1: Processing known studios...")
        
        # Process manually curated studios first
        for studio_info in self.known_studios:
            try:
                studio = self.scrape_studio_website(studio_info)
                
                # Check for duplicates
                name_key = studio.name.lower().strip()
                website_key = studio.website.lower().strip() if studio.website else None
                
                if name_key in seen_names:
                    logger.warning(f"⚠️  Duplicate name detected: {studio.name}")
                    continue
                
                if website_key and website_key in seen_websites:
                    logger.warning(f"⚠️  Duplicate website detected: {studio.website}")
                    continue
                
                studios.append(studio)
                seen_names.add(name_key)
                if website_key:
                    seen_websites.add(website_key)
                
                logger.info(f"✓ Processed: {studio.name}")
                time.sleep(1)  # Rate limiting
                
            except Exception as e:
                logger.error(f"Failed to process {studio_info['name']}: {e}")
        
        logger.info(f"🎵 Phase 2: Discovering additional studios via Google Places...")
        
        # Search Google Places for additional studios
        major_cities = ["Dublin", "Cork", "Belfast", "Galway", "Limerick", "Waterford"]
        
        for city in major_cities:
            try:
                logger.info(f"🔍 Searching Google Places in {city}...")
                places = self.search_google_places_for_studios(city)
                
                for place in places:
                    try:
                        studio = self.process_google_place_to_studio(place)
                        if not studio:
                            continue
                        
                        # Check for duplicates
                        name_key = studio.name.lower().strip()
                        website_key = studio.website.lower().strip() if studio.website else None
                        
                        if name_key in seen_names:
                            logger.info(f"⚠️  Skipping duplicate: {studio.name}")
                            continue
                        
                        if website_key and website_key in seen_websites:
                            logger.info(f"⚠️  Skipping duplicate website: {studio.website}")
                            continue
                        
                        # Additional validation
                        if self.is_valid_studio(studio):
                            studios.append(studio)
                            seen_names.add(name_key)
                            if website_key:
                                seen_websites.add(website_key)
                            
                            logger.info(f"🆕 Found new studio: {studio.name} in {studio.city}")
                        
                        time.sleep(0.5)  # Rate limiting
                        
                    except Exception as e:
                        logger.error(f"Error processing place {place.get('name', 'Unknown')}: {e}")
                
            except Exception as e:
                logger.error(f"Error searching {city}: {e}")
        
        logger.info(f"✅ Total studios collected: {len(studios)}")
        return studios

    def is_valid_studio(self, studio: StudioData) -> bool:
        """Validate if this looks like a legitimate recording studio"""
        name = studio.name.lower()
        
        # Filter out obviously non-studio results
        exclude_keywords = [
            'hotel', 'restaurant', 'cafe', 'pub', 'bar', 'shop', 'store',
            'church', 'school', 'hospital', 'bank', 'pharmacy', 'gym',
            'car', 'auto', 'dental', 'medical', 'law', 'solicitor'
        ]
        
        for keyword in exclude_keywords:
            if keyword in name:
                logger.info(f"❌ Filtering out non-studio: {studio.name}")
                return False
        
        # Require studio-related keywords
        studio_keywords = [
            'studio', 'recording', 'audio', 'sound', 'music', 'production',
            'mastering', 'mixing', 'rehearsal'
        ]
        
        has_studio_keyword = any(keyword in name for keyword in studio_keywords)
        if not has_studio_keyword:
            logger.info(f"❌ No studio keywords found: {studio.name}")
            return False
        
        return True

    def save_to_json(self, studios: List[StudioData], filename: str = 'irish_studios_data.json'):
        """Save to JSON file"""
        studios_data = [asdict(studio) for studio in studios]
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(studios_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved {len(studios_data)} studios to {filename}")

    def create_sanity_cms_format(self, studios: List[StudioData], filename: str = 'studios_for_sanity.json'):
        """Create format suitable for Sanity CMS import"""
        sanity_studios = []
        
        for studio in studios:
            sanity_studio = {
                "_type": "soundStudio",
                "name": studio.name,
                "slug": {
                    "_type": "slug",
                    "current": studio.slug
                },
                "description": studio.description,
                "address": {
                    "street": studio.street,
                    "city": studio.city,
                    "county": studio.county,
                    "country": studio.country
                },
                "contact": {
                    "phone": studio.phone,
                    "email": studio.email,
                    "website": studio.website,
                    "facebook": studio.facebook,
                    "instagram": studio.instagram
                },
                "amenities": studio.amenities,
                "pricing": {
                    "hourlyRate": studio.hourlyRate,
                    "currency": "EUR"
                } if studio.hourlyRate else None,
                "genresSupported": studio.genresSupported,
                "bandFriendly": studio.bandFriendly,
                "studioType": studio.studioType,
                "verified": False,
                "featured": False,
                "claimed": False
            }
            
            # Add location if available
            if studio.latitude and studio.longitude:
                sanity_studio["location"] = {
                    "_type": "geopoint",
                    "lat": studio.latitude,
                    "lng": studio.longitude
                }
            
            # Add profile image if available
            if studio.profileImage:
                sanity_studio["profileImageUrl"] = studio.profileImage
            
            # Remove None values
            sanity_studio = {k: v for k, v in sanity_studio.items() if v is not None}
            
            sanity_studios.append(sanity_studio)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(sanity_studios, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Created Sanity CMS format file: {filename}")

def main():
    """Main execution function"""
    # Load Google Maps API key from environment
    GOOGLE_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
    
    if not GOOGLE_API_KEY:
        logger.error("GOOGLE_MAPS_API_KEY environment variable not found!")
        logger.error("Please set your Google Maps API key in a .env file or environment variable")
        return
    
    scraper = IrishStudioDirectoryScraper(GOOGLE_API_KEY)
    
    print("🎵 Starting Irish Music Studios Data Collection...")
    
    # Scrape all studios
    studios = scraper.scrape_all_studios()
    
    print(f"\n📊 COLLECTION SUMMARY:")
    print(f"Total studios processed: {len(studios)}")
    print(f"Studios with websites: {len([s for s in studios if s.website])}")
    print(f"Studios with phone numbers: {len([s for s in studios if s.phone])}")
    print(f"Studios with email addresses: {len([s for s in studios if s.email])}")
    print(f"Studios with coordinates: {len([s for s in studios if s.latitude])}")
    print(f"Studios with photos: {len([s for s in studios if s.profileImage])}")
    
    # Save results
    scraper.save_to_json(studios)
    scraper.create_sanity_cms_format(studios)
    
    # Show sample data
    if studios:
        print(f"\n🏢 SAMPLE STUDIO DATA:")
        sample = studios[0]
        print(f"Name: {sample.name}")
        print(f"City: {sample.city}")
        print(f"Website: {sample.website}")
        print(f"Phone: {sample.phone}")
        print(f"Email: {sample.email}")
        print(f"Amenities: {', '.join(sample.amenities[:3]) if sample.amenities else 'None'}...")
        print(f"Has Photo: {'Yes' if sample.profileImage else 'No'}")
    
    print(f"\n✅ Data collection complete!")
    print(f"📁 Files created:")
    print(f"   - irish_studios_data.json (raw data)")
    print(f"   - studios_for_sanity.json (Sanity CMS format)")

if __name__ == "__main__":
    main()
