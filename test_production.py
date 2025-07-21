#!/usr/bin/env python3
"""
Test script for BandVenueReview.ie production deployment
Run this after deploying to Render.com to verify everything works
"""

import requests
import sys
import json

def test_api_endpoint(base_url):
    """Test the deployed API endpoints"""
    
    print(f"🧪 Testing BandVenueReview.ie API at: {base_url}")
    print("=" * 60)
    
    # Test health endpoint
    try:
        print("1. Testing health endpoint...")
        health_url = f"{base_url}/api/health"
        response = requests.get(health_url, timeout=30)
        
        if response.status_code == 200:
            print("✅ Health check passed!")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    # Test venues endpoint
    try:
        print("\n2. Testing venues endpoint...")
        venues_url = f"{base_url}/api/venues"
        response = requests.get(venues_url, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Venues endpoint working!")
            print(f"   Found {data.get('total', 0)} venues")
            if data.get('venues'):
                print(f"   Sample venue: {data['venues'][0]['name']}")
        else:
            print(f"❌ Venues endpoint failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Venues endpoint error: {e}")
        return False
    
    # Test genres endpoint
    try:
        print("\n3. Testing genres endpoint...")
        genres_url = f"{base_url}/api/genres"
        response = requests.get(genres_url, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Genres endpoint working!")
            print(f"   Found {len(data.get('genres', []))} genres")
        else:
            print(f"❌ Genres endpoint failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Genres endpoint error: {e}")
        return False
    
    print("\n🎉 All tests passed! Your API is working correctly.")
    return True

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python test_production.py <your-render-url>")
        print("Example: python test_production.py https://bandvenuereview-api.onrender.com")
        sys.exit(1)
    
    base_url = sys.argv[1].rstrip('/')
    success = test_api_endpoint(base_url)
    
    if success:
        print("\n📋 Next steps:")
        print(f"1. Update your frontend environment variable:")
        print(f"   REACT_APP_API_URL={base_url}/api")
        print("2. Redeploy your Netlify frontend")
        print("3. Test the full application!")
        sys.exit(0)
    else:
        print("\n🔧 Troubleshooting:")
        print("1. Check Render.com logs for errors")
        print("2. Verify DATABASE_URL is set correctly")
        print("3. Ensure all environment variables are configured")
        sys.exit(1)
