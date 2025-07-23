"""
BandVenueReview.ie - Firebase Authentication Integration
Handles Firebase token verification and user synchronization
"""

import firebase_admin
from firebase_admin import credentials, auth
from functools import wraps
from flask import request, jsonify, current_app
from models_bands import db, User
import os

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK with service account"""
    try:
        # Check if Firebase is already initialized
        firebase_admin.get_app()
    except ValueError:
        # Initialize Firebase with service account key
        if os.environ.get('FIREBASE_SERVICE_ACCOUNT_KEY'):
            # Production: Use service account key from environment
            import json
            service_account_info = json.loads(os.environ.get('FIREBASE_SERVICE_ACCOUNT_KEY'))
            cred = credentials.Certificate(service_account_info)
        else:
            # Development: Use service account key file
            service_account_path = os.environ.get('FIREBASE_SERVICE_ACCOUNT_PATH', 'firebase-service-account.json')
            if os.path.exists(service_account_path):
                cred = credentials.Certificate(service_account_path)
            else:
                current_app.logger.warning("Firebase service account not found. Firebase features will be disabled.")
                return False
        
        firebase_admin.initialize_app(cred)
        current_app.logger.info("Firebase Admin SDK initialized successfully")
        return True

def verify_firebase_token(token):
    """Verify Firebase ID token and return user info"""
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        current_app.logger.error(f"Firebase token verification failed: {str(e)}")
        return None

def sync_firebase_user(firebase_user_data):
    """Sync Firebase user with local database"""
    try:
        firebase_uid = firebase_user_data.get('uid')
        email = firebase_user_data.get('email')
        display_name = firebase_user_data.get('name', firebase_user_data.get('display_name'))
        photo_url = firebase_user_data.get('picture', firebase_user_data.get('photo_url'))
        
        # Check if user already exists
        user = User.query.filter_by(firebase_uid=firebase_uid).first()
        
        if user:
            # Update existing user
            user.email = email
            user.display_name = display_name
            user.photo_url = photo_url
        else:
            # Create new user
            user = User(
                firebase_uid=firebase_uid,
                email=email,
                display_name=display_name,
                photo_url=photo_url,
                user_type='fan'  # Default type, can be changed later
            )
            db.session.add(user)
        
        db.session.commit()
        return user
        
    except Exception as e:
        current_app.logger.error(f"User sync failed: {str(e)}")
        db.session.rollback()
        return None

def firebase_auth_required(f):
    """Decorator to require Firebase authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization header required'}), 401
        
        token = auth_header.split(' ')[1]
        
        # Verify token
        firebase_user = verify_firebase_token(token)
        if not firebase_user:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Sync user with database
        user = sync_firebase_user(firebase_user)
        if not user:
            return jsonify({'error': 'User synchronization failed'}), 500
        
        # Add user to request context
        request.current_user = user
        request.firebase_user = firebase_user
        
        return f(*args, **kwargs)
    
    return decorated_function

def firebase_auth_optional(f):
    """Decorator for optional Firebase authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        request.current_user = None
        request.firebase_user = None
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            firebase_user = verify_firebase_token(token)
            
            if firebase_user:
                user = sync_firebase_user(firebase_user)
                if user:
                    request.current_user = user
                    request.firebase_user = firebase_user
        
        return f(*args, **kwargs)
    
    return decorated_function

def band_member_required(f):
    """Decorator to require user to be a band member"""
    @wraps(f)
    @firebase_auth_required
    def decorated_function(*args, **kwargs):
        user = request.current_user
        
        # Check if user is associated with any bands
        if not user.band_memberships:
            return jsonify({'error': 'Band membership required'}), 403
        
        return f(*args, **kwargs)
    
    return decorated_function

def band_access_required(band_id_param='band_id'):
    """Decorator to require user to have access to specific band"""
    def decorator(f):
        @wraps(f)
        @firebase_auth_required
        def decorated_function(*args, **kwargs):
            user = request.current_user
            
            # Get band_id from URL parameters or request body
            band_id = kwargs.get(band_id_param) or request.json.get(band_id_param)
            if not band_id:
                return jsonify({'error': 'Band ID required'}), 400
            
            # Check if user is a member of this band
            from models_bands import BandMember
            membership = BandMember.query.filter_by(
                band_id=band_id,
                user_id=user.id,
                is_active=True
            ).first()
            
            if not membership:
                return jsonify({'error': 'Access denied: Not a member of this band'}), 403
            
            request.band_membership = membership
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def get_current_user():
    """Get current user from request context"""
    return getattr(request, 'current_user', None)

def get_firebase_user():
    """Get Firebase user data from request context"""
    return getattr(request, 'firebase_user', None)

# Validation functions
def validate_band_data(data):
    """Validate band creation/update data"""
    required_fields = ['name', 'genres']
    errors = []
    
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f'{field} is required')
    
    # Validate genres
    if 'genres' in data:
        if not isinstance(data['genres'], list) or len(data['genres']) == 0:
            errors.append('At least one genre is required')
    
    # Validate formed_year
    if 'formed_year' in data and data['formed_year']:
        try:
            year = int(data['formed_year'])
            if year < 1900 or year > 2030:
                errors.append('Formed year must be between 1900 and 2030')
        except (ValueError, TypeError):
            errors.append('Formed year must be a valid year')
    
    # Validate member_count
    if 'member_count' in data and data['member_count']:
        try:
            count = int(data['member_count'])
            if count < 1:
                errors.append('Member count must be at least 1')
        except (ValueError, TypeError):
            errors.append('Member count must be a valid number')
    
    # Validate email format
    if 'contact_email' in data and data['contact_email']:
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['contact_email']):
            errors.append('Invalid email format')
    
    # Validate URLs
    url_fields = ['website']
    for field in url_fields:
        if field in data and data[field]:
            if not data[field].startswith(('http://', 'https://')):
                errors.append(f'{field} must be a valid URL starting with http:// or https://')
    
    return errors

def validate_gig_data(data):
    """Validate gig creation/update data"""
    required_fields = ['band_id', 'venue_id', 'gig_date']
    errors = []
    
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f'{field} is required')
    
    # Validate date format
    if 'gig_date' in data and data['gig_date']:
        try:
            from datetime import datetime
            datetime.fromisoformat(data['gig_date'].replace('Z', '+00:00'))
        except ValueError:
            errors.append('Invalid date format. Use ISO format (YYYY-MM-DD)')
    
    # Validate price
    if 'door_price' in data and data['door_price']:
        try:
            price = float(data['door_price'])
            if price < 0:
                errors.append('Door price cannot be negative')
        except (ValueError, TypeError):
            errors.append('Door price must be a valid number')
    
    # Validate status
    valid_statuses = ['scheduled', 'confirmed', 'cancelled', 'completed']
    if 'status' in data and data['status']:
        if data['status'] not in valid_statuses:
            errors.append(f'Status must be one of: {", ".join(valid_statuses)}')
    
    return errors

def validate_review_data(data):
    """Validate review creation/update data"""
    required_fields = ['rating', 'review_text']
    errors = []
    
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f'{field} is required')
    
    # Validate rating
    if 'rating' in data:
        try:
            rating = int(data['rating'])
            if rating < 1 or rating > 5:
                errors.append('Rating must be between 1 and 5')
        except (ValueError, TypeError):
            errors.append('Rating must be a valid number')
    
    # Validate sub-ratings
    rating_fields = ['sound_quality_rating', 'staff_rating', 'payment_promptness_rating', 
                     'crowd_response_rating', 'performance_rating', 'stage_presence_rating', 
                     'song_variety_rating']
    
    for field in rating_fields:
        if field in data and data[field] is not None:
            try:
                rating = int(data[field])
                if rating < 1 or rating > 5:
                    errors.append(f'{field} must be between 1 and 5')
            except (ValueError, TypeError):
                errors.append(f'{field} must be a valid number')
    
    # Validate review text length
    if 'review_text' in data and data['review_text']:
        if len(data['review_text']) < 10:
            errors.append('Review text must be at least 10 characters long')
        if len(data['review_text']) > 5000:
            errors.append('Review text cannot exceed 5000 characters')
    
    return errors
