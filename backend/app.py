"""
BandVenueReview.ie - Flask Backend API
A comprehensive platform for Irish live music venue reviews by bands and artists
"""

import os
from datetime import datetime, date
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, get_jwt_identity
from flask_migrate import Migrate
from werkzeug.exceptions import BadRequest

# Import our modules
from config import config
from models import db, User, Band, Venue, Review, Genre
from auth import token_required, band_required, venue_owner_required, get_current_user, validate_user_data, validate_review_data

def create_app(config_name=None):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Load configuration
    config_name = config_name or os.environ.get('FLASK_CONFIG', 'development')
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)
    
    # Enable CORS for frontend requests
    CORS(app, origins=app.config['CORS_ORIGINS'])
    
    return app

# Create Flask app
app = create_app()

# Sample data for seeding (will be moved to separate file)
SAMPLE_VENUES = [
    {
        "name": "Whelan's",
        "address": "25 Wexford Street",
        "city": "Dublin",
        "county": "Dublin",
        "eircode": "D02 H527",
        "capacity": 300,
        "venue_type": "live_music_venue",
        "primary_genres": ["rock", "indie", "folk"],
        "facilities": ["sound_system", "lighting", "bar", "green_room"],
        "description": "Dublin's premier live music venue since 1989"
    },
    {
        "name": "The Button Factory",
        "address": "Curved Street, Temple Bar",
        "city": "Dublin",
        "county": "Dublin",
        "capacity": 450,
        "venue_type": "club",
        "primary_genres": ["electronic", "indie", "rock"],
        "facilities": ["professional_sound", "lighting", "bar"],
        "description": "Intimate venue in the heart of Temple Bar"
    },
    {
        "name": "Cyprus Avenue",
        "address": "Caroline Street",
        "city": "Cork",
        "county": "Cork",
        "capacity": 200,
        "venue_type": "live_music_venue",
        "primary_genres": ["indie", "folk", "rock"],
        "facilities": ["sound_system", "bar", "parking"],
        "description": "Cork's beloved independent music venue"
    }
]

# API Routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for deployment monitoring"""
    return jsonify({
        "status": "healthy",
        "service": "BandVenueReview.ie API",
        "version": "1.0.0"
    })

# Authentication Routes

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user (band or venue owner)"""
    try:
        data = request.get_json()
        
        # Validate input data
        required_fields = ['email', 'password', 'user_type', 'name']
        errors = validate_user_data(data, required_fields)
        
        if errors:
            return jsonify({'errors': errors}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=data['email'].lower()).first()
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        user = User(
            email=data['email'].lower(),
            user_type=data['user_type'],
            name=data['name'],
            phone=data.get('phone'),
            website=data.get('website'),
            bio=data.get('bio')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Create band profile if user type is band
        if user.user_type == 'band':
            band = Band(
                id=user.id,
                user_id=user.id,
                genre=data.get('genre'),
                location=data.get('location'),
                member_count=data.get('member_count'),
                formation_year=data.get('formation_year')
            )
            db.session.add(band)
            db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Registration failed', 'message': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        # Find user
        user = User.query.filter_by(email=data['email'].lower()).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Create tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        })
        
    except Exception as e:
        return jsonify({'error': 'Login failed', 'message': str(e)}), 500

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user_profile():
    """Get current user profile"""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()})

# Venue Routes

@app.route('/api/venues', methods=['GET'])
def get_venues():
    """Get all venues with optional filtering"""
    try:
        # Query parameters for filtering
        city = request.args.get('city')
        county = request.args.get('county')
        genre = request.args.get('genre')
        min_rating = request.args.get('min_rating', type=float)
        search = request.args.get('search')
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Build query
        query = Venue.query
        
        if city:
            query = query.filter(Venue.city.ilike(f'%{city}%'))
        if county:
            query = query.filter(Venue.county.ilike(f'%{county}%'))
        if min_rating:
            query = query.filter(Venue.average_rating >= min_rating)
        if search:
            query = query.filter(
                (Venue.name.ilike(f'%{search}%')) |
                (Venue.description.ilike(f'%{search}%'))
            )
        
        # Execute query with pagination
        venues = query.order_by(Venue.average_rating.desc()).paginate(
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
        return jsonify({'error': 'Failed to fetch venues', 'message': str(e)}), 500

@app.route('/api/venues/<venue_id>', methods=['GET'])
def get_venue(venue_id):
    """Get specific venue with reviews"""
    try:
        venue = Venue.query.get_or_404(venue_id)
        
        # Get recent reviews
        reviews = Review.query.filter_by(venue_id=venue_id)\
                             .order_by(Review.created_at.desc())\
                             .limit(10).all()
        
        venue_data = venue.to_dict()
        venue_data['recent_reviews'] = [review.to_dict() for review in reviews]
        
        return jsonify(venue_data)
        
    except Exception as e:
        return jsonify({'error': 'Venue not found', 'message': str(e)}), 404

@app.route('/api/venues', methods=['POST'])
@venue_owner_required
def create_venue():
    """Create a new venue (venue owners only)"""
    try:
        data = request.get_json()
        user = get_current_user()
        
        # Create venue
        venue = Venue(
            user_id=user.id,
            name=data['name'],
            address=data['address'],
            city=data['city'],
            county=data['county'],
            eircode=data.get('eircode'),
            phone=data.get('phone'),
            email=data.get('email'),
            website=data.get('website'),
            capacity=data.get('capacity'),
            venue_type=data.get('venue_type'),
            primary_genres=data.get('primary_genres', []),
            facilities=data.get('facilities', []),
            description=data.get('description'),
            claimed=True
        )
        
        db.session.add(venue)
        db.session.commit()
        
        return jsonify({
            'message': 'Venue created successfully',
            'venue': venue.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create venue', 'message': str(e)}), 500

# Review Routes

@app.route('/api/reviews', methods=['POST'])
@band_required
def create_review():
    """Create a new venue review (bands only)"""
    try:
        data = request.get_json()
        user = get_current_user()
        
        # Validate review data
        errors = validate_review_data(data)
        if errors:
            return jsonify({'errors': errors}), 400
        
        # Get band profile
        band = Band.query.filter_by(user_id=user.id).first()
        if not band:
            return jsonify({'error': 'Band profile not found'}), 404
        
        # Check if venue exists
        venue = Venue.query.get(data['venue_id'])
        if not venue:
            return jsonify({'error': 'Venue not found'}), 404
        
        # Check if band already reviewed this venue
        existing_review = Review.query.filter_by(
            band_id=band.id,
            venue_id=data['venue_id']
        ).first()
        
        if existing_review:
            return jsonify({'error': 'You have already reviewed this venue'}), 400
        
        # Create review
        review = Review(
            band_id=band.id,
            venue_id=data['venue_id'],
            performance_date=datetime.strptime(data['performance_date'], '%Y-%m-%d').date(),
            event_name=data.get('event_name'),
            audience_size=data.get('audience_size'),
            sound_quality=data['sound_quality'],
            hospitality=data['hospitality'],
            payment_promptness=data['payment_promptness'],
            crowd_engagement=data['crowd_engagement'],
            facilities_rating=data['facilities_rating'],
            overall_rating=data['overall_rating'],
            title=data['title'],
            review_text=data['review_text'],
            pros=data.get('pros'),
            cons=data.get('cons'),
            would_return=data['would_return'],
            recommended_for=data.get('recommended_for', [])
        )
        
        db.session.add(review)
        
        # Update venue rating
        venue.update_rating()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Review created successfully',
            'review': review.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create review', 'message': str(e)}), 500

@app.route('/api/venues/<venue_id>/reviews', methods=['GET'])
def get_venue_reviews(venue_id):
    """Get all reviews for a venue"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 50)
        
        reviews = Review.query.filter_by(venue_id=venue_id)\
                             .order_by(Review.created_at.desc())\
                             .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'reviews': [review.to_dict() for review in reviews.items],
            'total': reviews.total,
            'pages': reviews.pages,
            'current_page': page
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch reviews', 'message': str(e)}), 500

# Utility Routes

@app.route('/api/seed', methods=['POST'])
def seed_database():
    """Seed database with sample data (development only)"""
    if app.config['ENV'] == 'production':
        return jsonify({'error': 'Seeding not allowed in production'}), 403
    
    try:
        # Create tables
        db.create_all()
        
        # Add sample venues
        for venue_data in SAMPLE_VENUES:
            existing_venue = Venue.query.filter_by(name=venue_data['name']).first()
            if not existing_venue:
                venue = Venue(**venue_data)
                db.session.add(venue)
        
        # Add sample genres
        sample_genres = [
            {'name': 'Rock', 'description': 'Rock music'},
            {'name': 'Folk', 'description': 'Traditional and contemporary folk'},
            {'name': 'Indie', 'description': 'Independent music'},
            {'name': 'Electronic', 'description': 'Electronic and dance music'},
            {'name': 'Traditional', 'description': 'Traditional Irish music'}
        ]
        
        for genre_data in sample_genres:
            existing_genre = Genre.query.filter_by(name=genre_data['name']).first()
            if not existing_genre:
                genre = Genre(**genre_data)
                db.session.add(genre)
        
        db.session.commit()
        
        return jsonify({'message': 'Database seeded successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to seed database', 'message': str(e)}), 500

@app.route('/api/counties', methods=['GET'])
def get_irish_counties():
    """Get list of Irish counties"""
    return jsonify({'counties': app.config['IRISH_COUNTIES']})

# Error handlers
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        "error": "Endpoint not found",
        "status": "error"
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    db.session.rollback()
    return jsonify({
        "error": "Internal server error",
        "status": "error"
    }), 500

if __name__ == '__main__':
    # Run the Flask development server
    print("� Starting BandVenueReview.ie API server...")
    print("📍 Server running at: http://localhost:5000")
    print("🔗 Test endpoint: http://localhost:5000/api/health")
    
    # Get port from environment variable for flexibility
    port = int(os.environ.get('PORT', 5000))
    
    # Create tables if they don't exist
    with app.app_context():
        db.create_all()
    
    app.run(
        host='0.0.0.0',  # Allow external connections
        port=port,       # Use environment PORT or default to 5000
        debug=False if os.environ.get('FLASK_ENV') == 'production' else app.config['DEBUG']
    )
