#!/usr/bin/env python3
"""
Sanity CMS Studio Data Importer with Duplicate Detection
Converts scraped studio data into Sanity import format
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

def detect_duplicates(studios: List[Dict]) -> List[Dict]:
    """Detect and handle duplicate studios"""
    seen_names: Set[str] = set()
    seen_websites: Set[str] = set()
    seen_locations: Set[tuple] = set()
    
    filtered_studios = []
    duplicates_found = []
    
    for studio in studios:
        name = studio.get("name", "").lower().strip()
        website = studio.get("contact", {}).get("website", "").lower().strip() if studio.get("contact") else ""
        
        # Extract location for proximity checking
        location = None
        if studio.get("location"):
            lat = studio["location"].get("lat", 0)
            lng = studio["location"].get("lng", 0)
            if lat and lng:
                # Round to 3 decimal places for proximity check (≈100m accuracy)
                location = (round(lat, 3), round(lng, 3))
        
        is_duplicate = False
        duplicate_reason = ""
        
        # Check for exact name match
        if name in seen_names:
            is_duplicate = True
            duplicate_reason = "exact name match"
        
        # Check for similar names (85% similarity threshold)
        for seen_name in seen_names:
            if similarity(name, seen_name) > 0.85:
                is_duplicate = True
                duplicate_reason = f"similar name to '{seen_name}'"
                break
        
        # Check for exact website match
        if website and website in seen_websites:
            is_duplicate = True
            duplicate_reason = "same website"
        
        # Check for same location (within 100m)
        if location and location in seen_locations:
            is_duplicate = True
            duplicate_reason = "same location"
        
        if is_duplicate:
            duplicates_found.append({
                "name": studio.get("name"),
                "reason": duplicate_reason,
                "website": website or "N/A"
            })
            print(f"⚠️  Duplicate detected: {studio.get('name')} ({duplicate_reason})")
        else:
            filtered_studios.append(studio)
            seen_names.add(name)
            if website:
                seen_websites.add(website)
            if location:
                seen_locations.add(location)
    
    print(f"\n📊 DUPLICATE DETECTION SUMMARY:")
    print(f"   Original studios: {len(studios)}")
    print(f"   Duplicates found: {len(duplicates_found)}")
    print(f"   Unique studios: {len(filtered_studios)}")
    
    if duplicates_found:
        print(f"\n🔍 DUPLICATES DETECTED:")
        for dup in duplicates_found:
            print(f"   - {dup['name']} ({dup['reason']})")
    
    return filtered_studios

def check_existing_sanity_studios(project_id: str, dataset: str = "production") -> Set[str]:
    """Check existing studios in Sanity to avoid re-importing"""
    existing_studios = set()
    
    try:
        # Query Sanity for existing studio names
        query = "*[_type == 'soundStudio']{name, slug}"
        sanity_url = f"https://{project_id}.api.sanity.io/v2021-10-21/data/query/{dataset}"
        
        params = {"query": query}
        response = requests.get(sanity_url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            for studio in data.get("result", []):
                if studio.get("name"):
                    existing_studios.add(studio["name"].lower().strip())
            
            print(f"📋 Found {len(existing_studios)} existing studios in Sanity")
        else:
            print(f"⚠️  Could not fetch existing studios (status: {response.status_code})")
    
    except Exception as e:
        print(f"⚠️  Error checking existing studios: {e}")
    
    return existing_studios

def create_slug(name):
    """Create URL-friendly slug from studio name"""
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
        slug = 'studio-' + slug
    
    return slug or 'studio'

def convert_to_sanity_format(studio_data):
    """Convert studio data to Sanity document format"""
    studios = []
    
    for studio in studio_data:
        # Create unique document ID
        doc_id = f"studio-{create_slug(studio['name'])}"
        
        sanity_doc = {
            "_id": doc_id,
            "_type": "soundStudio",
            "name": studio["name"],
            "slug": {
                "_type": "slug",
                "current": studio["slug"]["current"] if isinstance(studio.get("slug"), dict) else create_slug(studio["name"])
            },
            "description": studio.get("description", ""),
            "bandFriendly": studio.get("bandFriendly", True),
            "studioType": studio.get("studioType", "professional"),
            "verified": studio.get("verified", False),
            "featured": studio.get("featured", False),
            "claimed": studio.get("claimed", False)
        }
        
        # Add address if present
        if "address" in studio and studio["address"]:
            addr = studio["address"]
            sanity_doc["address"] = {
                "street": addr.get("street", ""),
                "city": addr.get("city", ""),
                "county": addr.get("county", ""),
                "country": addr.get("country", "Ireland"),
                "eircode": addr.get("eircode", "")
            }
        
        # Add location coordinates
        if "location" in studio and studio["location"]:
            loc = studio["location"]
            sanity_doc["location"] = {
                "_type": "geopoint",
                "lat": loc.get("lat", 0),
                "lng": loc.get("lng", 0)
            }
        
        # Add contact information
        if "contact" in studio and studio["contact"]:
            contact = studio["contact"]
            sanity_doc["contact"] = {}
            
            if contact.get("phone"):
                sanity_doc["contact"]["phone"] = contact["phone"]
            if contact.get("email"):
                sanity_doc["contact"]["email"] = contact["email"]
            if contact.get("website"):
                sanity_doc["contact"]["website"] = contact["website"]
            if contact.get("facebook"):
                sanity_doc["contact"]["facebook"] = contact["facebook"]
            if contact.get("instagram"):
                sanity_doc["contact"]["instagram"] = contact["instagram"]
            if contact.get("twitter"):
                sanity_doc["contact"]["twitter"] = contact["twitter"]
        
        # Add pricing information
        if "pricing" in studio and studio["pricing"]:
            pricing = studio["pricing"]
            sanity_doc["pricing"] = {
                "currency": pricing.get("currency", "EUR")
            }
            
            if pricing.get("hourlyRate"):
                sanity_doc["pricing"]["hourlyRate"] = pricing["hourlyRate"]
            if pricing.get("halfDayRate"):
                sanity_doc["pricing"]["halfDayRate"] = pricing["halfDayRate"]
            if pricing.get("fullDayRate"):
                sanity_doc["pricing"]["fullDayRate"] = pricing["fullDayRate"]
            if pricing.get("engineerIncluded"):
                sanity_doc["pricing"]["engineerIncluded"] = pricing["engineerIncluded"]
        
        # Add amenities
        if "amenities" in studio and studio["amenities"]:
            sanity_doc["amenities"] = studio["amenities"]
        
        # Add supported genres
        if "genresSupported" in studio and studio["genresSupported"]:
            sanity_doc["genresSupported"] = studio["genresSupported"]
        
        # Add features
        if "features" in studio and studio["features"]:
            sanity_doc["features"] = studio["features"]
        
        # Add capacity
        if "capacity" in studio and studio["capacity"]:
            sanity_doc["capacity"] = studio["capacity"]
        
        # Add profile image URL (for manual import)
        if "profileImageUrl" in studio and studio["profileImageUrl"]:
            sanity_doc["_profileImageUrl"] = studio["profileImageUrl"]
        
        # Add opening hours if present
        if "openingHours" in studio and studio["openingHours"]:
            sanity_doc["openingHours"] = studio["openingHours"]
        
        # Sanity will add timestamps automatically when importing
        
        studios.append(sanity_doc)
    
    return studios

def create_import_files(studios):
    """Create different import format files"""
    
    # 1. NDJSON format for Sanity CLI import
    with open('studios_import.ndjson', 'w', encoding='utf-8') as f:
        for studio in studios:
            f.write(json.dumps(studio, ensure_ascii=False) + '\n')
    
    # 2. Regular JSON for manual review
    with open('studios_import.json', 'w', encoding='utf-8') as f:
        json.dump(studios, f, indent=2, ensure_ascii=False)
    
    # 3. TypeScript type definitions for frontend
    with open('studio-types.ts', 'w', encoding='utf-8') as f:
        f.write("""export interface SoundStudioImport {
  _id: string;
  _type: 'soundStudio';
  name: string;
  slug: {
    _type: 'slug';
    current: string;
  };
  description?: string;
  address?: {
    street?: string;
    city?: string;
    county?: string;
    country?: string;
    eircode?: string;
  };
  location?: {
    _type: 'geopoint';
    lat: number;
    lng: number;
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  pricing?: {
    hourlyRate?: number;
    halfDayRate?: number;
    fullDayRate?: number;
    currency: string;
    engineerIncluded?: boolean;
  };
  amenities?: string[];
  genresSupported?: string[];
  features?: string[];
  capacity?: number;
  bandFriendly: boolean;
  studioType: string;
  verified: boolean;
  featured: boolean;
  claimed: boolean;
  openingHours?: Record<string, string>;
  _profileImageUrl?: string; // For manual image import
  _createdAt: string;
  _updatedAt: string;
}

export const STUDIO_AMENITIES = [
  'ssl_console',
  'neve_console', 
  'api_console',
  'pro_tools',
  'logic_pro',
  'cubase',
  'ableton',
  'reaper',
  'neumann_microphones',
  'vintage_microphones',
  'genelec_monitors',
  'yamaha_monitors',
  'grand_piano',
  'vintage_equipment',
  'live_room',
  'vocal_booth',
  'control_room',
  'mastering_suite',
  'mixing_suite',
  '24_hour_access',
  'residential_accommodation',
  'multiple_rooms'
] as const;

export const STUDIO_GENRES = [
  'rock',
  'pop',
  'indie',
  'alternative',
  'electronic',
  'jazz',
  'classical',
  'folk',
  'country',
  'hip_hop',
  'r_and_b',
  'blues',
  'metal',
  'punk',
  'reggae',
  'traditional'
] as const;

export const STUDIO_TYPES = [
  'professional',
  'home',
  'project',
  'residential',
  'rehearsal',
  'live'
] as const;
""")
    
    print(f"✅ Created import files:")
    print(f"   📄 studios_import.ndjson - For Sanity CLI import")
    print(f"   📄 studios_import.json - For manual review")
    print(f"   📄 studio-types.ts - TypeScript definitions")

def main():
    """Main execution with duplicate detection"""
    
    # Load scraped data
    try:
        # Try to load from the actual scraper output first
        try:
            with open('irish_studios_data.json', 'r', encoding='utf-8') as f:
                studio_data = json.load(f)
            print(f"📁 Loaded data from irish_studios_data.json")
        except FileNotFoundError:
            # Fallback to example data
            with open('example_studio_data.json', 'r', encoding='utf-8') as f:
                studio_data = json.load(f)
            print(f"📁 Loaded example data from example_studio_data.json")
    
    except FileNotFoundError:
        print("❌ No studio data files found")
        print("Run the scraper first: python3 irish_studios_scraper.py")
        sys.exit(1)
    
    print(f"🎵 Processing {len(studio_data)} studios...")
    
    # Step 1: Check for duplicates in scraped data
    print(f"\n🔍 Step 1: Detecting duplicates in scraped data...")
    unique_studios = detect_duplicates(studio_data)
    
    # Step 2: Check against existing Sanity data
    print(f"\n🔍 Step 2: Checking against existing Sanity studios...")
    sanity_project_id = "sy7ko2cx"  # Your project ID
    existing_studios = check_existing_sanity_studios(sanity_project_id)
    
    # Filter out studios that already exist in Sanity
    new_studios = []
    skipped_existing = []
    
    for studio in unique_studios:
        studio_name = studio.get("name", "").lower().strip()
        
        # Check if studio already exists in Sanity
        exists_in_sanity = False
        for existing_name in existing_studios:
            if similarity(studio_name, existing_name) > 0.9:  # 90% similarity for existing check
                exists_in_sanity = True
                skipped_existing.append({
                    "name": studio.get("name"),
                    "existing_match": existing_name
                })
                break
        
        if not exists_in_sanity:
            new_studios.append(studio)
    
    print(f"\n📊 SANITY DUPLICATE CHECK:")
    print(f"   Studios after deduplication: {len(unique_studios)}")
    print(f"   Already exist in Sanity: {len(skipped_existing)}")
    print(f"   New studios to import: {len(new_studios)}")
    
    if skipped_existing:
        print(f"\n⏭️  SKIPPED (already in Sanity):")
        for skipped in skipped_existing:
            print(f"   - {skipped['name']}")
    
    if not new_studios:
        print(f"\n✅ No new studios to import - all studios already exist in Sanity!")
        return
    
    # Step 3: Convert to Sanity format
    print(f"\n🔄 Step 3: Converting {len(new_studios)} studios to Sanity format...")
    sanity_studios = convert_to_sanity_format(new_studios)
    
    # Step 4: Create import files
    print(f"\n📁 Step 4: Creating import files...")
    create_import_files(sanity_studios)
    
    print(f"\n📊 FINAL IMPORT SUMMARY:")
    print(f"   Total studios processed: {len(studio_data)}")
    print(f"   Duplicates removed: {len(studio_data) - len(unique_studios)}")
    print(f"   Already in Sanity: {len(skipped_existing)}")
    print(f"   New studios ready for import: {len(sanity_studios)}")
    print(f"   Studios with locations: {len([s for s in sanity_studios if 'location' in s])}")
    print(f"   Studios with contact info: {len([s for s in sanity_studios if 'contact' in s])}")
    print(f"   Studios with pricing: {len([s for s in sanity_studios if 'pricing' in s])}")
    
    if sanity_studios:
        print(f"\n🚀 TO IMPORT INTO SANITY:")
        print(f"   1. Review studios_import.json for accuracy")
        print(f"   2. Run: cd ../cms && npx sanity@latest dataset import studios_import.ndjson production")
        print(f"   3. Or use Sanity Studio's import feature")
        
        print(f"\n💡 NEXT STEPS:")
        print(f"   - Review imported data in Sanity Studio")  
        print(f"   - Add profile images using _profileImageUrl references")
        print(f"   - Verify and update contact information")
        print(f"   - Set featured/verified flags as appropriate")
    else:
        print(f"\n✅ All studios already exist in your CMS!")

if __name__ == "__main__":
    main()
