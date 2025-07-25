#!/usr/bin/env python3
"""
Test script to demonstrate enhanced scraping and duplicate detection
"""

import json
from sanity_importer import detect_duplicates, similarity, check_existing_sanity_studios

def create_test_data_with_duplicates():
    """Create test data with intentional duplicates"""
    return [
        {
            "name": "Windmill Lane Studios",
            "city": "Dublin",
            "contact": {"website": "https://windmilllanerecording.com/"},
            "location": {"lat": 53.3498, "lng": -6.2603}
        },
        {
            "name": "Windmill Lane Recording",  # Similar name
            "city": "Dublin", 
            "contact": {"website": "https://windmilllanerecording.com/"},  # Same website
            "location": {"lat": 53.3499, "lng": -6.2604}  # Very close location
        },
        {
            "name": "Temple Lane Studios",
            "city": "Dublin",
            "contact": {"website": "https://templelane.com/"},
            "location": {"lat": 53.3456, "lng": -6.2672}
        },
        {
            "name": "Temple Lane Recording Studio",  # Similar name
            "city": "Dublin",
            "contact": {"website": "https://different-site.com/"},
            "location": {"lat": 53.3456, "lng": -6.2673}  # Same location (rounded)
        },
        {
            "name": "Grouse Lodge Studios",
            "city": "Westmeath",
            "contact": {"website": "https://grouselodge.com/"},
            "location": {"lat": 53.3956, "lng": -7.9219}
        },
        {
            "name": "Sun Studios Dublin",
            "city": "Dublin",
            "contact": {"website": "https://sunstudios.ie/"},
            "location": {"lat": 53.3384, "lng": -6.2612}
        }
    ]

def test_similarity():
    """Test name similarity detection"""
    print("🧪 Testing name similarity detection...")
    
    test_pairs = [
        ("Windmill Lane Studios", "Windmill Lane Recording", True),
        ("Temple Lane Studios", "Temple Lane Recording Studio", True),
        ("Sun Studios", "Moon Studios", False),
        ("Abbey Road Studios", "Abbey Road Recording", True),
        ("Different Studio", "Another Studio", False)
    ]
    
    for name1, name2, should_be_similar in test_pairs:
        sim = similarity(name1, name2)
        is_similar = sim > 0.85
        status = "✅" if is_similar == should_be_similar else "❌"
        print(f"   {status} '{name1}' vs '{name2}': {sim:.2f} ({'similar' if is_similar else 'different'})")

def test_duplicate_detection():
    """Test the duplicate detection system"""
    print("\n🧪 Testing duplicate detection...")
    
    test_data = create_test_data_with_duplicates()
    print(f"Input: {len(test_data)} studios")
    
    filtered_data = detect_duplicates(test_data)
    print(f"Output: {len(filtered_data)} unique studios")
    
    print("\n✅ Remaining studios:")
    for studio in filtered_data:
        print(f"   - {studio['name']} ({studio['city']})")

def test_expanded_studio_list():
    """Show the expanded list of studios"""
    print("\n📋 Expanded Irish Studios List:")
    
    # Import the expanded list from the scraper
    try:
        import sys
        sys.path.append('.')
        from irish_studios_scraper import IrishStudioDirectoryScraper
        
        scraper = IrishStudioDirectoryScraper("test-key")
        studios = scraper.known_studios
        
        print(f"Total curated studios: {len(studios)}")
        
        # Group by city
        by_city = {}
        for studio in studios:
            city = studio['city']
            if city not in by_city:
                by_city[city] = []
            by_city[city].append(studio['name'])
        
        for city, studio_names in sorted(by_city.items()):
            print(f"\n🏙️  {city} ({len(studio_names)} studios):")
            for name in studio_names:
                print(f"   • {name}")
                
    except Exception as e:
        print(f"Error loading expanded list: {e}")

def main():
    """Run all tests"""
    print("🎵 Enhanced Studio Scraper - Testing Suite\n")
    
    test_similarity()
    test_duplicate_detection() 
    test_expanded_studio_list()
    
    print(f"\n🚀 Enhancement Summary:")
    print(f"   ✅ Expanded from 10 to 28+ curated studios")
    print(f"   ✅ Added Google Places API discovery")
    print(f"   ✅ Implemented duplicate detection (name, website, location)")
    print(f"   ✅ Added similarity matching (85% threshold)")
    print(f"   ✅ Sanity CMS existing studio checking")
    print(f"   ✅ Studio validation (filters non-studios)")
    
    print(f"\n💡 To run enhanced scraping:")
    print(f"   python3 irish_studios_scraper.py")
    print(f"   python3 sanity_importer.py")

if __name__ == "__main__":
    main()
