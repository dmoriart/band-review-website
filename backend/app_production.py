#!/usr/bin/env python3
"""
Alternative app.py for deployment with SQLite fallback
Use this if Supabase connection issues persist
"""

import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from datetime import datetime
import logging

# Import our modules
from models import db, User, Band, Venue, Review, Genre
from config import config
from auth import auth_bp
from merchandise_api import merchandise_bp, seed_merchandise_data
from models_merchandise import (
    ProductCategory, Product, Cart, CartItem, 
    Order, OrderItem, ProductReview, BandProfile
)

def create_app(config_name=None):
    """Application factory pattern"""
    
    app = Flask(__name__)
    
    # Determine configuration
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # For production deployment, use SQLite if PostgreSQL fails
    if config_name == 'production':
        try:
            # Test PostgreSQL connection
            import psycopg2
            conn = psycopg2.connect(app.config['SQLALCHEMY_DATABASE_URI'], connect_timeout=5)
            conn.close()
            print("✅ Using PostgreSQL database")
        except Exception as e:
            print(f"⚠️  PostgreSQL failed: {e}")
            print("🔄 Falling back to SQLite")
            app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bandvenuereview_prod.db'
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)
    
    # Configure CORS
    CORS(app, origins=app.config['CORS_ORIGINS'])
    
    # Configure logging for production
    if config_name == 'production':
        logging.basicConfig(level=logging.INFO)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(merchandise_bp, url_prefix='/api')
    
    # Health check endpoint
    @app.route('/api/health')
    def health():
        return jsonify({
            "service": "BandVenueReview.ie API",
            "status": "healthy",
            "version": "1.0.0",
            "database": app.config['SQLALCHEMY_DATABASE_URI'].split('://')[0]
        })
    
    # Create all database tables
    with app.app_context():
        try:
            db.create_all()
            
            # Seed database if empty (for new deployments)
            if Venue.query.count() == 0:
                print("🌱 Seeding empty database...")
                seed_database()
                
            # Seed merchandise data if empty
            if ProductCategory.query.count() == 0:
                print("🛍️ Seeding merchandise data...")
                seed_merchandise_data()
                
        except Exception as e:
            print(f"❌ Database setup error: {e}")
    
    return app

def seed_database():
    """Seed database with Irish venues for production"""
    
    # Create genres
    genres_data = [
        "Rock", "Indie", "Folk", "Electronic", "Traditional Irish",
        "Jazz", "Blues", "Metal", "Pop", "Alternative"
    ]
    
    for genre_name in genres_data:
        if not Genre.query.filter_by(name=genre_name).first():
            genre = Genre(name=genre_name)
            db.session.add(genre)
    
    # Create sample venues
    venues_data = [
        {
            "name": "Whelan's",
            "address": "25 Wexford Street",
            "city": "Dublin",
            "county": "Dublin",
            "eircode": "D02 H527",
            "capacity": 300,
            "venue_type": "live_music_venue",
            "description": "Dublin's premier live music venue since 1989.",
            "phone": "+353 1 478 0766",
            "website": "https://www.whelans.com"
        },
        {
            "name": "Cyprus Avenue", 
            "address": "Caroline Street",
            "city": "Cork",
            "county": "Cork",
            "capacity": 200,
            "venue_type": "live_music_venue",
            "description": "Cork's beloved independent music venue.",
            "phone": "+353 21 427 6165",
            "website": "https://www.cyprusavenue.ie"
        }
    ]
    
    for venue_data in venues_data:
        if not Venue.query.filter_by(name=venue_data["name"]).first():
            venue = Venue(**venue_data)
            venue.verified = True
            db.session.add(venue)
    
    try:
        db.session.commit()
        print("✅ Database seeded successfully")
    except Exception as e:
        db.session.rollback()
        print(f"❌ Seeding failed: {e}")

# Create the app
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False
    )
