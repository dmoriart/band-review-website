#!/usr/bin/env python3
"""
Production app without auth blueprint dependency
Simplified version for reliable deployment
"""

import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from datetime import datetime
import logging

# Import our modules
from models import db, User, Band, Venue, Review, Genre
from config import config
from auth import admin_required

def create_app(config_name=None):
    """Application factory pattern"""
    
    app = Flask(__name__)
    
    # Determine configuration
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    print(f"🚀 Starting BandVenueReview.ie API ({config_name} mode)")
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # For production, try PostgreSQL first, fallback to SQLite
    if config_name == 'production':
        original_db_url = app.config['SQLALCHEMY_DATABASE_URI']
        
        if original_db_url and 'postgresql' in original_db_url:
            try:
                # Test PostgreSQL connection
                import psycopg2
                conn = psycopg2.connect(original_db_url, connect_timeout=10)
                conn.close()
                print("✅ Using PostgreSQL database")
            except Exception as e:
                print(f"⚠️  PostgreSQL failed: {str(e)[:100]}...")
                print("🔄 Falling back to SQLite")
                app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bandvenuereview_prod.db'
        else:
            print("🗄️  Using SQLite database")
            app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bandvenuereview_prod.db'
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)
    
    # Configure CORS - temporarily allow all origins for debugging
    CORS(app, origins='*', supports_credentials=False)
    
    # Configure logging for production
    if config_name == 'production':
        logging.basicConfig(level=logging.INFO)
    
    # Add all API routes
    setup_api_routes(app)
    
    # Initialize database within app context
    with app.app_context():
        try:
            print("🗄️  Creating database tables...")
            db.create_all()
            
            # Check if we need to seed the database
            venue_count = Venue.query.count()
            print(f"📊 Found {venue_count} venues in database")
            
            if venue_count == 0:
                print("🌱 Seeding empty database...")
                seed_database()
                print("✅ Database seeded successfully")
            else:
                print("✅ Database already populated")
                
        except Exception as e:
            print(f"❌ Database setup error: {e}")
            import traceback
            traceback.print_exc()
    
    return app

def setup_api_routes(app):
    """Set up all API routes"""
    
    @app.route('/api/health')
    def health():
        """Health check endpoint"""
        try:
            # Quick database connectivity test
            venue_count = Venue.query.count()
            return jsonify({
                "service": "BandVenueReview.ie API",
                "status": "healthy",
                "version": "1.0.0",
                "database": app.config['SQLALCHEMY_DATABASE_URI'].split('://')[0],
                "venues": venue_count,
                "cors_enabled": True,
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({
                "service": "BandVenueReview.ie API", 
                "status": "unhealthy",
                "error": str(e)
            }), 500
    
    @app.route('/api/debug')
    def debug():
        """Debug endpoint to help troubleshoot frontend issues"""
        return jsonify({
            "message": "API is working correctly",
            "cors": "enabled",
            "endpoints": [
                "/api/health",
                "/api/venues", 
                "/api/genres",
                "/api/venues/<id>"
            ],
            "frontend_should_use": "https://band-review-website.onrender.com/api"
        })
    
    @app.route('/api/venues')
    def get_venues():
        """Get all venues with pagination"""
        try:
            page = request.args.get('page', 1, type=int)
            per_page = min(request.args.get('per_page', 20, type=int), 100)
            
            venues_query = Venue.query.order_by(Venue.average_rating.desc())
            venues_paginated = venues_query.paginate(
                page=page, per_page=per_page, error_out=False
            )
            
            venues_data = []
            for venue in venues_paginated.items:
                venue_dict = {
                    'id': str(venue.id),
                    'name': venue.name,
                    'address': venue.address,
                    'city': venue.city,
                    'county': venue.county,
                    'eircode': venue.eircode,
                    'phone': venue.phone,
                    'email': venue.email,
                    'website': venue.website,
                    'capacity': venue.capacity,
                    'venue_type': venue.venue_type,
                    'primary_genres': venue.primary_genres,
                    'facilities': venue.facilities,
                    'description': venue.description,
                    'images': venue.images,
                    'claimed': venue.claimed,
                    'verified': venue.verified,
                    'average_rating': float(venue.average_rating) if venue.average_rating else 0.0,
                    'review_count': venue.review_count,
                    'created_at': venue.created_at.isoformat() if venue.created_at else None
                }
                venues_data.append(venue_dict)
            
            return jsonify({
                'venues': venues_data,
                'total': venues_paginated.total,
                'pages': venues_paginated.pages,
                'current_page': page,
                'per_page': per_page
            })
            
        except Exception as e:
            return jsonify({
                'error': 'Failed to fetch venues',
                'message': str(e)
            }), 500
    
    @app.route('/api/genres')
    def get_genres():
        """Get all genres"""
        try:
            genres = Genre.query.all()
            genres_data = []
            for genre in genres:
                genres_data.append({
                    'id': str(genre.id),
                    'name': genre.name,
                    'description': genre.description
                })
            
            return jsonify({
                'genres': genres_data,
                'count': len(genres_data)
            })
            
        except Exception as e:
            return jsonify({
                'error': 'Failed to fetch genres',
                'message': str(e)
            }), 500

    @app.route('/api/venues/<venue_id>')
    def get_venue(venue_id):
        """Get a specific venue by ID"""
        try:
            venue = Venue.query.get_or_404(venue_id)
            
            venue_dict = {
                'id': str(venue.id),
                'name': venue.name,
                'address': venue.address,
                'city': venue.city,
                'county': venue.county,
                'eircode': venue.eircode,
                'phone': venue.phone,
                'email': venue.email,
                'website': venue.website,
                'capacity': venue.capacity,
                'venue_type': venue.venue_type,
                'primary_genres': venue.primary_genres,
                'facilities': venue.facilities,
                'description': venue.description,
                'images': venue.images,
                'claimed': venue.claimed,
                'verified': venue.verified,
                'average_rating': float(venue.average_rating) if venue.average_rating else 0.0,
                'review_count': venue.review_count,
                'created_at': venue.created_at.isoformat() if venue.created_at else None
            }
            
            return jsonify(venue_dict)
            
        except Exception as e:
            return jsonify({
                'error': 'Venue not found',
                'message': str(e)
            }), 404

    # Admin endpoints
    @app.route('/api/admin/stats', methods=['GET'])
    @admin_required
    def admin_stats():
        """Get admin dashboard statistics"""
        try:
            stats = {
                'total_venues': Venue.query.count(),
                'total_users': User.query.count(),
                'total_bands': Band.query.count(),
                'total_reviews': Review.query.count(),
                'verified_venues': Venue.query.filter_by(verified=True).count(),
                'unverified_venues': Venue.query.filter_by(verified=False).count(),
                'verified_users': User.query.filter_by(verified=True).count(),
                'unverified_users': User.query.filter_by(verified=False).count(),
                'recent_venues': Venue.query.order_by(Venue.created_at.desc()).limit(5).all(),
                'recent_users': User.query.order_by(User.created_at.desc()).limit(5).all(),
                'recent_reviews': Review.query.order_by(Review.created_at.desc()).limit(5).all()
            }
            
            # Convert objects to dictionaries
            stats['recent_venues'] = [venue.to_dict() for venue in stats['recent_venues']]
            stats['recent_users'] = [user.to_dict() for user in stats['recent_users']]
            stats['recent_reviews'] = [review.to_dict() for review in stats['recent_reviews']]
            
            return jsonify(stats)
        except Exception as e:
            return jsonify({'error': 'Failed to get admin stats', 'message': str(e)}), 500

    @app.route('/api/admin/venues', methods=['GET'])
    @admin_required
    def admin_venues():
        """Get all venues for admin management"""
        try:
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 50, type=int)
            search = request.args.get('search', '')
            status = request.args.get('status', 'all')  # all, verified, unverified
            
            query = Venue.query
            
            # Apply search filter
            if search:
                query = query.filter(
                    Venue.name.ilike(f'%{search}%') | 
                    Venue.city.ilike(f'%{search}%') | 
                    Venue.county.ilike(f'%{search}%')
                )
            
            # Apply status filter
            if status == 'verified':
                query = query.filter_by(verified=True)
            elif status == 'unverified':
                query = query.filter_by(verified=False)
            
            # Paginate results
            venues = query.order_by(Venue.created_at.desc()).paginate(
                page=page, per_page=per_page, error_out=False
            )
            
            return jsonify({
                'venues': [venue.to_dict() for venue in venues.items],
                'total': venues.total,
                'pages': venues.pages,
                'current_page': page,
                'per_page': per_page
            })
        except Exception as e:
            return jsonify({'error': 'Failed to get venues', 'message': str(e)}), 500

    @app.route('/api/admin/venues/<venue_id>', methods=['PUT'])
    @admin_required
    def admin_update_venue(venue_id):
        """Update venue details (admin only)"""
        try:
            venue = Venue.query.get(venue_id)
            if not venue:
                return jsonify({'error': 'Venue not found'}), 404
            
            data = request.get_json()
            
            # Update allowed fields
            updatable_fields = [
                'name', 'address', 'city', 'county', 'eircode', 'phone', 'website',
                'capacity', 'venue_type', 'description', 'verified', 'claimed'
            ]
            
            for field in updatable_fields:
                if field in data:
                    setattr(venue, field, data[field])
            
            venue.updated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'message': 'Venue updated successfully',
                'venue': venue.to_dict()
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to update venue', 'message': str(e)}), 500

    @app.route('/api/admin/venues/<venue_id>', methods=['DELETE'])
    @admin_required
    def admin_delete_venue(venue_id):
        """Delete venue (admin only)"""
        try:
            venue = Venue.query.get(venue_id)
            if not venue:
                return jsonify({'error': 'Venue not found'}), 404
            
            # Delete associated reviews first
            Review.query.filter_by(venue_id=venue_id).delete()
            
            # Delete the venue
            db.session.delete(venue)
            db.session.commit()
            
            return jsonify({'message': 'Venue deleted successfully'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to delete venue', 'message': str(e)}), 500

    @app.route('/api/admin/users', methods=['GET'])
    @admin_required
    def admin_users():
        """Get all users for admin management"""
        try:
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 50, type=int)
            search = request.args.get('search', '')
            user_type = request.args.get('user_type', 'all')  # all, band, venue
            status = request.args.get('status', 'all')  # all, verified, unverified
            
            query = User.query
            
            # Apply search filter
            if search:
                query = query.filter(
                    User.name.ilike(f'%{search}%') | 
                    User.email.ilike(f'%{search}%')
                )
            
            # Apply user type filter
            if user_type in ['band', 'venue']:
                query = query.filter_by(user_type=user_type)
            
            # Apply status filter
            if status == 'verified':
                query = query.filter_by(verified=True)
            elif status == 'unverified':
                query = query.filter_by(verified=False)
            
            # Paginate results
            users = query.order_by(User.created_at.desc()).paginate(
                page=page, per_page=per_page, error_out=False
            )
            
            return jsonify({
                'users': [user.to_dict() for user in users.items],
                'total': users.total,
                'pages': users.pages,
                'current_page': page,
                'per_page': per_page
            })
        except Exception as e:
            return jsonify({'error': 'Failed to get users', 'message': str(e)}), 500

    @app.route('/api/admin/users/<user_id>', methods=['PUT'])
    @admin_required
    def admin_update_user(user_id):
        """Update user details (admin only)"""
        try:
            user = User.query.get(user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            data = request.get_json()
            
            # Update allowed fields
            updatable_fields = ['name', 'email', 'phone', 'website', 'bio', 'verified']
            
            for field in updatable_fields:
                if field in data:
                    setattr(user, field, data[field])
            
            user.updated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'message': 'User updated successfully',
                'user': user.to_dict()
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to update user', 'message': str(e)}), 500

    @app.route('/api/admin/reviews', methods=['GET'])
    @admin_required
    def admin_reviews():
        """Get all reviews for admin management"""
        try:
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 50, type=int)
            venue_id = request.args.get('venue_id', '')
            
            query = Review.query
            
            # Filter by venue if specified
            if venue_id:
                query = query.filter_by(venue_id=venue_id)
            
            # Paginate results
            reviews = query.order_by(Review.created_at.desc()).paginate(
                page=page, per_page=per_page, error_out=False
            )
            
            return jsonify({
                'reviews': [review.to_dict() for review in reviews.items],
                'total': reviews.total,
                'pages': reviews.pages,
                'current_page': page,
                'per_page': per_page
            })
        except Exception as e:
            return jsonify({'error': 'Failed to get reviews', 'message': str(e)}), 500

    @app.route('/api/admin/reviews/<review_id>', methods=['DELETE'])
    @admin_required
    def admin_delete_review(review_id):
        """Delete review (admin only)"""
        try:
            review = Review.query.get(review_id)
            if not review:
                return jsonify({'error': 'Review not found'}), 404
            
            db.session.delete(review)
            db.session.commit()
            
            return jsonify({'message': 'Review deleted successfully'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to delete review', 'message': str(e)}), 500

    # Simple login endpoint for admin access
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        """Simple login for admin access"""
        try:
            data = request.get_json()
            
            if not data.get('email') or not data.get('password'):
                return jsonify({'error': 'Email and password required'}), 400
            
            email = data['email'].lower()
            password = data['password']
            
            # Simple admin check (in production, use proper authentication)
            if email == 'admin@bandvenuereview.ie' and password == 'admin123':
                # Create a simple mock user object
                user_data = {
                    'id': 'admin-user-id',
                    'email': email,
                    'user_type': 'admin',
                    'name': 'Admin User',
                    'verified': True
                }
                
                # Create a simple token (in production, use JWT)
                access_token = 'admin-token-' + str(hash(email + password))
                
                return jsonify({
                    'message': 'Login successful',
                    'user': user_data,
                    'access_token': access_token
                })
            else:
                return jsonify({'error': 'Invalid email or password'}), 401
                
        except Exception as e:
            return jsonify({'error': 'Login failed', 'message': str(e)}), 500

def seed_database():
    """Seed database with Irish venues for production"""
    
    try:
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
                "description": "Dublin's premier live music venue since 1989. Known for discovering new talent and hosting intimate gigs.",
                "phone": "+353 1 478 0766",
                "website": "https://www.whelans.com",
                "verified": True,
                "primary_genres": ["rock", "indie", "folk"],
                "facilities": ["professional_sound", "lighting", "bar", "green_room"]
            },
            {
                "name": "Cyprus Avenue",
                "address": "Caroline Street", 
                "city": "Cork",
                "county": "Cork",
                "capacity": 200,
                "venue_type": "live_music_venue",
                "description": "Cork's beloved independent music venue supporting local and touring artists.",
                "phone": "+353 21 427 6165",
                "website": "https://www.cyprusavenue.ie",
                "verified": True,
                "primary_genres": ["indie", "folk", "rock"],
                "facilities": ["sound_system", "bar", "parking"]
            },
            {
                "name": "The Button Factory",
                "address": "Curved Street, Temple Bar",
                "city": "Dublin", 
                "county": "Dublin",
                "eircode": "D02 HN24",
                "capacity": 450,
                "venue_type": "club",
                "description": "Intimate venue in the heart of Temple Bar, perfect for both emerging and established acts.",
                "phone": "+353 1 670 9202",
                "verified": True,
                "primary_genres": ["electronic", "indie", "rock"],
                "facilities": ["professional_sound", "lighting", "bar", "late_license"]
            },
            {
                "name": "Monroe's Tavern",
                "address": "Dominick Street Upper",
                "city": "Galway",
                "county": "Galway", 
                "capacity": 150,
                "venue_type": "pub",
                "description": "Historic Galway pub hosting traditional sessions and contemporary acts.",
                "phone": "+353 91 583 397",
                "verified": True,
                "primary_genres": ["traditional", "folk", "rock"],
                "facilities": ["sound_system", "bar", "traditional_session_space"]
            },
            {
                "name": "The Workman's Club",
                "address": "10 Wellington Quay",
                "city": "Dublin",
                "county": "Dublin",
                "eircode": "D02 XH91",
                "capacity": 180,
                "venue_type": "club",
                "description": "Multi-level venue with different spaces for intimate gigs and club nights.",
                "phone": "+353 1 670 6692",
                "website": "https://www.theworkmansclub.com",
                "verified": True,
                "primary_genres": ["indie", "electronic", "alternative"],
                "facilities": ["professional_sound", "lighting", "bar", "late_license", "roof_terrace"]
            }
        ]
        
        for venue_data in venues_data:
            if not Venue.query.filter_by(name=venue_data["name"]).first():
                venue = Venue(**venue_data)
                db.session.add(venue)
        
        db.session.commit()
        print(f"✅ Seeded {len(genres_data)} genres and {len(venues_data)} venues")
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Seeding failed: {e}")
        raise

# Create the app
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🌐 Starting server on port {port}")
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False
    )

# Create the app
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🌐 Starting server on port {port}")
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False
    )
