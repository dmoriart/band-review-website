#!/usr/bin/env python3
"""
Demonstration of Enhanced Studio Scraping Capabilities
"""

import json

def show_enhanced_capabilities():
    """Show what enhancements were made"""
    
    print("🎵 ENHANCED IRISH MUSIC STUDIOS SCRAPER")
    print("=" * 50)
    
    print("\n📈 INCREASED STUDIO COUNT:")
    print("   • Original: 10 manually curated studios")
    print("   • Enhanced: 28+ curated studios + Google Places discovery")
    print("   • Cities covered: Dublin, Cork, Belfast, Galway, Limerick, Waterford, +regional")
    
    print("\n🔍 DUPLICATE DETECTION FEATURES:")
    print("   ✅ Name similarity matching (85% threshold)")
    print("   ✅ Exact website URL matching")
    print("   ✅ Location proximity checking (within 100m)")
    print("   ✅ Cross-reference with existing Sanity data")
    print("   ✅ Smart filtering of non-studio businesses")
    
    print("\n🏙️ GEOGRAPHIC COVERAGE:")
    cities_coverage = {
        "Dublin": ["Windmill Lane", "Temple Lane", "Sun Studios", "Westland", "Pulse", "Big Space", "Orphan", "Clique", "JAM", "Depot", "Darklands", "Fascination Street"],
        "Cork": ["Sonic Studios", "Monique", "De Barras", "MAD Studios"],
        "Belfast": ["Studio 1", "Blast Furnace", "Start Together", "Analogue Catalogue"],
        "Galway": ["Aimsir", "DNA Studios"],
        "Limerick": ["Troy Studios", "Redbox"],
        "Regional": ["Grouse Lodge (Westmeath)", "Cauldron (Sligo)", "Black Mountain (Dundalk)", "Ocean (Waterford)", "Athlone Audio", "Kilkenny Sound"]
    }
    
    for city, studios in cities_coverage.items():
        print(f"   🏙️  {city}: {len(studios)} studios")
        for studio in studios[:3]:  # Show first 3
            print(f"      • {studio}")
        if len(studios) > 3:
            print(f"      • ... and {len(studios) - 3} more")
    
    print("\n🤖 GOOGLE PLACES API INTEGRATION:")
    print("   • Automatic studio discovery in major cities")
    print("   • High-quality photos extraction")
    print("   • GPS coordinates for all locations")  
    print("   • Contact information validation")
    print("   • User ratings and reviews data")
    
    print("\n🛡️ QUALITY ASSURANCE:")
    print("   • Robots.txt compliance checking")
    print("   • Rate limiting (1-2 second delays)")
    print("   • Smart filtering of non-music businesses")
    print("   • Address parsing and validation")
    print("   • Phone number format validation (Irish)")
    
    print("\n📊 DATA ENRICHMENT:")
    print("   • Equipment lists (SSL, Neve, Pro Tools, etc.)")
    print("   • Pricing structures (hourly/daily rates)")
    print("   • Genre specializations")
    print("   • Social media profiles")
    print("   • Studio capacity and features")
    
    print("\n🔄 IMPORT PROCESS:")
    print("   1. Scrape 28+ curated studios + Google discoveries")
    print("   2. Detect and remove duplicates")
    print("   3. Cross-check with existing Sanity data")
    print("   4. Generate clean import files")
    print("   5. Import only new, unique studios")
    
    print("\n📁 OUTPUT FILES:")
    print("   • irish_studios_data.json - Complete scraped data")
    print("   • studios_import.ndjson - Sanity CLI import format")
    print("   • studios_import.json - Human-readable format")
    print("   • studio-types.ts - TypeScript definitions")
    
    print("\n⚡ USAGE:")
    print("   python3 irish_studios_scraper.py    # Collect studios")
    print("   python3 sanity_importer.py          # Process & import")
    print("   cd ../cms && npx sanity@latest dataset import studios_import.ndjson production")

def show_duplicate_detection_example():
    """Show how duplicate detection works"""
    
    print("\n" + "=" * 50)
    print("🔍 DUPLICATE DETECTION DEMONSTRATION")
    print("=" * 50)
    
    print("\n📝 Example Input (with duplicates):")
    examples = [
        {"name": "Windmill Lane Studios", "website": "windmilllane.com", "lat": 53.3498},
        {"name": "Windmill Lane Recording", "website": "windmilllane.com", "lat": 53.3499},  # Same website
        {"name": "Temple Lane Studios", "website": "templelane.com", "lat": 53.3456},
        {"name": "Temple Lane Recording Studio", "website": "different.com", "lat": 53.3456},  # Same location
        {"name": "Sun Studios Dublin", "website": "sunstudios.ie", "lat": 53.3384},
    ]
    
    for i, studio in enumerate(examples, 1):
        print(f"   {i}. {studio['name']} - {studio['website']} - ({studio['lat']})")
    
    print("\n🧠 Detection Logic:")
    print("   ✅ Studios 1 & 2: Same website (windmilllane.com)")
    print("   ✅ Studios 3 & 4: Same location (53.3456)")
    print("   ✅ Similar names detected with 85% threshold")
    
    print("\n✨ Result After Deduplication:")
    print("   1. Windmill Lane Studios ✅")
    print("   2. Temple Lane Studios ✅") 
    print("   3. Sun Studios Dublin ✅")
    print("   📊 Removed: 2 duplicates, Kept: 3 unique")

def main():
    show_enhanced_capabilities()
    show_duplicate_detection_example()
    
    print("\n" + "=" * 50)
    print("🎉 READY TO SCALE YOUR STUDIO DIRECTORY!")
    print("=" * 50)

if __name__ == "__main__":
    main()
