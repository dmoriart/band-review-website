#!/usr/bin/env python3
"""
Test script to verify Supabase PostgreSQL connection
Run this after updating the DATABASE_URL with your password
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def test_connection():
    """Test the database connection"""
    
    # Load environment variables
    load_dotenv()
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        return False
        
    if '[YOUR_PASSWORD]' in database_url:
        print("❌ Please replace [YOUR_PASSWORD] in the .env file with your actual Supabase password")
        return False
    
    try:
        print("🔗 Testing database connection...")
        print(f"📍 Connecting to: {database_url.split('@')[1] if '@' in database_url else database_url}")
        
        # Create engine
        engine = create_engine(database_url)
        
        # Test connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✅ Connected successfully!")
            print(f"📊 PostgreSQL version: {version[:50]}...")
            
            # Check if our tables exist
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('users', 'bands', 'venues', 'reviews', 'genres')
                ORDER BY table_name
            """))
            
            tables = [row[0] for row in result.fetchall()]
            print(f"📋 Found tables: {', '.join(tables)}")
            
            if len(tables) == 5:
                print("✅ All expected tables found!")
            else:
                expected = {'users', 'bands', 'venues', 'reviews', 'genres'}
                missing = expected - set(tables)
                if missing:
                    print(f"⚠️  Missing tables: {', '.join(missing)}")
                    print("💡 Make sure you ran the database_schema.sql script in Supabase")
            
            # Test sample venue data
            result = connection.execute(text("SELECT COUNT(*) FROM venues"))
            venue_count = result.fetchone()[0]
            print(f"🏛️  Found {venue_count} venues in database")
            
            return True
            
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        print("💡 Check your DATABASE_URL and make sure:")
        print("   - The password is correct")
        print("   - The Supabase project is active")
        print("   - The database_schema.sql was executed")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
