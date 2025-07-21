#!/usr/bin/env python3
"""
Test the simple Flask server
"""
import requests
import json

def test_simple_api():
    base_url = "http://localhost:8001/api"
    
    print("🔍 Testing simple API...")
    
    try:
        print("\n1. Testing /api/health")
        response = requests.get(f"{base_url}/health", timeout=10)
        print(f"   Status: {response.status_code}")
        data = response.json()
        print(f"   Message: {data.get('message')}")
        print(f"   Database: {data.get('database')}")
        
        print("\n2. Testing /api/test-venues")
        response = requests.get(f"{base_url}/test-venues", timeout=10)
        print(f"   Status: {response.status_code}")
        data = response.json()
        
        if response.status_code == 200:
            print(f"   Found {data.get('count')} venues")
            for venue in data.get('venues', []):
                print(f"   - {venue['name']} ({venue['city']})")
        else:
            print(f"   Error: {data.get('error')}")
        
        print("\n✅ Tests completed!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    test_simple_api()
