#!/usr/bin/env python3
"""
Direct psycopg2 connection test
"""
import os
import psycopg2
from dotenv import load_dotenv

def test_direct_connection():
    load_dotenv()
    database_url = os.environ.get('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL not found")
        return False
        
    print(f"🔗 Testing direct psycopg2 connection...")
    
    try:
        # Parse the URL to get components
        # Format: postgresql://user:password@host:port/database
        url_parts = database_url.replace('postgresql://', '').split('@')
        user_pass = url_parts[0]
        host_port_db = url_parts[1]
        
        user = user_pass.split(':')[0]
        password = ':'.join(user_pass.split(':')[1:])  # Handle passwords with colons
        
        host_port = host_port_db.split('/')[0]
        host = host_port.split(':')[0]
        port = host_port.split(':')[1]
        database = host_port_db.split('/')[1]
        
        print(f"📍 Host: {host}")
        print(f"📍 Port: {port}")
        print(f"📍 Database: {database}")
        print(f"📍 User: {user}")
        
        # Try direct connection
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password,
            connect_timeout=10,
            sslmode='require'  # Supabase requires SSL
        )
        
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        
        print(f"✅ Connected successfully!")
        print(f"📊 PostgreSQL version: {version[:50]}...")
        
        # Test a simple query
        cursor.execute("SELECT COUNT(*) FROM venues;")
        venue_count = cursor.fetchone()[0]
        print(f"🏛️  Found {venue_count} venues")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        print(f"📋 Error type: {type(e).__name__}")
        return False

if __name__ == "__main__":
    test_direct_connection()
