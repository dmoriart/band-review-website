#!/usr/bin/env python3
"""
Debug script to test different Render.com URL patterns
"""

import requests
import sys

# Common Render.com URL patterns to try
url_patterns = [
    "https://bandvenuereview-api.onrender.com",
    "https://band-review-website.onrender.com", 
    "https://band-review-website-api.onrender.com",
    "https://bandvenuereview.onrender.com",
    # Add your actual URL here if different
]

def test_url(base_url):
    """Test if a URL is accessible"""
    try:
        health_url = f"{base_url}/api/health"
        print(f"Testing: {health_url}")
        
        response = requests.get(health_url, timeout=10)
        
        if response.status_code == 200:
            print(f"✅ SUCCESS: {base_url}")
            print(f"   Response: {response.json()}")
            return base_url
        else:
            print(f"❌ Failed: HTTP {response.status_code}")
            
    except requests.exceptions.Timeout:
        print(f"⏰ Timeout: {base_url}")
    except requests.exceptions.ConnectionError:
        print(f"🔌 Connection Error: {base_url}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    return None

def main():
    print("🔍 Testing Render.com API URLs...")
    print("=" * 50)
    
    working_url = None
    
    for url in url_patterns:
        working_url = test_url(url)
        if working_url:
            break
        print()
    
    if working_url:
        print(f"\n🎉 Found working API: {working_url}")
        print(f"\n📋 Next steps:")
        print(f"1. In Netlify settings, set environment variable:")
        print(f"   REACT_APP_API_URL={working_url}/api")
        print(f"2. Redeploy your Netlify site")
        print(f"3. Test the connection")
    else:
        print(f"\n❌ No working URLs found.")
        print(f"📋 Troubleshooting steps:")
        print(f"1. Check your Render.com dashboard for the actual URL")
        print(f"2. Verify the deployment completed successfully")
        print(f"3. Check Render logs for any startup errors")

if __name__ == "__main__":
    main()
