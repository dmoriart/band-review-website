"""
Production database initialization script
This script initializes the database with production-compatible models
"""
import os
import sys
from datetime import datetime

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from models_bands_production import db, Band, User, Venue

def create_app():
    """Create Flask app for database initialization"""
    app = Flask(__name__)
    
    # Get database URL from environment
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        # Fix for Heroku/Render PostgreSQL URLs
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    else:
        # Fallback to SQLite for local development
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bandvenuereview_prod.db'
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }
    
    db.init_app(app)
    return app

def init_database():
    """Initialize the database with tables"""
    app = create_app()
    
    with app.app_context():
        try:
            print("Creating database tables...")
            db.create_all()
            print("Database tables created successfully!")
            
            # Add a test band to verify everything works
            test_band = Band.query.filter_by(slug='test-band-production').first()
            if not test_band:
                test_band = Band(
                    name='Test Band Production',
                    slug='test-band-production',
                    bio='Test band for production deployment verification',
                    formed_year=2024,
                    hometown='Dublin',
                    county='Dublin',
                    country='Ireland',
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                # Set genres using the helper method
                test_band.set_genres(['Rock', 'Alternative'])
                test_band.set_social_links({
                    'website': 'https://testband.ie',
                    'facebook': 'https://facebook.com/testband'
                })
                
                db.session.add(test_band)
                db.session.commit()
                print(f"Test band created: {test_band.name} (ID: {test_band.id})")
            else:
                print(f"Test band already exists: {test_band.name} (ID: {test_band.id})")
                
            # Verify database connection by counting bands
            band_count = Band.query.count()
            print(f"Total bands in database: {band_count}")
            
            return True
            
        except Exception as e:
            print(f"Error initializing database: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == '__main__':
    print("Initializing production database...")
    if init_database():
        print("Database initialization completed successfully!")
    else:
        print("Database initialization failed!")
        sys.exit(1)
