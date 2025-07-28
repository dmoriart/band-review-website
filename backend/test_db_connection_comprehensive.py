#!/usr/bin/env python3
"""
Comprehensive Database Connection Test
Tests both individual parameters and URL-based connection methods
"""

import os
import sys
import psycopg2
from psycopg2 import OperationalError
from config import build_database_url

def test_individual_parameters():
    """Test connection using individual environment variables"""
    print("🔍 Testing connection with individual parameters...")
    
    # Check if all required parameters are available
    required_params = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
    missing_params = [param for param in required_params if not os.environ.get(param)]
    
    if missing_params:
        print(f"❌ Missing required environment variables: {', '.join(missing_params)}")
        return False
    
    try:
        conn = psycopg2.connect(
            host=os.environ.get('DB_HOST'),
            port=os.environ.get('DB_PORT'),
            database=os.environ.get('DB_NAME'),
            user=os.environ.get('DB_USER'),
            password=os.environ.get('DB_PASSWORD'),
            sslmode=os.environ.get('DB_SSLMODE', 'require')
        )
        
        cur = conn.cursor()
        cur.execute("SELECT version();")
        db_version = cur.fetchone()
        print(f"✅ Individual parameters connection successful!")
        print(f"   Database version: {db_version[0]}")
        
        # Test a simple query
        cur.execute("SELECT current_database(), current_user;")
        db_info = cur.fetchone()
        print(f"   Connected to database: {db_info[0]} as user: {db_info[1]}")
        
        cur.close()
        conn.close()
        return True
        
    except OperationalError as e:
        print(f"❌ Individual parameters connection failed: {e}")
        return False

def test_url_connection():
    """Test connection using DATABASE_URL"""
    print("\n🔍 Testing connection with DATABASE_URL...")
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return False
    
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        cur.execute("SELECT version();")
        db_version = cur.fetchone()
        print(f"✅ DATABASE_URL connection successful!")
        print(f"   Database version: {db_version[0]}")
        
        cur.close()
        conn.close()
        return True
        
    except OperationalError as e:
        print(f"❌ DATABASE_URL connection failed: {e}")
        return False

def test_config_function():
    """Test the build_database_url function from config.py"""
    print("\n🔍 Testing config.py build_database_url() function...")
    
    try:
        url = build_database_url()
        if not url:
            print("❌ build_database_url() returned None")
            return False
        
        print(f"✅ build_database_url() returned: {url[:50]}...")
        
        # Test the connection with the built URL
        conn = psycopg2.connect(url)
        cur = conn.cursor()
        cur.execute("SELECT version();")
        db_version = cur.fetchone()
        print(f"✅ Connection with built URL successful!")
        print(f"   Database version: {db_version[0]}")
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Config function test failed: {e}")
        return False

def print_environment_info():
    """Print current environment variable status"""
    print("\n📋 Environment Variables Status:")
    print("=" * 50)
    
    # Individual parameters
    individual_params = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_SSLMODE']
    print("Individual Parameters:")
    for param in individual_params:
        value = os.environ.get(param)
        if param == 'DB_PASSWORD' and value:
            print(f"  {param}: {'*' * len(value)}")
        elif value:
            print(f"  {param}: {value}")
        else:
            print(f"  {param}: ❌ NOT SET")
    
    # URL parameter
    print("\nURL Parameter:")
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        # Hide password in URL for security
        safe_url = database_url
        if '@' in safe_url:
            parts = safe_url.split('@')
            if ':' in parts[0]:
                user_pass = parts[0].split(':')
                if len(user_pass) >= 3:  # protocol:user:pass
                    safe_url = f"{user_pass[0]}:{user_pass[1]}:***@{parts[1]}"
        print(f"  DATABASE_URL: {safe_url}")
    else:
        print(f"  DATABASE_URL: ❌ NOT SET")

def main():
    """Run all database connection tests"""
    print("🚀 Starting Comprehensive Database Connection Tests")
    print("=" * 60)
    
    # Print environment info
    print_environment_info()
    
    # Run tests
    results = []
    
    # Test 1: Individual parameters
    results.append(("Individual Parameters", test_individual_parameters()))
    
    # Test 2: DATABASE_URL
    results.append(("DATABASE_URL", test_url_connection()))
    
    # Test 3: Config function
    results.append(("Config Function", test_config_function()))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY:")
    print("=" * 60)
    
    all_passed = True
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"  {test_name}: {status}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 ALL TESTS PASSED! Your database connection is working correctly.")
        print("   You can now deploy to Render with confidence.")
    else:
        print("⚠️  SOME TESTS FAILED. Please check your environment variables.")
        print("   Make sure all required variables are set in your Render environment.")
    
    print("\n💡 For Render deployment, set these environment variables:")
    print("   DB_HOST=aws-0-eu-west-1.pooler.supabase.com")
    print("   DB_PORT=5432")
    print("   DB_NAME=postgres")
    print("   DB_USER=postgres.thoghjwipjpkxcfkkcbx")
    print("   DB_PASSWORD=your_actual_password")
    print("   DB_SSLMODE=require")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
