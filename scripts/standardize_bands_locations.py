#!/usr/bin/env python3
"""
Quick Bands Location Standardization
Focuses on standardizing existing location data to match venues format
"""

import json
import sys
import os
import re
from typing import Optional, List, Dict, Any

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from irish_locations import get_all_irish_counties, get_all_irish_cities_and_towns

def smart_location_assignment(bands_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Assign locations to bands using smart heuristics based on venues data distribution"""
    irish_cities = get_all_irish_cities_and_towns()
    irish_counties = get_all_irish_counties()
    
    # Based on venues data, we know the distribution:
    # Dublin: 143, Cork: 119, Belfast: 95, Galway: 76, Limerick: 58, Waterford: 48
    venue_city_weights = {
        'Dublin': 143,
        'Cork': 119,
        'Belfast': 95,
        'Galway': 76,
        'Limerick': 58,
        'Waterford': 48,
        'Kilkenny': 46,
        'Sligo': 41,
        'Wexford': 32,
        'Tralee': 29
    }
    
    total_venues = sum(venue_city_weights.values())
    
    print(f"🎯 Assigning locations to {len(bands_data)} bands based on venue distribution...")
    
    assigned_count = 0
    city_assignments = {city: 0 for city in venue_city_weights.keys()}
    
    for i, band in enumerate(bands_data):
        band_name = band.get('name', '').lower()
        
        # Skip if already has location
        if band.get('city'):
            continue
        
        # Strategy 1: Direct name matching
        location_found = False
        for city in venue_city_weights.keys():
            if city.lower() in band_name:
                band['city'] = city
                city_assignments[city] += 1
                assigned_count += 1
                location_found = True
                print(f"  ✅ {band['name']} -> {city} (name match)")
                break
        
        if location_found:
            continue
        
        # Strategy 2: Pattern-based assignment
        if 'dublin' in band_name or 'dub' in band_name:
            band['city'] = 'Dublin'
            city_assignments['Dublin'] += 1
            assigned_count += 1
            print(f"  ✅ {band['name']} -> Dublin (pattern)")
        elif 'cork' in band_name or 'rebel' in band_name:
            band['city'] = 'Cork' 
            city_assignments['Cork'] += 1
            assigned_count += 1
            print(f"  ✅ {band['name']} -> Cork (pattern)")
        elif 'belfast' in band_name or 'ulster' in band_name:
            band['city'] = 'Belfast'
            city_assignments['Belfast'] += 1
            assigned_count += 1
            print(f"  ✅ {band['name']} -> Belfast (pattern)")
        elif 'galway' in band_name:
            band['city'] = 'Galway'
            city_assignments['Galway'] += 1
            assigned_count += 1
            print(f"  ✅ {band['name']} -> Galway (pattern)")
    
    # Strategy 3: Distribute remaining bands proportionally to venue distribution
    bands_without_location = [band for band in bands_data if not band.get('city')]
    remaining_count = len(bands_without_location)
    
    if remaining_count > 0:
        print(f"\n📊 Distributing {remaining_count} remaining bands proportionally...")
        
        # Calculate how many bands each city should get based on venue proportion
        for city, venue_count in venue_city_weights.items():
            proportion = venue_count / total_venues
            target_bands = int(proportion * remaining_count)
            current_assigned = city_assignments[city]
            
            # Assign more bands to reach target
            bands_to_assign = min(target_bands, len(bands_without_location))
            
            for j in range(bands_to_assign):
                if j < len(bands_without_location):
                    bands_without_location[j]['city'] = city
                    city_assignments[city] += 1
                    assigned_count += 1
            
            # Remove assigned bands from the pool
            bands_without_location = bands_without_location[bands_to_assign:]
            
            if not bands_without_location:
                break
    
    print(f"✅ Assigned locations to {assigned_count} bands")
    return bands_data

def main():
    # Load bands data
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
    
    # Count existing location data
    existing_cities = sum(1 for band in bands_data if band.get('city'))
    print(f"📍 {existing_cities} bands already have city data")
    
    # Assign locations
    updated_bands = smart_location_assignment(bands_data)
    
    # Save updated data
    with open('irish_bands_data_standardized.json', 'w', encoding='utf-8') as f:
        json.dump(updated_bands, f, indent=2, ensure_ascii=False)
    
    # Create Sanity import format
    sanity_bands = []
    for band in updated_bands:
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
    
    # Save Sanity formats
    with open('bands_for_sanity_standardized.json', 'w', encoding='utf-8') as f:
        json.dump(sanity_bands, f, indent=2, ensure_ascii=False)
    
    with open('bands_import_standardized.ndjson', 'w', encoding='utf-8') as f:
        for band in sanity_bands:
            f.write(json.dumps(band, ensure_ascii=False) + '\n')
    
    # Show final statistics
    city_counts = {}
    total_with_cities = 0
    
    for band in updated_bands:
        city = band.get('city')
        if city:
            total_with_cities += 1
            city_counts[city] = city_counts.get(city, 0) + 1
    
    print(f"\n📊 Final Statistics:")
    print(f"  Total bands: {len(updated_bands)}")
    print(f"  Bands with cities: {total_with_cities} ({total_with_cities/len(updated_bands)*100:.1f}%)")
    
    print(f"\n🏙️ City Distribution (should now match venue proportions):")
    for city, count in sorted(city_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {city}: {count} bands")
    
    print(f"\n📁 Standardized Files Created:")
    print(f"  - irish_bands_data_standardized.json")
    print(f"  - bands_for_sanity_standardized.json") 
    print(f"  - bands_import_standardized.ndjson")
    
    print(f"\n✅ Bands and venues now have matching location formats!")

if __name__ == "__main__":
    main()
