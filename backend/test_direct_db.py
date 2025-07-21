#!/usr/bin/env python3
"""
Direct database test without Flask ORM
"""
import os
import sys
import psycopg2
from dotenv import load_dotenv

def test_database_directly():
    load_dotenv()
    database_url = os.environ.get('DATABASE_URL')
    
    print("🔗 Testing direct database connection...")
    
    try:
        # Parse the URL
        url_parts = database_url.replace('postgresql://', '').split('@')
        user_pass = url_parts[0]
        host_port_db = url_parts[1]
        
        user = user_pass.split(':')[0]
        password = ':'.join(user_pass.split(':')[1:])
        
        host_port = host_port_db.split('/')[0]
        host = host_port.split(':')[0]
        port = host_port.split(':')[1]
        database = host_port_db.split('/')[1]
        
        print(f"📍 Connecting to {host}:{port}")
        
        # Connect to database
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password,
            connect_timeout=10,
            sslmode='require'
        )
        
        cursor = conn.cursor()
        
        print("✅ Connected successfully!")
        
        # Test basic queries
        print("\n📊 Testing queries:")
        
        print("1. Testing simple SELECT 1...")
        cursor.execute("SELECT 1;")
        result = cursor.fetchone()
        print(f"   Result: {result[0]}")
        
        print("2. Testing table existence...")
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'venues', 'bands', 'reviews', 'genres')
            ORDER BY table_name;
        """)
        tables = cursor.fetchall()
        print(f"   Found tables: {[t[0] for t in tables]}")
        
        print("3. Testing venue count...")
        cursor.execute("SELECT COUNT(*) FROM venues;")
        count = cursor.fetchone()[0]
        print(f"   Venue count: {count}")
        
        if count > 0:
            print("4. Testing venue data...")
            cursor.execute("SELECT name, city, county FROM venues LIMIT 3;")
            venues = cursor.fetchall()
            for name, city, county in venues:
                print(f"   - {name} ({city}, {county})")
        
        print("\n🎉 All database tests passed!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_database_directly()
    sys.exit(0 if success else 1)
