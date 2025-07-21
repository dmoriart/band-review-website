#!/usr/bin/env python3
"""
Test the running Flask API
"""
import requests
import json

def test_api():
    base_url = "http://localhost:8000/api"
    
    # Test health endpoint
    print("🔍 Testing API endpoints...")
    
    try:
        print("\n1. Testing /api/health")
        response = requests.get(f"{base_url}/health", timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        print("\n2. Testing /api/venues")
        response = requests.get(f"{base_url}/venues", timeout=5)
        print(f"   Status: {response.status_code}")
        data = response.json()
        print(f"   Found {len(data.get('venues', []))} venues")
        
        if data.get('venues'):
            print(f"   First venue: {data['venues'][0]['name']}")
        
        print("\n✅ API is working correctly!")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API. Make sure Flask server is running.")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    test_api()
