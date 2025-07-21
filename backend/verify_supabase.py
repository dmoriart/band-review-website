"""
BandVenueReview.ie - Supabase Integration Script
Connect to existing Supabase database and verify the setup
"""

import os
import sys
from datetime import datetime, date

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, User, Band, Venue, Review, Genre

def verify_supabase_connection():
    """Verify connection to Supabase and check existing data"""
    app = create_app('development')
    
    with app.app_context():
        try:
            print("🔗 Connecting to Supabase PostgreSQL...")
            
            # Test the connection
            result = db.engine.execute("SELECT version()")
            version = result.fetchone()[0]
            print(f"✅ Connected successfully!")
            print(f"📊 PostgreSQL version: {version[:50]}...")
            
            # Check existing data
            print("\n📋 Checking existing data:")
            
            # Check genres
            genres = Genre.query.all()
            print(f"🎵 Genres: {len(genres)} found")
            if genres:
                for genre in genres[:5]:  # Show first 5
                    print(f"   - {genre.name}")
            
            # Check venues
            venues = Venue.query.all()
            print(f"🏛️  Venues: {len(venues)} found")
            if venues:
                for venue in venues[:3]:  # Show first 3
                    print(f"   - {venue.name} ({venue.city}, {venue.county})")
            
            # Check users
            users = User.query.all()
            print(f"👤 Users: {len(users)} found")
            
            # Check bands
            bands = Band.query.all()
            print(f"🎸 Bands: {len(bands)} found")
            
            # Check reviews
            reviews = Review.query.all()
            print(f"📝 Reviews: {len(reviews)} found")
            
            print("\n✅ Supabase database connection successful!")
            return True
            
        except Exception as e:
            print(f"❌ Error connecting to Supabase: {str(e)}")
            return False

if __name__ == "__main__":
    success = verify_supabase_connection()
    if not success:
        print("\n💡 Troubleshooting tips:")
        print("1. Make sure you've replaced [YOUR_PASSWORD] in the .env file")
        print("2. Verify your Supabase project is active")
        print("3. Confirm the database_schema.sql was executed in Supabase")
        sys.exit(1)
    else:
        print("\n🎉 Ready to use your Supabase database!")
