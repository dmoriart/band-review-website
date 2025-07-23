#!/usr/bin/env python3
"""
Add sample data to test database
"""
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app_bands import create_app
from models_bands_sqlite import db, Band

def add_sample_band():
    """Add a sample band to test the database"""
    app = create_app('development')
    
    with app.app_context():
        print("🎸 Adding sample band...")
        
        # Create a sample band
        band = Band(
            name="The Test Band",
            slug="the-test-band",
            bio="A sample band for testing the API",
            formed_year=2020,
            hometown="Dublin",
            county="Dublin",
            country="Ireland",
            is_active=True,
            is_verified=False
        )
        
        # Set genres using the helper method
        band.set_genres(["rock", "indie"])
        
        try:
            db.session.add(band)
            db.session.commit()
            print(f"   ✅ Added band: {band.name}")
            
            # Verify it was added
            bands = Band.query.all()
            print(f"   📊 Total bands in database: {len(bands)}")
            
        except Exception as e:
            print(f"   ❌ Error adding band: {e}")
            db.session.rollback()

if __name__ == '__main__':
    add_sample_band()
