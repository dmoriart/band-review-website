"""
BandVenueReview.ie - Venues API Routes
REST API endpoints for venues
"""

from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import and_, or_, desc, asc, func
from datetime import datetime, date
from models_bands_production import db, Venue, User
from auth_firebase import firebase_auth_optional
import logging

# Create venues blueprint
venues_bp = Blueprint('venues', __name__, url_prefix='/api/venues')

@venues_bp.route('', methods=['GET'])
@firebase_auth_optional
def get_venues():
    """
    Get list of venues with filtering and pagination
    
    Query Parameters:
    - page: Page number (default: 1)
    - per_page: Items per page (default: 20, max: 100)
    - county: Filter by county
    - city: Filter by city
    - venue_type: Filter by venue type
    - capacity_min: Minimum capacity
    - capacity_max: Maximum capacity
    - search: Search term for name or description
    - verified_only: Show only verified venues (true/false)
    """
    try:
        # Pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Build query
        query = Venue.query.filter(Venue.is_active == True)
        
        # Apply filters
        county = request.args.get('county')
        if county:
            query = query.filter(Venue.county.ilike(f'%{county}%'))
        
        city = request.args.get('city')
        if city:
            query = query.filter(Venue.city.ilike(f'%{city}%'))
        
        venue_type = request.args.get('venue_type')
        if venue_type:
            query = query.filter(Venue.venue_type == venue_type)
        
        capacity_min = request.args.get('capacity_min', type=int)
        if capacity_min:
            query = query.filter(Venue.capacity >= capacity_min)
        
        capacity_max = request.args.get('capacity_max', type=int)
        if capacity_max:
            query = query.filter(Venue.capacity <= capacity_max)
        
        search = request.args.get('search')
        if search:
            search_term = f'%{search}%'
            query = query.filter(
                or_(
                    Venue.name.ilike(search_term),
                    Venue.address.ilike(search_term)
                )
            )
        
        verified_only = request.args.get('verified_only', '').lower() == 'true'
        if verified_only:
            query = query.filter(Venue.is_verified == True)
        
        # Apply ordering
        sort_by = request.args.get('sort_by', 'name')
        sort_order = request.args.get('sort_order', 'asc')
        
        if sort_by == 'name':
            order_field = Venue.name
        elif sort_by == 'capacity':
            order_field = Venue.capacity
        elif sort_by == 'created_at':
            order_field = Venue.created_at
        else:
            order_field = Venue.name
        
        if sort_order == 'desc':
            query = query.order_by(desc(order_field))
        else:
            query = query.order_by(asc(order_field))
        
        # Execute paginated query
        venues_pagination = query.paginate(
            page=page, 
            per_page=per_page,
            error_out=False
        )
        
        venues = [venue.to_dict() for venue in venues_pagination.items]
        
        return jsonify({
            'venues': venues,
            'pagination': {
                'current_page': page,
                'per_page': per_page,
                'total_pages': venues_pagination.pages,
                'total_items': venues_pagination.total,
                'has_next': venues_pagination.has_next,
                'has_prev': venues_pagination.has_prev
            },
            'filters_applied': {
                'county': county,
                'city': city,
                'venue_type': venue_type,
                'capacity_min': capacity_min,
                'capacity_max': capacity_max,
                'search': search,
                'verified_only': verified_only
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting venues: {str(e)}")
        return jsonify({'error': 'Failed to fetch venues', 'message': str(e)}), 500

@venues_bp.route('/<int:venue_id>', methods=['GET'])
@firebase_auth_optional
def get_venue(venue_id):
    """Get detailed information about a specific venue"""
    try:
        venue = Venue.query.filter_by(id=venue_id, is_active=True).first()
        
        if not venue:
            return jsonify({'error': 'Venue not found'}), 404
        
        return jsonify({
            'venue': venue.to_dict(include_stats=True)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting venue {venue_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch venue', 'message': str(e)}), 500

@venues_bp.route('/search', methods=['GET'])
@firebase_auth_optional
def search_venues():
    """
    Advanced venue search endpoint
    """
    try:
        query_term = request.args.get('q', '').strip()
        
        if not query_term:
            return jsonify({'venues': [], 'message': 'No search term provided'}), 200
        
        # Search across multiple fields
        search_pattern = f'%{query_term}%'
        venues = Venue.query.filter(
            and_(
                Venue.is_active == True,
                or_(
                    Venue.name.ilike(search_pattern),
                    Venue.address.ilike(search_pattern),
                    Venue.city.ilike(search_pattern),
                    Venue.county.ilike(search_pattern)
                )
            )
        ).order_by(Venue.name).limit(50).all()
        
        return jsonify({
            'venues': [venue.to_dict() for venue in venues],
            'query': query_term,
            'results_count': len(venues)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error searching venues: {str(e)}")
        return jsonify({'error': 'Search failed', 'message': str(e)}), 500

@venues_bp.route('/types', methods=['GET'])
def get_venue_types():
    """Get list of available venue types"""
    venue_types = [
        'live_music_venue',
        'pub',
        'club',
        'concert_hall',
        'festival_site',
        'outdoor_venue',
        'theater',
        'community_center',
        'hotel',
        'restaurant',
        'other'
    ]
    
    return jsonify({
        'venue_types': venue_types
    }), 200

@venues_bp.route('/counties', methods=['GET'])
def get_counties():
    """Get list of counties with venue counts"""
    try:
        counties = db.session.query(
            Venue.county,
            func.count(Venue.id).label('venue_count')
        ).filter(
            and_(
                Venue.is_active == True,
                Venue.county.isnot(None)
            )
        ).group_by(Venue.county).order_by(Venue.county).all()
        
        return jsonify({
            'counties': [
                {
                    'name': county.county,
                    'venue_count': county.venue_count
                } for county in counties
            ]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting counties: {str(e)}")
        return jsonify({'error': 'Failed to fetch counties', 'message': str(e)}), 500

@venues_bp.route('/cities', methods=['GET'])
def get_cities():
    """Get list of cities with venue counts"""
    try:
        cities = db.session.query(
            Venue.city,
            func.count(Venue.id).label('venue_count')
        ).filter(
            and_(
                Venue.is_active == True,
                Venue.city.isnot(None)
            )
        ).group_by(Venue.city).order_by(Venue.city).all()
        
        return jsonify({
            'cities': [
                {
                    'name': city.city,
                    'venue_count': city.venue_count
                } for city in cities
            ]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting cities: {str(e)}")
        return jsonify({'error': 'Failed to fetch cities', 'message': str(e)}), 500
