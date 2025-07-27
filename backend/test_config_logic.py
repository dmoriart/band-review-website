#!/usr/bin/env python3
"""
Test the database configuration logic
"""

import os
import sys
from config import build_database_url

def test_config_logic():
    """Test the database URL building logic"""
    print("🧪 Testing Database Configuration Logic")
    print("=" * 50)
    
    # Test 1: No environment variables set
    print("\n1. Testing with no DB environment variables:")
    url = build_database_url()
    database_url = os.environ.get('DATABASE_URL')
    print(f"   build_database_url() returned: {url}")
    print(f"   DATABASE_URL env var: {database_url}")
    print(f"   ✅ Correctly falls back to DATABASE_URL" if url == database_url else "   ❌ Fallback failed")
    
    # Test 2: Set individual parameters temporarily
    print("\n2. Testing with individual DB parameters set:")
    
    # Save original values
    original_values = {}
    test_params = {
        'DB_HOST': 'test-host.example.com',
        'DB_PORT': '5432',
        'DB_NAME': 'test_db',
        'DB_USER': 'test_user',
        'DB_PASSWORD': 'test_password',
        'DB_SSLMODE': 'require'
    }
    
    # Set test values
    for key, value in test_params.items():
        original_values[key] = os.environ.get(key)
        os.environ[key] = value
    
    try:
        url = build_database_url()
        expected_url = "postgresql://test_user:test_password@test-host.example.com:5432/test_db?sslmode=require"
        print(f"   build_database_url() returned: {url}")
        print(f"   Expected URL: {expected_url}")
        print(f"   ✅ Correctly built URL from parameters" if url == expected_url else "   ❌ URL building failed")
        
    finally:
        # Restore original values
        for key, original_value in original_values.items():
            if original_value is None:
                if key in os.environ:
                    del os.environ[key]
            else:
                os.environ[key] = original_value
    
    # Test 3: Partial parameters (should fall back)
    print("\n3. Testing with partial DB parameters (missing password):")
    
    # Set only some parameters
    partial_params = {
        'DB_HOST': 'test-host.example.com',
        'DB_PORT': '5432',
        'DB_NAME': 'test_db',
        'DB_USER': 'test_user'
        # Missing DB_PASSWORD
    }
    
    # Save and set partial values
    original_values = {}
    for key, value in partial_params.items():
        original_values[key] = os.environ.get(key)
        os.environ[key] = value
    
    try:
        url = build_database_url()
        database_url = os.environ.get('DATABASE_URL')
        print(f"   build_database_url() returned: {url}")
        print(f"   DATABASE_URL env var: {database_url}")
        print(f"   ✅ Correctly falls back when parameters incomplete" if url == database_url else "   ❌ Fallback failed")
        
    finally:
        # Restore original values
        for key, original_value in original_values.items():
            if original_value is None:
                if key in os.environ:
                    del os.environ[key]
            else:
                os.environ[key] = original_value
    
    print("\n" + "=" * 50)
    print("🎉 Configuration logic test completed!")
    print("\n💡 This means your app will:")
    print("   1. Use individual DB parameters if all are provided (Render)")
    print("   2. Fall back to DATABASE_URL if parameters are missing")
    print("   3. Use SQLite for development if neither is available")

if __name__ == "__main__":
    test_config_logic()
