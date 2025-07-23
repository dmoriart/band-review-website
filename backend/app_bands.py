"""
BandVenueReview.ie - Enhanced Flask Backend API
Complete REST API for the comprehensive bands discovery platform
"""

import os
from datetime import datetime, date
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_migrate import Migrate
from werkzeug.exceptions import BadRequest

# Import our enhanced modules
from config import config
from models_bands import db
from auth_firebase import initialize_firebase
from bands_api import bands_bp

def create_app(config_name=None):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Load configuration
    config_name = config_name or os.environ.get('FLASK_CONFIG', 'development')
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    
    # Initialize Firebase Admin SDK
    with app.app_context():
        initialize_firebase()
    
    # Enable CORS for frontend requests
    CORS(app, origins=app.config.get('CORS_ORIGINS', ['http://localhost:3000']))
    
    # Register blueprints
    app.register_blueprint(bands_bp)
    
    # Global error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad request', 'message': str(error)}), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'error': 'Unauthorized', 'message': 'Authentication required'}), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({'error': 'Forbidden', 'message': 'Insufficient permissions'}), 403
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found', 'message': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error', 'message': 'Something went wrong'}), 500
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        """Health check endpoint for monitoring"""
        try:
            # Test database connection
            db.session.execute('SELECT 1')
            db_status = 'connected'
        except Exception as e:
            db_status = f'error: {str(e)}'
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '2.0.0',
            'database': db_status,
            'features': [
                'bands_discovery',
                'gigs_management', 
                'dual_review_system',
                'firebase_auth',
                'band_followers',
                'venue_reviews_by_bands',
                'setlists',
                'search_and_filtering'
            ]
        }), 200
    
    # API info endpoint
    @app.route('/api/info')
    def api_info():
        """API information and available endpoints"""
        return jsonify({
            'name': 'BandVenueReview.ie API',
            'version': '2.0.0',
            'description': 'Comprehensive REST API for Irish live music discovery platform',
            'documentation': 'See BANDS_API.md for complete documentation',
            'endpoints': {
                'bands': {
                    'GET /api/bands': 'List bands with filtering and pagination',
                    'POST /api/bands': 'Create new band profile (authenticated)',
                    'GET /api/bands/:slug': 'Get detailed band information',
                    'PUT /api/bands/:slug': 'Update band information (band members only)',
                    'POST /api/bands/:slug/follow': 'Follow a band (authenticated)',
                    'DELETE /api/bands/:slug/unfollow': 'Unfollow a band (authenticated)'
                },
                'gigs': {
                    'GET /api/gigs': 'List gigs with filtering and pagination',
                    'POST /api/gigs': 'Create new gig (band members only)'
                },
                'reviews': {
                    'GET /api/reviews/bands': 'List band reviews',
                    'POST /api/reviews/bands': 'Create band review (authenticated)',
                    'GET /api/reviews/venues': 'List venue reviews by bands',
                    'POST /api/reviews/venues': 'Create venue review (band members only)'
                },
                'search': {
                    'GET /api/search': 'Global search across bands, venues, and gigs',
                    'GET /api/stats': 'Platform statistics'
                }
            },
            'authentication': {
                'type': 'Firebase Auth',
                'header': 'Authorization: Bearer <firebase_id_token>',
                'sync': 'Firebase users automatically synced to local database'
            },
            'features': {
                'filtering': 'Genre, location, verification level, date ranges',
                'pagination': 'All list endpoints support page and per_page parameters',
                'sorting': 'Configurable sorting on list endpoints',
                'permissions': 'Role-based access control for band members',
                'dual_reviews': 'Bands review venues, fans review bands',
                'followers': 'Users can follow bands for notifications',
                'search': 'Full-text search across all content types'
            }
        }), 200
    
    return app

# Create Flask app
app = create_app()

if __name__ == '__main__':
    # Only for development - use gunicorn for production
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
        threaded=True
    )
