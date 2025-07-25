#!/usr/bin/env python3
"""
Fix Bands Location Data
Updates existing bands data to use standardized Irish locations matching venues
"""

import json
import sys
import os
from typing import Optional, List, Dict, Any

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from irish_locations import get_all_irish_counties, get_all_irish_cities_and_towns

def match_irish_location(location_text: str, irish_cities: List[str], irish_counties: List[str]) -> tuple[Optional[str], Optional[str]]:
    """Match location text to standardized Irish city and county"""
    if not location_text:
        return None, None
    
    location_lower = location_text.lower().strip()
    
    # First try to match cities exactly
    for city in irish_cities:
        if city.lower() == location_lower:
            return city, None
    
    # Then try partial matches for cities
    for city in irish_cities:
        if city.lower() in location_lower or location_lower in city.lower():
            return city, None
    
    # Try to match counties exactly
    for county in irish_counties:
        if county.lower() == location_lower or county.lower().replace('county ', '') == location_lower:
            return None, county
    
    # Try partial matches for counties
    for county in irish_counties:
        county_clean = county.lower().replace('county ', '')
        if county_clean in location_lower or location_lower in county_clean:
            return None, county
    
    return None, None

def fix_band_locations(bands_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Fix location data for bands to match standardized format"""
    irish_cities = get_all_irish_cities_and_towns()
    irish_counties = get_all_irish_counties()
    
    print(f"📍 Loaded {len(irish_cities)} cities and {len(irish_counties)} counties")
    
    fixed_count = 0
    for band in bands_data:
        original_city = band.get('city')
        original_county = band.get('county')
        
        # Try to fix missing or non-standard location data
        # Look in band name or other fields for location clues
        locations_to_check = []
        
        if original_city:
            locations_to_check.append(original_city)
        if original_county:
            locations_to_check.append(original_county)
        
        # Check if band name contains location (e.g., "Dublin Band", "Cork Musicians")
        band_name = band.get('name', '')
        for city in ['Dublin', 'Cork', 'Belfast', 'Galway', 'Limerick', 'Waterford', 'Derry']:
            if city.lower() in band_name.lower():
                locations_to_check.append(city)
        
        # Try to match any location we found
        best_city = None
        best_county = None
        
        for location in locations_to_check:
            matched_city, matched_county = match_irish_location(location, irish_cities, irish_counties)
            if matched_city and not best_city:
                best_city = matched_city
            if matched_county and not best_county:
                best_county = matched_county
        
        # Update the band data if we found better matches
        if best_city and best_city != original_city:
            band['city'] = best_city
            fixed_count += 1
            print(f"  Fixed city: {band['name']} -> {best_city}")
        
        if best_county and best_county != original_county:
            band['county'] = best_county
            fixed_count += 1
            print(f"  Fixed county: {band['name']} -> {best_county}")
    
    print(f"✅ Fixed {fixed_count} location entries")
    return bands_data

def main():
    # Load existing bands data
    try:
        with open('irish_bands_data.json', 'r', encoding='utf-8') as f:
            bands_data = json.load(f)
        print(f"📚 Loaded {len(bands_data)} bands")
    except FileNotFoundError:
        print("❌ irish_bands_data.json not found!")
        return
    
    # Fix location data
    fixed_bands = fix_band_locations(bands_data)
    
    # Save updated data
    with open('irish_bands_data_fixed.json', 'w', encoding='utf-8') as f:
        json.dump(fixed_bands, f, indent=2, ensure_ascii=False)
    
    # Create updated Sanity import format
    sanity_bands = []
    for band in fixed_bands:
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
    
    # Save Sanity import format
    with open('bands_for_sanity_fixed.json', 'w', encoding='utf-8') as f:
        json.dump(sanity_bands, f, indent=2, ensure_ascii=False)
    
    # Create NDJSON format for Sanity import
    with open('bands_import_fixed.ndjson', 'w', encoding='utf-8') as f:
        for band in sanity_bands:
            f.write(json.dumps(band, ensure_ascii=False) + '\n')
    
    # Show location statistics
    city_counts = {}
    county_counts = {}
    
    for band in fixed_bands:
        city = band.get('city')
        county = band.get('county')
        
        if city:
            city_counts[city] = city_counts.get(city, 0) + 1
        if county:
            county_counts[county] = county_counts.get(county, 0) + 1
    
    print(f"\n🏙️ Top Cities in Fixed Data:")
    for city, count in sorted(city_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {city}: {count} bands")
    
    print(f"\n🏞️ Top Counties in Fixed Data:")
    for county, count in sorted(county_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f"  {county}: {count} bands")
    
    print(f"\n📁 Files created:")
    print(f"  - irish_bands_data_fixed.json")
    print(f"  - bands_for_sanity_fixed.json")
    print(f"  - bands_import_fixed.ndjson")

if __name__ == "__main__":
    main()
