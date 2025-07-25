#!/usr/bin/env python3
"""
Enhanced Bands Location Detection
Uses multiple strategies to detect Irish locations for bands
"""

import json
import sys
import os
import re
from typing import Optional, List, Dict, Any

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from irish_locations import get_all_irish_counties, get_all_irish_cities_and_towns

def detect_locations_in_text(text: str, irish_cities: List[str], irish_counties: List[str]) -> tuple[Optional[str], Optional[str]]:
    """Detect Irish locations mentioned in text"""
    if not text:
        return None, None
    
    text_lower = text.lower()
    
    # Look for city mentions
    for city in irish_cities:
        # Check for exact matches with word boundaries
        if re.search(r'\b' + re.escape(city.lower()) + r'\b', text_lower):
            return city, None
    
    # Look for county mentions
    for county in irish_counties:
        county_clean = county.lower().replace('county ', '')
        if re.search(r'\b' + re.escape(county_clean) + r'\b', text_lower):
            return None, county
    
    return None, None

def get_musicbrainz_location_data(band_name: str) -> tuple[Optional[str], Optional[str]]:
    """Try to get more detailed location data from MusicBrainz API"""
    import requests
    import time
    
    try:
        # Search for the band
        search_url = "https://musicbrainz.org/ws/2/artist/"
        params = {
            'query': f'artist:"{band_name}" AND country:IE',
            'fmt': 'json',
            'limit': 1
        }
        
        response = requests.get(search_url, params=params)
        time.sleep(1)  # Rate limiting
        
        if response.status_code == 200:
            data = response.json()
            artists = data.get('artists', [])
            
            if artists:
                artist = artists[0]
                # Get detailed artist data
                artist_id = artist.get('id')
                detail_url = f"https://musicbrainz.org/ws/2/artist/{artist_id}"
                detail_params = {'fmt': 'json', 'inc': 'area-rels'}
                
                detail_response = requests.get(detail_url, params=detail_params)
                time.sleep(1)
                
                if detail_response.status_code == 200:
                    detail_data = detail_response.json()
                    
                    # Check area information
                    area = detail_data.get('area', {})
                    if area:
                        area_name = area.get('name', '')
                        if area_name:
                            return area_name, None
                    
                    # Check relations for location info
                    relations = detail_data.get('relations', [])
                    for relation in relations:
                        if relation.get('type') in ['performance', 'recorded at']:
                            target = relation.get('target', {})
                            if isinstance(target, dict):
                                place_name = target.get('name', '')
                                if place_name:
                                    return place_name, None
    
    except Exception as e:
        print(f"  Error fetching MusicBrainz data for {band_name}: {e}")
    
    return None, None

def enhanced_location_detection(bands_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Enhanced location detection using multiple strategies"""
    irish_cities = get_all_irish_cities_and_towns()
    irish_counties = get_all_irish_counties()
    
    print(f"🔍 Starting enhanced location detection for {len(bands_data)} bands...")
    
    updated_count = 0
    
    for i, band in enumerate(bands_data):
        if i % 50 == 0:
            print(f"  Processing band {i+1}/{len(bands_data)}...")
        
        # Skip if already has good location data
        if band.get('city') and band.get('city') in irish_cities:
            continue
        
        band_name = band.get('name', '')
        description = band.get('description', '')
        
        found_city = None
        found_county = None
        
        # Strategy 1: Check band name for location keywords
        name_city, name_county = detect_locations_in_text(band_name, irish_cities, irish_counties)
        if name_city:
            found_city = name_city
        if name_county:
            found_county = name_county
        
        # Strategy 2: Check description if available
        if not found_city and description:
            desc_city, desc_county = detect_locations_in_text(description, irish_cities, irish_counties)
            if desc_city:
                found_city = desc_city
            if desc_county:
                found_county = desc_county
        
        # Strategy 3: For well-known bands, try to get more data from MusicBrainz
        if not found_city and not found_county:
            # Only try for bands that might be well-known (simple heuristic)
            if len(band_name) > 3 and not band_name.startswith('The '):
                mb_location, mb_county = get_musicbrainz_location_data(band_name)
                if mb_location:
                    # Try to match the MusicBrainz location to our standardized list
                    matched_city, matched_county = detect_locations_in_text(mb_location, irish_cities, irish_counties)
                    if matched_city:
                        found_city = matched_city
                    if matched_county:
                        found_county = matched_county
        
        # Strategy 4: Educated guesses based on band characteristics
        if not found_city:
            # If band has "Dublin" related terms
            dublin_indicators = ['dublin', 'dub', 'temple bar', 'grafton', 'o\'connell']
            if any(indicator in band_name.lower() for indicator in dublin_indicators):
                found_city = 'Dublin'
            
            # Cork indicators
            elif any(indicator in band_name.lower() for indicator in ['cork', 'rebel']):
                found_city = 'Cork'
            
            # Belfast indicators
            elif any(indicator in band_name.lower() for indicator in ['belfast', 'ulster']):
                found_city = 'Belfast'
        
        # Update band data if we found locations
        if found_city:
            band['city'] = found_city
            updated_count += 1
            print(f"    ✅ {band_name} -> {found_city}")
        
        if found_county:
            band['county'] = found_county
            updated_count += 1
            print(f"    ✅ {band_name} -> {found_county}")
    
    print(f"✅ Enhanced detection updated {updated_count} location entries")
    return bands_data

def main():
    # Load the already-fixed bands data
    try:
        with open('irish_bands_data_fixed.json', 'r', encoding='utf-8') as f:
            bands_data = json.load(f)
        print(f"📚 Loaded {len(bands_data)} bands from fixed data")
    except FileNotFoundError:
        try:
            with open('irish_bands_data.json', 'r', encoding='utf-8') as f:
                bands_data = json.load(f)
            print(f"📚 Loaded {len(bands_data)} bands from original data")
        except FileNotFoundError:
            print("❌ No bands data file found!")
            return
    
    # Run enhanced location detection
    enhanced_bands = enhanced_location_detection(bands_data)
    
    # Save enhanced data
    with open('irish_bands_data_enhanced.json', 'w', encoding='utf-8') as f:
        json.dump(enhanced_bands, f, indent=2, ensure_ascii=False)
    
    # Create updated Sanity import format
    sanity_bands = []
    for band in enhanced_bands:
        sanity_band = {
            '_type': 'band',
            'name': band['name'],
            'slug': {'_type': 'slug', 'current': band['slug']},
            'description': band.get('description'),
            'city': band.get('city'),
            'county': band.get('county'),
            'country': band.get('country', 'Ireland'),
            'formedYear': band.get('formedYear'),
            'isActive': band.get('isActive', True),
            'contact': {
                'email': band.get('email'),
                'website': band.get('website'),
                'facebook': band.get('facebook'),
                'instagram': band.get('instagram'),
                'twitter': band.get('twitter'),
                'spotify': band.get('spotify'),
                'bandcamp': band.get('bandcamp'),
                'youtube': band.get('youtube')
            },
            'genres': band.get('genres', []),
            'verified': band.get('verified', False),
            'featured': band.get('featured', False)
        }
        
        # Remove None values and empty contact fields
        sanity_band = {k: v for k, v in sanity_band.items() if v is not None}
        if sanity_band.get('contact'):
            sanity_band['contact'] = {k: v for k, v in sanity_band['contact'].items() if v is not None}
            if not sanity_band['contact']:
                del sanity_band['contact']
        
        sanity_bands.append(sanity_band)
    
    # Save enhanced Sanity import format
    with open('bands_for_sanity_enhanced.json', 'w', encoding='utf-8') as f:
        json.dump(sanity_bands, f, indent=2, ensure_ascii=False)
    
    # Create NDJSON format for Sanity import
    with open('bands_import_enhanced.ndjson', 'w', encoding='utf-8') as f:
        for band in sanity_bands:
            f.write(json.dumps(band, ensure_ascii=False) + '\n')
    
    # Show final statistics
    city_counts = {}
    county_counts = {}
    total_with_locations = 0
    
    for band in enhanced_bands:
        city = band.get('city')
        county = band.get('county')
        
        if city or county:
            total_with_locations += 1
        
        if city:
            city_counts[city] = city_counts.get(city, 0) + 1
        if county:
            county_counts[county] = county_counts.get(county, 0) + 1
    
    print(f"\n📊 Final Location Statistics:")
    print(f"  Total bands: {len(enhanced_bands)}")
    print(f"  Bands with location data: {total_with_locations} ({total_with_locations/len(enhanced_bands)*100:.1f}%)")
    
    print(f"\n🏙️ Top Cities in Enhanced Data:")
    for city, count in sorted(city_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {city}: {count} bands")
    
    if county_counts:
        print(f"\n🏞️ Top Counties in Enhanced Data:")
        for county, count in sorted(county_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
            print(f"  {county}: {count} bands")
    
    print(f"\n📁 Enhanced Files Created:")
    print(f"  - irish_bands_data_enhanced.json")
    print(f"  - bands_for_sanity_enhanced.json")
    print(f"  - bands_import_enhanced.ndjson")

if __name__ == "__main__":
    main()
