#!/usr/bin/env python3
"""
Sanity CMS Band Data Importer with Duplicate Detection
Converts scraped band data into Sanity import format
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

def detect_duplicates(bands: List[Dict]) -> List[Dict]:
    """Detect and handle duplicate bands"""
    seen_names: Set[str] = set()
    seen_mbids: Set[str] = set()
    
    filtered_bands = []
    duplicates_found = []
    
    for band in bands:
        name = band.get("name", "").lower().strip()
        mbid = band.get("musicbrainzId", "").strip()
        
        is_duplicate = False
        duplicate_reason = ""
        
        # Check for exact MusicBrainz ID match (most reliable)
        if mbid and mbid in seen_mbids:
            is_duplicate = True
            duplicate_reason = "same MusicBrainz ID"
        
        # Check for exact name match
        elif name in seen_names:
            is_duplicate = True
            duplicate_reason = "exact name match"
        
        # Check for similar names (90% similarity threshold for bands)
        else:
            for seen_name in seen_names:
                if similarity(name, seen_name) > 0.90:
                    is_duplicate = True
                    duplicate_reason = f"similar name to existing band"
                    break
        
        if is_duplicate:
            duplicates_found.append({
                "name": band.get("name"),
                "reason": duplicate_reason
            })
            print(f"🔄 Duplicate detected: {band.get('name')} ({duplicate_reason})")
        else:
            filtered_bands.append(band)
            seen_names.add(name)
            if mbid:
                seen_mbids.add(mbid)
    
    print(f"📊 Deduplication summary:")
    print(f"   Original bands: {len(bands)}")
    print(f"   Duplicates found: {len(duplicates_found)}")
    print(f"   Unique bands: {len(filtered_bands)}")
    
    # Save duplicate report
    if duplicates_found:
        with open('band_duplicates_report.json', 'w') as f:
            json.dump(duplicates_found, f, indent=2)
        print(f"📋 Duplicate report saved to: band_duplicates_report.json")
    
    return filtered_bands

def check_existing_bands_in_sanity():
    """Check what bands already exist in Sanity"""
    existing_bands = set()
    
    try:
        # Sanity API query to get existing band names
        project_id = "sy7ko2cx"  # Your project ID
        dataset = "production"
        query = '*[_type == "band"] { name, slug }'
        
        sanity_url = f"https://{project_id}.api.sanity.io/v2021-10-21/data/query/{dataset}"
        
        params = {"query": query}
        response = requests.get(sanity_url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            for band in data.get("result", []):
                if band.get("name"):
                    existing_bands.add(band["name"].lower().strip())
            
            print(f"📋 Found {len(existing_bands)} existing bands in Sanity")
        else:
            print(f"⚠️  Could not fetch existing bands (status: {response.status_code})")
    
    except Exception as e:
        print(f"⚠️  Error checking existing bands: {e}")
    
    return existing_bands

def create_slug(name):
    """Create URL-friendly slug from band name"""
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
        slug = 'band-' + slug
    
    return slug or 'band'

def convert_to_sanity_format(band_data):
    """Convert band data to Sanity document format"""
    bands = []
    
    for band in band_data:
        # Create unique document ID
        doc_id = f"band-{create_slug(band['name'])}"
        
        sanity_doc = {
            "_id": doc_id,
            "_type": "band",
            "name": band["name"],
            "slug": {
                "_type": "slug",
                "current": create_slug(band["name"])
            },
            "description": band.get("description", ""),
            "isActive": band.get("isActive", True),
            "hasRecentActivity": band.get("hasRecentActivity", False),
            "verified": False,
            "featured": False
        }
        
        # Add location information
        location = {}
        if band.get("city"):
            location["city"] = band["city"]
        if band.get("county"):
            location["county"] = band["county"]
        if band.get("country"):
            location["country"] = band["country"]
        
        if location:
            sanity_doc["location"] = location
        
        # Add contact information
        contact = {}
        if band.get("email"):
            contact["email"] = band["email"]
        if band.get("website"):
            contact["website"] = band["website"]
        if band.get("facebook"):
            contact["facebook"] = band["facebook"]
        if band.get("instagram"):
            contact["instagram"] = band["instagram"]
        if band.get("twitter"):
            contact["twitter"] = band["twitter"]
        
        if contact:
            sanity_doc["contact"] = contact
        
        # Add music details
        music_details = {}
        if band.get("musicGenres"):
            music_details["genres"] = band["musicGenres"]
        if band.get("bandType"):
            music_details["bandType"] = band["bandType"]
        if band.get("formedYear"):
            music_details["formedYear"] = band["formedYear"]
        if band.get("memberCount"):
            music_details["memberCount"] = band["memberCount"]
        if band.get("recordLabel"):
            music_details["recordLabel"] = band["recordLabel"]
        
        if music_details:
            sanity_doc["musicDetails"] = music_details
        
        # Add streaming links
        streaming = {}
        if band.get("spotify"):
            streaming["spotify"] = band["spotify"]
        if band.get("bandcamp"):
            streaming["bandcamp"] = band["bandcamp"]
        if band.get("youtube"):
            streaming["youtube"] = band["youtube"]
        
        if streaming:
            sanity_doc["streamingLinks"] = streaming
        
        # Add stats
        stats = {}
        if band.get("lastfmListeners"):
            stats["lastfmListeners"] = band["lastfmListeners"]
        if band.get("spotifyFollowers"):
            stats["spotifyFollowers"] = band["spotifyFollowers"]
        
        if stats:
            sanity_doc["stats"] = stats
        
        # Add external IDs
        if band.get("musicbrainzId"):
            sanity_doc["musicbrainzId"] = band["musicbrainzId"]
        
        bands.append(sanity_doc)
    
    return bands

def create_import_files(bands):
    """Create different import format files"""
    
    # 1. NDJSON format for Sanity CLI import
    ndjson_content = []
    for band in bands:
        ndjson_content.append(json.dumps(band, ensure_ascii=False))
    
    with open('bands_import.ndjson', 'w', encoding='utf-8') as f:
        f.write('\n'.join(ndjson_content))
    
    # 2. Regular JSON for manual review
    with open('bands_sanity_format.json', 'w', encoding='utf-8') as f:
        json.dump(bands, f, indent=2, ensure_ascii=False)
    
    # 3. Create import script
    import_script = '''#!/bin/bash
# Sanity Band Import Script
# Run this from your CMS directory

echo "🎵 Importing bands to Sanity CMS..."
echo "Project: band-review-website"
echo "Dataset: production"
echo ""

# Check if sanity CLI is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js first"
    exit 1
fi

# Import the bands
echo "📊 Importing {count} bands..."
npx sanity dataset import bands_import.ndjson production --missing

echo "✅ Import completed!"
echo ""
echo "🔗 View your bands at: https://band-review-website.sanity.studio/structure/band"
'''.replace('{count}', str(len(bands)))
    
    with open('import_bands.sh', 'w') as f:
        f.write(import_script)
    
    # Make the script executable
    import os
    os.chmod('import_bands.sh', 0o755)
    
    print(f"📁 Created import files:")
    print(f"   📄 bands_import.ndjson ({len(bands)} bands)")
    print(f"   📄 bands_sanity_format.json (human-readable)")
    print(f"   🔧 import_bands.sh (import script)")

def filter_existing_bands(bands, existing_names):
    """Filter out bands that already exist in Sanity"""
    new_bands = []
    existing_count = 0
    
    for band in bands:
        band_name = band["name"].lower().strip()
        if band_name in existing_names:
            existing_count += 1
            print(f"⏭️  Skipping existing band: {band['name']}")
        else:
            new_bands.append(band)
    
    print(f"📊 Filtering results:")
    print(f"   Already in Sanity: {existing_count}")
    print(f"   New bands to import: {len(new_bands)}")
    
    return new_bands

def main():
    """Main import process"""
    
    print("🎵 Sanity Band Data Importer")
    print("============================")
    
    # Load scraped band data
    try:
        with open('scripts/irish_bands_data.json', 'r', encoding='utf-8') as f:
            raw_bands = json.load(f)
        print(f"✅ Loaded {len(raw_bands)} scraped bands")
    except FileNotFoundError:
        print("❌ Error: scripts/irish_bands_data.json not found!")
        print("   Please run the band scraper first.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error loading band data: {e}")
        sys.exit(1)
    
    # Detect and remove duplicates
    print("\n🔍 Detecting duplicates...")
    unique_bands = detect_duplicates(raw_bands)
    
    # Check existing bands in Sanity
    print("\n📋 Checking existing bands in Sanity...")
    existing_bands = check_existing_bands_in_sanity()
    
    # Convert to Sanity format
    print("\n🔄 Converting to Sanity format...")
    sanity_bands = convert_to_sanity_format(unique_bands)
    
    # Filter out bands that already exist
    if existing_bands:
        print("\n🔍 Filtering out existing bands...")
        new_bands = filter_existing_bands(sanity_bands, existing_bands)
    else:
        new_bands = sanity_bands
    
    if not new_bands:
        print("\n✅ No new bands to import. All bands already exist in Sanity.")
        return
    
    # Create import files
    print(f"\n📦 Creating import files for {len(new_bands)} new bands...")
    create_import_files(new_bands)
    
    # Summary
    print(f"\n📊 IMPORT SUMMARY")
    print(f"=================")
    print(f"Total scraped bands: {len(raw_bands)}")
    print(f"After deduplication: {len(unique_bands)}")
    print(f"Already in Sanity: {len(sanity_bands) - len(new_bands)}")
    print(f"Ready to import: {len(new_bands)}")
    
    # Show band breakdown by activity and genres
    active_count = len([b for b in new_bands if b.get("isActive", True)])
    with_genres = len([b for b in new_bands if b.get("musicDetails", {}).get("genres")])
    with_contact = len([b for b in new_bands if b.get("contact")])
    
    print(f"\n📈 Band Statistics:")
    print(f"   Active bands: {active_count}")
    print(f"   Bands with genres: {with_genres}")
    print(f"   Bands with contact info: {with_contact}")
    
    # Show some famous bands
    famous_bands = []
    famous_names = ['u2', 'the cranberries', 'thin lizzy', 'the dubliners', 'westlife', 'boyzone', 'the corrs', 'clannad']
    for band in new_bands:
        if band["name"].lower() in famous_names:
            famous_bands.append(band["name"])
    
    if famous_bands:
        print(f"\n🌟 Famous bands included:")
        for band_name in famous_bands[:10]:
            print(f"   • {band_name}")
    
    print(f"\n🚀 Next steps:")
    print(f"   1. Review bands_sanity_format.json")
    print(f"   2. Run: cd /path/to/your/cms && ./import_bands.sh")
    print(f"   3. Check your Sanity Studio to verify the import")

if __name__ == "__main__":
    main()
