#!/usr/bin/env python3
"""
Sanity CMS Venue Data Importer with Duplicate Detection
Converts scraped venue data into Sanity import format
"""

import json
import re
import sys
import requests
from datetime import datetime
from typing import List, Dict, Set
from difflib import SequenceMatcher

def similarity(a: str, b: str) -> float:
    """Calculate similarity between two strings"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def detect_duplicates(venues: List[Dict]) -> List[Dict]:
    """Detect and handle duplicate venues"""
    seen_names: Set[str] = set()
    seen_place_ids: Set[str] = set()
    seen_locations: Set[tuple] = set()
    
    filtered_venues = []
    duplicates_found = []
    
    for venue in venues:
        name = venue.get("name", "").lower().strip()
        place_id = venue.get("googlePlaceId", "").strip()
        
        # Extract location for proximity checking
        location = None
        if venue.get("latitude") and venue.get("longitude"):
            lat = venue["latitude"]
            lng = venue["longitude"]
            # Round to 3 decimal places for proximity check (≈100m accuracy)
            location = (round(lat, 3), round(lng, 3))
        
        is_duplicate = False
        duplicate_reason = ""
        
        # Check for exact Place ID match (most reliable)
        if place_id and place_id in seen_place_ids:
            is_duplicate = True
            duplicate_reason = "same Google Place ID"
        
        # Check for exact name match
        elif name in seen_names:
            is_duplicate = True
            duplicate_reason = "exact name match"
        
        # Check for similar names (85% similarity threshold)
        else:
            for seen_name in seen_names:
                if similarity(name, seen_name) > 0.85:
                    is_duplicate = True
                    duplicate_reason = f"similar name to existing venue"
                    break
        
        # Check for same location (different names but same place)
        if not is_duplicate and location and location in seen_locations:
            is_duplicate = True
            duplicate_reason = "same location coordinates"
        
        if is_duplicate:
            duplicates_found.append({
                "name": venue.get("name"),
                "city": venue.get("city"),
                "reason": duplicate_reason
            })
            print(f"🔄 Duplicate detected: {venue.get('name')} ({duplicate_reason})")
        else:
            filtered_venues.append(venue)
            seen_names.add(name)
            if place_id:
                seen_place_ids.add(place_id)
            if location:
                seen_locations.add(location)
    
    print(f"📊 Deduplication summary:")
    print(f"   Original venues: {len(venues)}")
    print(f"   Duplicates found: {len(duplicates_found)}")
    print(f"   Unique venues: {len(filtered_venues)}")
    
    # Save duplicate report
    if duplicates_found:
        with open('venue_duplicates_report.json', 'w') as f:
            json.dump(duplicates_found, f, indent=2)
        print(f"📋 Duplicate report saved to: venue_duplicates_report.json")
    
    return filtered_venues

def check_existing_venues_in_sanity():
    """Check what venues already exist in Sanity"""
    existing_venues = set()
    
    try:
        # Sanity API query to get existing venue names
        project_id = "0jw5aheb"  # Your project ID
        dataset = "production"
        query = '*[_type == "venue"] { name, slug }'
        
        sanity_url = f"https://{project_id}.api.sanity.io/v2021-10-21/data/query/{dataset}"
        
        params = {"query": query}
        response = requests.get(sanity_url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            for venue in data.get("result", []):
                if venue.get("name"):
                    existing_venues.add(venue["name"].lower().strip())
            
            print(f"📋 Found {len(existing_venues)} existing venues in Sanity")
        else:
            print(f"⚠️  Could not fetch existing venues (status: {response.status_code})")
    
    except Exception as e:
        print(f"⚠️  Error checking existing venues: {e}")
    
    return existing_venues

def create_slug(name):
    """Create URL-friendly slug from venue name"""
    import unicodedata
    
    # Normalize unicode characters (remove accents)
    name = unicodedata.normalize('NFD', name)
    name = ''.join(char for char in name if unicodedata.category(char) != 'Mn')
    
    # Convert to lowercase and remove non-alphanumeric characters
    slug = re.sub(r'[^\w\s-]', '', name.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    slug = slug.strip('-')
    
    # Ensure it starts with a letter (Sanity requirement)
    if slug and not slug[0].isalpha():
        slug = 'venue-' + slug
    
    return slug or 'venue'

def map_venue_type(scraped_type: str) -> str:
    """Map scraped venue types to Sanity schema values"""
    type_mapping = {
        'pub': 'pub',
        'club': 'club', 
        'theatre': 'theatre',
        'theater': 'theatre',
        'arena': 'arena',
        'concert_hall': 'concert_hall',
        'arts_center': 'other',
        'live_music': 'other',
        'restaurant_with_music': 'other'
    }
    
    return type_mapping.get(scraped_type, 'other')

def map_facilities(venue_data: Dict) -> List[str]:
    """Map venue characteristics to Sanity facilities"""
    facilities = []
    
    if venue_data.get('hasPA'):
        facilities.append('sound_system')
    if venue_data.get('hasLighting'):
        facilities.append('lighting')
    if venue_data.get('hasParking'):
        facilities.append('parking')
    if venue_data.get('servesAlcohol'):
        facilities.append('bar')
    if venue_data.get('servesFood'):
        facilities.append('food_service')
    if venue_data.get('isAccessible'):
        facilities.append('ramp_access')
        
    return facilities

def convert_to_sanity_format(venue_data):
    """Convert venue data to Sanity document format"""
    venues = []
    
    for venue in venue_data:
        # Create unique document ID
        doc_id = f"venue-{create_slug(venue['name'])}"
        
        sanity_doc = {
            "_id": doc_id,
            "_type": "venue",
            "name": venue["name"],
            "slug": {
                "_type": "slug",
                "current": create_slug(venue["name"])
            },
            "description": venue.get("description", ""),
            "verified": False,
            "claimed": False,
            "featured": False
        }
        
        # Add address information
        address = {}
        if venue.get("street"):
            address["street"] = venue["street"]
        if venue.get("city"):
            address["city"] = venue["city"]
        if venue.get("county"):
            address["county"] = venue["county"]
        if venue.get("country"):
            address["country"] = venue["country"]
        
        if address:
            sanity_doc["address"] = address
        
        # Add location (geopoint)
        if venue.get("latitude") and venue.get("longitude"):
            sanity_doc["location"] = {
                "_type": "geopoint",
                "lat": venue["latitude"],
                "lng": venue["longitude"]
            }
        
        # Add contact information
        contact = {}
        if venue.get("phone"):
            contact["phone"] = venue["phone"]
        if venue.get("email"):
            contact["email"] = venue["email"]
        if venue.get("website"):
            contact["website"] = venue["website"]
        
        if contact:
            sanity_doc["contact"] = contact
        
        # Add capacity
        if venue.get("capacity"):
            sanity_doc["capacity"] = venue["capacity"]
        
        # Add venue type
        if venue.get("venueType"):
            sanity_doc["venueType"] = map_venue_type(venue["venueType"])
        
        # Add facilities based on venue characteristics
        facilities = map_facilities(venue)
        if facilities:
            sanity_doc["facilities"] = facilities
        
        # Add Google data as custom fields (for reference)
        google_data = {}
        if venue.get("googlePlaceId"):
            google_data["placeId"] = venue["googlePlaceId"]
        if venue.get("rating"):
            google_data["rating"] = venue["rating"]
        if venue.get("totalReviews"):
            google_data["totalReviews"] = venue["totalReviews"]
        if venue.get("priceLevel") is not None:
            google_data["priceLevel"] = venue["priceLevel"]
        
        # Store Google data in description for now (can be moved to custom fields later)
        if google_data:
            rating_text = ""
            if venue.get("rating") and venue.get("totalReviews"):
                rating_text = f" (Google Rating: {venue['rating']}/5 from {venue['totalReviews']} reviews)"
            
            current_desc = sanity_doc.get("description", "")
            if current_desc and not current_desc.endswith('.'):
                current_desc += "."
            
            sanity_doc["description"] = current_desc + rating_text
        
        venues.append(sanity_doc)
    
    return venues

def create_import_files(venues):
    """Create different import format files"""
    
    # 1. NDJSON format for Sanity CLI import
    ndjson_content = []
    for venue in venues:
        ndjson_content.append(json.dumps(venue, ensure_ascii=False))
    
    with open('venues_import.ndjson', 'w', encoding='utf-8') as f:
        f.write('\n'.join(ndjson_content))
    
    # 2. Regular JSON for manual review
    with open('venues_sanity_format.json', 'w', encoding='utf-8') as f:
        json.dump(venues, f, indent=2, ensure_ascii=False)
    
    # 3. Create import script
    import_script = '''#!/bin/bash
# Sanity Venue Import Script
# Run this from your CMS directory

echo "🎵 Importing venues to Sanity CMS..."
echo "Project: band-review-website"
echo "Dataset: production"
echo ""

# Check if sanity CLI is available
if ! command -v sanity &> /dev/null; then
    echo "❌ Sanity CLI not found. Please install it first:"
    echo "npm install -g @sanity/cli"
    exit 1
fi

# Import the venues
echo "📊 Importing {count} venues..."
sanity dataset import venues_import.ndjson production --replace

echo "✅ Import completed!"
echo ""
echo "🔗 View your venues at: https://band-review-website.sanity.studio/structure/venue"
'''.replace('{count}', str(len(venues)))
    
    with open('import_venues.sh', 'w') as f:
        f.write(import_script)
    
    # Make the script executable
    import os
    os.chmod('import_venues.sh', 0o755)
    
    print(f"📁 Created import files:")
    print(f"   📄 venues_import.ndjson ({len(venues)} venues)")
    print(f"   📄 venues_sanity_format.json (human-readable)")
    print(f"   🔧 import_venues.sh (import script)")

def filter_existing_venues(venues, existing_names):
    """Filter out venues that already exist in Sanity"""
    new_venues = []
    existing_count = 0
    
    for venue in venues:
        venue_name = venue["name"].lower().strip()
        if venue_name in existing_names:
            existing_count += 1
            print(f"⏭️  Skipping existing venue: {venue['name']}")
        else:
            new_venues.append(venue)
    
    print(f"📊 Filtering results:")
    print(f"   Already in Sanity: {existing_count}")
    print(f"   New venues to import: {len(new_venues)}")
    
    return new_venues

def main():
    """Main import process"""
    
    print("🎵 Sanity Venue Data Importer")
    print("============================")
    
    # Load scraped venue data
    try:
        with open('irish_venues_data.json', 'r', encoding='utf-8') as f:
            raw_venues = json.load(f)
        print(f"✅ Loaded {len(raw_venues)} scraped venues")
    except FileNotFoundError:
        print("❌ Error: irish_venues_data.json not found!")
        print("   Please run the venue scraper first.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error loading venue data: {e}")
        sys.exit(1)
    
    # Detect and remove duplicates
    print("\n🔍 Detecting duplicates...")
    unique_venues = detect_duplicates(raw_venues)
    
    # Check existing venues in Sanity
    print("\n📋 Checking existing venues in Sanity...")
    existing_venues = check_existing_venues_in_sanity()
    
    # Convert to Sanity format
    print("\n🔄 Converting to Sanity format...")
    sanity_venues = convert_to_sanity_format(unique_venues)
    
    # Filter out venues that already exist
    if existing_venues:
        print("\n🔍 Filtering out existing venues...")
        new_venues = filter_existing_venues(sanity_venues, existing_venues)
    else:
        new_venues = sanity_venues
    
    if not new_venues:
        print("\n✅ No new venues to import. All venues already exist in Sanity.")
        return
    
    # Create import files
    print(f"\n📦 Creating import files for {len(new_venues)} new venues...")
    create_import_files(new_venues)
    
    # Summary
    print(f"\n📊 IMPORT SUMMARY")
    print(f"=================")
    print(f"Total scraped venues: {len(raw_venues)}")
    print(f"After deduplication: {len(unique_venues)}")
    print(f"Already in Sanity: {len(sanity_venues) - len(new_venues)}")
    print(f"Ready to import: {len(new_venues)}")
    
    # Show venue breakdown by city and type
    city_counts = {}
    type_counts = {}
    
    for venue in new_venues:
        city = venue.get("address", {}).get("city", "Unknown")
        venue_type = venue.get("venueType", "other")
        
        city_counts[city] = city_counts.get(city, 0) + 1
        type_counts[venue_type] = type_counts.get(venue_type, 0) + 1
    
    print(f"\n🏙️  By City:")
    for city, count in sorted(city_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"   {city}: {count}")
    
    print(f"\n🎭 By Type:")
    for venue_type, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"   {venue_type}: {count}")
    
    print(f"\n🚀 Next steps:")
    print(f"   1. Review venues_sanity_format.json")
    print(f"   2. Run: cd /path/to/your/cms && ./import_venues.sh")
    print(f"   3. Check your Sanity Studio to verify the import")

if __name__ == "__main__":
    main()
