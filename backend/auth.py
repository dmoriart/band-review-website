"""
BandVenueReview.ie - Authentication Utilities
JWT-based authentication for bands and venue owners
"""

from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from models import User, Band

def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({
                'error': 'Token is invalid or missing',
                'message': str(e)
            }), 401
    return decorated

def band_required(f):
    """Decorator to require band user type"""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user or user.user_type != 'band':
                return jsonify({
                    'error': 'Band account required',
                    'message': 'This endpoint requires a band account'
                }), 403
                
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({
                'error': 'Authentication failed',
                'message': str(e)
            }), 401
    return decorated

def venue_owner_required(f):
    """Decorator to require venue owner user type"""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user or user.user_type != 'venue':
                return jsonify({
                    'error': 'Venue owner account required',
                    'message': 'This endpoint requires a venue owner account'
                }), 403
                
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({
                'error': 'Authentication failed',
                'message': str(e)
            }), 401
    return decorated

def get_current_user():
    """Get current authenticated user"""
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        return User.query.get(user_id)
    except:
        return None

def get_current_band():
    """Get current authenticated band"""
    user = get_current_user()
    if user and user.user_type == 'band':
        return Band.query.filter_by(user_id=user.id).first()
    return None

def validate_user_data(data, required_fields):
    """Validate user registration/update data"""
    errors = []
    
    # Check required fields
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f'{field} is required')
    
    # Validate email format
    if 'email' in data:
        email = data['email'].strip().lower()
        if '@' not in email or '.' not in email:
            errors.append('Invalid email format')
    
    # Validate password strength
    if 'password' in data:
        password = data['password']
        if len(password) < 6:
            errors.append('Password must be at least 6 characters long')
    
    # Validate user type
    if 'user_type' in data:
        if data['user_type'] not in ['band', 'venue']:
            errors.append('User type must be either "band" or "venue"')
    
    return errors

def validate_review_data(data):
    """Validate review submission data"""
    errors = []
    
    required_fields = [
        'venue_id', 'performance_date', 'sound_quality', 'hospitality',
        'payment_promptness', 'crowd_engagement', 'facilities_rating',
        'overall_rating', 'title', 'review_text', 'would_return'
    ]
    
    # Check required fields
    for field in required_fields:
        if field not in data or data[field] is None:
            errors.append(f'{field} is required')
    
    # Validate rating scales (1-5)
    rating_fields = [
        'sound_quality', 'hospitality', 'payment_promptness',
        'crowd_engagement', 'facilities_rating', 'overall_rating'
    ]
    
    for field in rating_fields:
        if field in data:
            try:
                rating = int(data[field])
                if rating < 1 or rating > 5:
                    errors.append(f'{field} must be between 1 and 5')
            except (ValueError, TypeError):
                errors.append(f'{field} must be a valid number')
    
    # Validate text length
    if 'title' in data and len(data['title']) > 200:
        errors.append('Title must be 200 characters or less')
    
    if 'review_text' in data and len(data['review_text']) < 50:
        errors.append('Review text must be at least 50 characters long')
    
    return errors
