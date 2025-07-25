#!/usr/bin/env python3
"""
Irish Bands Directory Scraper
Collects Irish band information using multiple APIs and sources:
- MusicBrainz API for official band data
- Bandcamp API for indie/underground bands
- Spotify API for popular bands
- Last.fm API for additional metadata
"""

import requests
import json
import time
import re
import logging
from datetime import datetime, timedelta
from urllib.parse import urljoin, urlparse, quote
from typing import Dict, List, Optional, Any, Tuple
import os
import sys
from dataclasses import dataclass, asdict

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from irish_locations import get_all_irish_counties, get_all_irish_cities_and_towns, get_irish_locations_list
from difflib import SequenceMatcher
import unicodedata

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class BandData:
    name: str
    slug: str
    description: Optional[str] = None
    city: Optional[str] = None
    county: Optional[str] = None
    country: str = "Ireland"
    email: Optional[str] = None
    website: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    spotify: Optional[str] = None
    bandcamp: Optional[str] = None
    youtube: Optional[str] = None
    musicGenres: List[str] = None
    isActive: bool = True
    hasRecentActivity: bool = False
    memberCount: Optional[int] = None
    formedYear: Optional[int] = None
    profileImage: Optional[str] = None
    musicbrainzId: Optional[str] = None
    lastfmListeners: Optional[int] = None
    spotifyFollowers: Optional[int] = None
    bandType: str = "band"  # band, solo_artist, duo, orchestra, etc.
    recordLabel: Optional[str] = None
    discography: List[str] = None
    upcomingGigs: List[Dict] = None
    
    def __post_init__(self):
        if self.musicGenres is None:
            self.musicGenres = []
        if self.discography is None:
            self.discography = []
        if self.upcomingGigs is None:
            self.upcomingGigs = []

class IrishBandScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'BandVenueReview/1.0 (https://bandvenuereview.ie; contact@bandvenuereview.ie)'
        })
        
        # Rate limiting delays (seconds)
        self.delays = {
            'musicbrainz': 1.0,  # MusicBrainz requires 1 second between requests
            'lastfm': 0.2,
            'bandcamp': 0.5,
            'spotify': 0.1
        }
        
        # Last request times for rate limiting
        self.last_requests = {}
        
        # Irish location indicators - use standardized list
        self.irish_locations = get_irish_locations_list()
        self.irish_counties = get_all_irish_counties()
        self.irish_cities = get_all_irish_cities_and_towns()

    def match_irish_location(self, location_text: str) -> tuple[Optional[str], Optional[str]]:
        """Match location text to standardized Irish city and county"""
        if not location_text:
            return None, None
        
        location_lower = location_text.lower().strip()
        
        # First try to match cities exactly
        for city in self.irish_cities:
            if city.lower() == location_lower:
                return city, None
        
        # Then try partial matches for cities
        for city in self.irish_cities:
            if city.lower() in location_lower or location_lower in city.lower():
                return city, None
        
        # Try to match counties exactly
        for county in self.irish_counties:
            if county.lower() == location_lower or county.lower().replace('county ', '') == location_lower:
                return None, county
        
        # Try partial matches for counties
        for county in self.irish_counties:
            county_clean = county.lower().replace('county ', '')
            if county_clean in location_lower or location_lower in county_clean:
                return None, county
        
        return None, None

    def rate_limit(self, api_name: str):
        """Implement rate limiting for different APIs"""
        if api_name in self.last_requests:
            time_since_last = time.time() - self.last_requests[api_name]
            delay_needed = self.delays.get(api_name, 0.5)
            if time_since_last < delay_needed:
                time.sleep(delay_needed - time_since_last)
        
        self.last_requests[api_name] = time.time()

    def create_slug(self, name: str) -> str:
        """Create URL-friendly slug from band name"""
        # Normalize unicode characters
        name = unicodedata.normalize('NFD', name)
        name = ''.join(char for char in name if unicodedata.category(char) != 'Mn')
        
        # Convert to lowercase and remove non-alphanumeric characters
        slug = re.sub(r'[^\w\s-]', '', name.lower())
        slug = re.sub(r'[-\s]+', '-', slug)
        slug = slug.strip('-')
        
        # Ensure it starts with a letter
        if slug and not slug[0].isalpha():
            slug = 'band-' + slug
        
        return slug or 'band'

    def similarity(self, a: str, b: str) -> float:
        """Calculate similarity between two strings"""
        return SequenceMatcher(None, a.lower(), b.lower()).ratio()

    def search_musicbrainz_bands(self, limit: int = 100) -> List[Dict]:
        """Search MusicBrainz for Irish bands"""
        logger.info("🎵 Searching MusicBrainz for Irish bands...")
        
        all_bands = []
        offset = 0
        
        while True:
            self.rate_limit('musicbrainz')
            
            # Search for groups/bands from Ireland
            url = "https://musicbrainz.org/ws/2/artist"
            params = {
                'query': 'country:IE AND type:group',
                'fmt': 'json',
                'limit': min(limit, 100),  # MusicBrainz max is 100
                'offset': offset
            }
            
            try:
                response = self.session.get(url, params=params)
                response.raise_for_status()
                
                data = response.json()
                artists = data.get('artists', [])
                
                if not artists:
                    break
                
                logger.info(f"Found {len(artists)} bands from MusicBrainz (offset: {offset})")
                all_bands.extend(artists)
                
                # Check if we've got all results
                if len(artists) < 100:
                    break
                
                offset += 100
                
                # Limit total results to avoid overwhelming
                if len(all_bands) >= limit:
                    break
                    
            except Exception as e:
                logger.error(f"Error searching MusicBrainz: {e}")
                break
        
        logger.info(f"✅ Total MusicBrainz bands found: {len(all_bands)}")
        return all_bands

    def get_musicbrainz_band_details(self, mbid: str) -> Dict:
        """Get detailed band information from MusicBrainz"""
        self.rate_limit('musicbrainz')
        
        url = f"https://musicbrainz.org/ws/2/artist/{mbid}"
        params = {
            'fmt': 'json',
            'inc': 'genres+tags+relationships+url-rels+recording-rels'
        }
        
        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error getting MusicBrainz details for {mbid}: {e}")
            return {}

    def search_lastfm_bands(self, band_name: str) -> Dict:
        """Search Last.fm for additional band data"""
        # Note: You would need a Last.fm API key for this
        # For now, return empty dict
        return {}

    def search_bandcamp_irish_bands(self) -> List[Dict]:
        """Search for Irish bands on Bandcamp"""
        logger.info("🎸 Searching Bandcamp for Irish bands...")
        
        # Bandcamp doesn't have a public API, but we can search for Irish location tags
        irish_bands = []
        
        # Common Irish location searches
        search_terms = [
            'Dublin Ireland', 'Cork Ireland', 'Belfast Ireland', 
            'Galway Ireland', 'Limerick Ireland', 'Ireland'
        ]
        
        for term in search_terms:
            try:
                self.rate_limit('bandcamp')
                
                # This is a simplified approach - in practice you'd need to scrape
                # Bandcamp's search results or use their undocumented API
                logger.info(f"Searching Bandcamp for: {term}")
                
                # Placeholder for Bandcamp search implementation
                # You would implement actual Bandcamp scraping here
                
            except Exception as e:
                logger.error(f"Error searching Bandcamp for {term}: {e}")
        
        return irish_bands

    def process_musicbrainz_band(self, band_data: Dict) -> Optional[BandData]:
        """Convert MusicBrainz data to BandData object"""
        try:
            name = band_data.get('name', '')
            if not name:
                return None
            
            mbid = band_data.get('id', '')
            
            # Get detailed information
            detailed_data = self.get_musicbrainz_band_details(mbid) if mbid else band_data
            
            band = BandData(
                name=name,
                slug=self.create_slug(name),
                musicbrainzId=mbid,
                country="Ireland"
            )
            
            # Extract description from disambiguation or tags
            disambiguation = detailed_data.get('disambiguation', '')
            if disambiguation:
                band.description = disambiguation
            
            # Extract location information
            area = detailed_data.get('area', {})
            if area:
                area_name = area.get('name', '')
                if area_name:
                    # Use standardized location matching
                    matched_city, matched_county = self.match_irish_location(area_name)
                    if matched_city:
                        band.city = matched_city
                    if matched_county:
                        band.county = matched_county
            
            # Extract formation year
            life_span = detailed_data.get('life-span', {})
            if life_span and life_span.get('begin'):
                try:
                    begin_date = life_span['begin']
                    if len(begin_date) >= 4:
                        band.formedYear = int(begin_date[:4])
                except (ValueError, TypeError):
                    pass
            
            # Extract genres from tags
            tags = detailed_data.get('tags', [])
            genres = []
            for tag in tags:
                tag_name = tag.get('name', '').lower()
                # Filter for music genres
                music_genres = [
                    'rock', 'pop', 'folk', 'traditional', 'jazz', 'classical',
                    'electronic', 'metal', 'punk', 'indie', 'alternative',
                    'country', 'blues', 'reggae', 'hip hop', 'rap'
                ]
                if any(genre in tag_name for genre in music_genres):
                    genres.append(tag_name)
            
            if genres:
                band.musicGenres = list(set(genres))  # Remove duplicates
            
            # Extract social media and website links from relationships
            relations = detailed_data.get('relations', [])
            for relation in relations:
                url_data = relation.get('url', {})
                resource = url_data.get('resource', '')
                
                if 'facebook.com' in resource:
                    band.facebook = resource
                elif 'instagram.com' in resource:
                    band.instagram = resource
                elif 'twitter.com' in resource:
                    band.twitter = resource
                elif 'spotify.com' in resource:
                    band.spotify = resource
                elif 'bandcamp.com' in resource:
                    band.bandcamp = resource
                elif 'youtube.com' in resource or 'youtu.be' in resource:
                    band.youtube = resource
                elif relation.get('type') == 'official homepage':
                    band.website = resource
            
            # Determine band type
            band_type = detailed_data.get('type', '')
            if band_type:
                type_mapping = {
                    'Person': 'solo_artist',
                    'Group': 'band',
                    'Orchestra': 'orchestra',
                    'Choir': 'choir'
                }
                band.bandType = type_mapping.get(band_type, 'band')
            
            # Check if band is active (basic heuristic)
            end_date = life_span.get('end') if life_span else None
            band.isActive = not bool(end_date)
            
            # Recent activity check (placeholder - would need to check recent releases/gigs)
            current_year = datetime.now().year
            if band.formedYear and current_year - band.formedYear <= 2:
                band.hasRecentActivity = True
            
            return band
            
        except Exception as e:
            logger.error(f"Error processing MusicBrainz band: {e}")
            return None

    def enhance_with_additional_sources(self, band: BandData) -> BandData:
        """Enhance band data with information from additional sources"""
        
        # Search Last.fm for listener count and additional info
        try:
            # Placeholder for Last.fm integration
            pass
        except Exception as e:
            logger.error(f"Error enhancing with Last.fm data: {e}")
        
        # Check for recent gigs (placeholder)
        try:
            # This would integrate with venue booking APIs or gig listing sites
            pass
        except Exception as e:
            logger.error(f"Error checking recent gigs: {e}")
        
        return band

    def deduplicate_bands(self, bands: List[BandData]) -> List[BandData]:
        """Remove duplicate bands using fuzzy matching"""
        logger.info("🔍 Deduplicating bands...")
        
        unique_bands = []
        seen_names = []
        duplicates_found = 0
        
        for band in bands:
            is_duplicate = False
            
            # Check against existing bands
            for seen_name in seen_names:
                similarity = self.similarity(band.name, seen_name)
                if similarity > 0.85:  # 85% similarity threshold
                    is_duplicate = True
                    duplicates_found += 1
                    logger.debug(f"Duplicate found: {band.name} (similar to {seen_name})")
                    break
            
            if not is_duplicate:
                unique_bands.append(band)
                seen_names.append(band.name)
        
        logger.info(f"✅ Removed {duplicates_found} duplicates. {len(unique_bands)} unique bands remain.")
        return unique_bands

    def filter_irish_bands(self, bands: List[BandData]) -> List[BandData]:
        """Filter to ensure bands are actually Irish"""
        irish_bands = []
        
        for band in bands:
            is_irish = False
            
            # Check country field
            if band.country and 'ireland' in band.country.lower():
                is_irish = True
            
            # Check city/county for Irish locations using standardized matching
            if (band.city and band.city in self.irish_cities) or (band.county and band.county in self.irish_counties):
                is_irish = True
            
            if band.county and any(loc in band.county.lower() for loc in self.irish_locations):
                is_irish = True
            
            # Check description for Irish indicators
            if band.description and any(loc in band.description.lower() for loc in self.irish_locations):
                is_irish = True
            
            if is_irish:
                irish_bands.append(band)
            else:
                logger.debug(f"Filtered out non-Irish band: {band.name}")
        
        logger.info(f"✅ Filtered to {len(irish_bands)} confirmed Irish bands")
        return irish_bands

    def mark_active_bands(self, bands: List[BandData]) -> List[BandData]:
        """Mark bands as active based on recent activity"""
        current_year = datetime.now().year
        
        for band in bands:
            # Basic activity heuristics
            activity_indicators = 0
            
            # Recent formation
            if band.formedYear and current_year - band.formedYear <= 3:
                activity_indicators += 1
            
            # Has social media presence
            if band.facebook or band.instagram or band.twitter:
                activity_indicators += 1
            
            # Has streaming presence
            if band.spotify or band.bandcamp or band.youtube:
                activity_indicators += 1
            
            # Has website
            if band.website:
                activity_indicators += 1
            
            # Mark as having recent activity if multiple indicators
            band.hasRecentActivity = activity_indicators >= 2
            
            # Assume active unless proven otherwise (end date in MusicBrainz)
            if not hasattr(band, 'isActive'):
                band.isActive = True
        
        active_count = len([b for b in bands if b.hasRecentActivity])
        logger.info(f"✅ Marked {active_count} bands as having recent activity")
        
        return bands

    def scrape_all_bands(self, limit: int = 500) -> List[BandData]:
        """Main method to scrape bands from all sources"""
        logger.info("🎵 Starting Irish bands scraping...")
        
        all_bands = []
        
        # 1. Search MusicBrainz for official bands
        logger.info("📀 Fetching from MusicBrainz...")
        mb_bands_data = self.search_musicbrainz_bands(limit)
        
        for band_data in mb_bands_data:
            band = self.process_musicbrainz_band(band_data)
            if band:
                all_bands.append(band)
                logger.info(f"✅ Added: {band.name} (formed: {band.formedYear or 'unknown'})")
        
        # 2. Search Bandcamp (placeholder implementation)
        logger.info("🎸 Fetching from Bandcamp...")
        bandcamp_bands = self.search_bandcamp_irish_bands()
        # Process Bandcamp bands (implementation would go here)
        
        # 3. Filter for Irish bands
        logger.info("🇮🇪 Filtering for Irish bands...")
        irish_bands = self.filter_irish_bands(all_bands)
        
        # 4. Deduplicate
        logger.info("🔄 Removing duplicates...")
        unique_bands = self.deduplicate_bands(irish_bands)
        
        # 5. Enhance with additional data
        logger.info("📈 Enhancing with additional data...")
        for band in unique_bands:
            self.enhance_with_additional_sources(band)
        
        # 6. Mark active bands
        logger.info("🎯 Marking active bands...")
        final_bands = self.mark_active_bands(unique_bands)
        
        logger.info(f"✅ Total Irish bands collected: {len(final_bands)}")
        return final_bands

    def save_to_json(self, bands: List[BandData], filename: str = 'irish_bands_data.json'):
        """Save bands to JSON file"""
        bands_data = [asdict(band) for band in bands]
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(bands_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved {len(bands_data)} bands to {filename}")

    def create_sanity_cms_format(self, bands: List[BandData], filename: str = 'bands_for_sanity.json'):
        """Convert bands to Sanity CMS format"""
        sanity_bands = []
        
        for band in bands:
            sanity_band = {
                "_id": band.slug,
                "_type": "band",
                "name": band.name,
                "slug": {"_type": "slug", "current": band.slug},
                "description": band.description,
                "location": {
                    "_type": "location",
                    "city": band.city,
                    "county": band.county,
                    "country": band.country
                },
                "contact": {
                    "_type": "contact",
                    "email": band.email,
                    "website": band.website,
                    "facebook": band.facebook,
                    "instagram": band.instagram,
                    "twitter": band.twitter
                },
                "musicDetails": {
                    "_type": "musicDetails",
                    "genres": band.musicGenres,
                    "bandType": band.bandType,
                    "formedYear": band.formedYear,
                    "memberCount": band.memberCount,
                    "recordLabel": band.recordLabel
                },
                "streamingLinks": {
                    "_type": "streamingLinks",
                    "spotify": band.spotify,
                    "bandcamp": band.bandcamp,
                    "youtube": band.youtube
                },
                "stats": {
                    "_type": "stats",
                    "lastfmListeners": band.lastfmListeners,
                    "spotifyFollowers": band.spotifyFollowers
                },
                "isActive": band.isActive,
                "hasRecentActivity": band.hasRecentActivity,
                "verified": False,
                "featured": False,
                "musicbrainzId": band.musicbrainzId
            }
            
            # Remove None values and empty objects
            def clean_dict(d):
                if isinstance(d, dict):
                    return {k: clean_dict(v) for k, v in d.items() 
                           if v is not None and v != {} and v != []}
                return d
            
            sanity_band = clean_dict(sanity_band)
            sanity_bands.append(sanity_band)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(sanity_bands, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Created Sanity CMS format file: {filename}")

def main():
    """Main execution function"""
    scraper = IrishBandScraper()
    
    try:
        # Scrape all bands
        bands = scraper.scrape_all_bands(limit=1000)  # Adjust limit as needed
        
        # Save results
        scraper.save_to_json(bands)
        scraper.create_sanity_cms_format(bands)
        
        # Print summary
        print(f"\n📊 IRISH BANDS SCRAPING SUMMARY:")
        print(f"Total bands found: {len(bands)}")
        
        # Statistics
        active_bands = [b for b in bands if b.isActive]
        recent_activity = [b for b in bands if b.hasRecentActivity]
        with_genres = [b for b in bands if b.musicGenres]
        with_social = [b for b in bands if b.facebook or b.instagram or b.twitter]
        
        print(f"Active bands: {len(active_bands)}")
        print(f"Bands with recent activity: {len(recent_activity)}")
        print(f"Bands with genres: {len(with_genres)}")
        print(f"Bands with social media: {len(with_social)}")
        
        # City breakdown
        city_counts = {}
        for band in bands:
            city = band.city or 'Unknown'
            city_counts[city] = city_counts.get(city, 0) + 1
        
        print(f"\n🏙️ By City:")
        for city, count in sorted(city_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"  {city}: {count}")
        
        # Genre breakdown
        genre_counts = {}
        for band in bands:
            for genre in band.musicGenres:
                genre_counts[genre] = genre_counts.get(genre, 0) + 1
        
        print(f"\n🎭 Top Genres:")
        for genre, count in sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"  {genre}: {count}")
        
        # Formation years
        decades = {}
        for band in bands:
            if band.formedYear:
                decade = (band.formedYear // 10) * 10
                decades[decade] = decades.get(decade, 0) + 1
        
        print(f"\n📅 By Formation Decade:")
        for decade, count in sorted(decades.items()):
            print(f"  {decade}s: {count}")
        
        print(f"\n✅ Scraping completed successfully!")
        print(f"📁 Files saved:")
        print(f"  - irish_bands_data.json")
        print(f"  - bands_for_sanity.json")
        
    except Exception as e:
        logger.error(f"❌ Scraping failed: {e}")
        raise

if __name__ == "__main__":
    main()
