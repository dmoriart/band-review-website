#!/usr/bin/env python3
"""
Test database connection directly
"""
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app_bands import create_app
from models_bands_sqlite import db, Band

def test_database():
    """Test database connection directly"""
    app = create_app('development')
    
    with app.app_context():
        print("🔍 Testing database connection...")
        print(f"   Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        
        try:
            # Test database connection
            with db.engine.connect() as conn:
                result = conn.execute(db.text('SELECT name FROM sqlite_master WHERE type="table";'))
                tables = [row[0] for row in result]
                print(f"   Available tables: {tables}")
            
            # Test bands table specifically
            if 'bands' in tables:
                print("   ✅ Bands table exists")
                
                # Test the exact query from the API
                bands = Band.query.filter_by(is_active=True).order_by(Band.name.asc()).limit(20).all()
                print(f"   ✅ Query successful! Found {len(bands)} bands")
                
                for band in bands:
                    print(f"      - {band.name}")
                    
            else:
                print("   ❌ Bands table not found")
                
        except Exception as e:
            print(f"   ❌ Database error: {e}")

if __name__ == '__main__':
    test_database()
