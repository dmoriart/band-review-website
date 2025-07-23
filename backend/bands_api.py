"""
BandVenueReview.ie - Bands API Routes
REST API endpoints for the comprehensive bands system
"""

from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import and_, or_, desc, asc, func
from sqlalchemy.orm import joinedload
from datetime import datetime, date, timedelta
from models_bands_sqlite import (
    db, User, Band, Venue, Gig, BandMember, BandReview, 
    VenueReviewByBand, BandFollower, Setlist, GigSupportingBand, ReviewVote
)
from auth_firebase import (
    firebase_auth_required, firebase_auth_optional, band_member_required,
    band_access_required, get_current_user, validate_band_data, 
    validate_gig_data, validate_review_data
)
import uuid

# Create Blueprint
bands_bp = Blueprint('bands', __name__, url_prefix='/api')

# Utility functions
def paginate_query(query, page=1, per_page=20, max_per_page=100):
    """Helper function to paginate queries"""
    per_page = min(per_page, max_per_page)
    pagination = query.paginate(
        page=page, 
        per_page=per_page, 
        error_out=False
    )
    return pagination

def build_band_filters(args):
    """Build SQLAlchemy filters from query parameters"""
    filters = []
    
    # Genre filter
    if args.get('genres'):
        genre_list = args.get('genres').split(',')
        filters.append(Band.genres.overlap(genre_list))
    
    # Location filters
    if args.get('county'):
        filters.append(Band.county.ilike(f"%{args.get('county')}%"))
    
    if args.get('hometown'):
        filters.append(Band.hometown.ilike(f"%{args.get('hometown')}%"))
    
    # Verification filter
    if args.get('verification_level'):
        levels = args.get('verification_level').split(',')
        filters.append(Band.verification_level.in_(levels))
    
    # Active bands only
    if args.get('active_only', 'false').lower() == 'true':
        filters.append(Band.is_active == True)
    
    # Search query
    if args.get('search'):
        search_term = f"%{args.get('search')}%"
        filters.append(or_(
            Band.name.ilike(search_term),
            Band.bio.ilike(search_term),
            Band.hometown.ilike(search_term)
        ))
    
    return filters

# ============================================================================
# BANDS ENDPOINTS
# ============================================================================

@bands_bp.route('/bands', methods=['GET'])
@firebase_auth_optional
def list_bands():
    """
    GET /api/bands
    List bands with filtering, searching, and pagination
    """
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        sort_by = request.args.get('sort_by', 'name')
        sort_order = request.args.get('sort_order', 'asc')
        
        # Build base query
        query = Band.query.filter(Band.is_active == True)
        
        # Apply filters
        filters = build_band_filters(request.args)
        if filters:
            query = query.filter(and_(*filters))
        
        # Apply sorting
        sort_column = getattr(Band, sort_by, Band.name)
        if sort_order.lower() == 'desc':
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        # Paginate results
        pagination = paginate_query(query, page, per_page)
        
        # Serialize results
        bands = []
        for band in pagination.items:
            band_data = band.to_dict(include_stats=True)
            
            # Add upcoming gigs preview
            upcoming_gigs = Gig.query.filter(
                and_(
                    Gig.band_id == band.id,
                    Gig.gig_date >= date.today(),
                    Gig.status.in_(['scheduled', 'confirmed'])
                )
            ).order_by(Gig.gig_date).limit(3).all()
            
            band_data['upcoming_gigs'] = [gig.to_dict(include_venue=True, include_band=False) for gig in upcoming_gigs]
            bands.append(band_data)
        
        return jsonify({
            'bands': bands,
            'pagination': {
                'page': pagination.page,
                'pages': pagination.pages,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error listing bands: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bands_bp.route('/bands/<slug>', methods=['GET'])
@firebase_auth_optional
def get_band(slug):
    """
    GET /api/bands/:slug
    Get detailed band information
    """
    try:
        # Find band by slug
        band = Band.query.filter_by(slug=slug, is_active=True).first()
        if not band:
            return jsonify({'error': 'Band not found'}), 404
        
        # Get detailed band info
        band_data = band.to_dict(include_stats=True, include_members=True)
        
        # Get upcoming gigs
        upcoming_gigs = Gig.query.filter(
            and_(
                Gig.band_id == band.id,
                Gig.gig_date >= date.today(),
                Gig.status.in_(['scheduled', 'confirmed']),
                Gig.is_public == True
            )
        ).order_by(Gig.gig_date).limit(10).all()
        
        band_data['upcoming_gigs'] = [
            gig.to_dict(include_venue=True, include_band=False) 
            for gig in upcoming_gigs
        ]
        
        # Get recent reviews
        recent_reviews = BandReview.query.filter(
            and_(
                BandReview.band_id == band.id,
                BandReview.is_published == True
            )
        ).order_by(desc(BandReview.created_at)).limit(5).all()
        
        band_data['recent_reviews'] = [
            review.to_dict(include_reviewer=True, include_band=False) 
            for review in recent_reviews
        ]
        
        # Get venue reviews written by this band
        venue_reviews = VenueReviewByBand.query.filter(
            and_(
                VenueReviewByBand.band_id == band.id,
                VenueReviewByBand.is_published == True
            )
        ).order_by(desc(VenueReviewByBand.created_at)).limit(5).all()
        
        band_data['venue_reviews'] = [
            review.to_dict(include_band=False, include_venue=True) 
            for review in venue_reviews
        ]
        
        # Check if current user follows this band
        current_user = get_current_user()
        if current_user:
            follow = BandFollower.query.filter_by(
                band_id=band.id,
                follower_id=current_user.id
            ).first()
            band_data['is_followed_by_user'] = follow is not None
        else:
            band_data['is_followed_by_user'] = False
        
        return jsonify(band_data), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting band {slug}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bands_bp.route('/bands', methods=['POST'])
@firebase_auth_required
def create_band():
    """
    POST /api/bands
    Create a new band profile
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'JSON data required'}), 400
        
        # Validate data
        errors = validate_band_data(data)
        if errors:
            return jsonify({'errors': errors}), 400
        
        current_user = get_current_user()
        
        # Generate unique slug
        base_slug = Band.generate_slug(data['name'])
        slug = base_slug
        counter = 1
        while Band.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        # Create band
        band = Band(
            id=uuid.uuid4(),
            name=data['name'],
            slug=slug,
            bio=data.get('bio'),
            formed_year=data.get('formed_year'),
            genres=data['genres'],
            hometown=data.get('hometown'),
            county=data.get('county'),
            country=data.get('country', 'Ireland'),
            member_count=data.get('member_count'),
            contact_email=data.get('contact_email'),
            contact_phone=data.get('contact_phone'),
            website=data.get('website'),
            social_links=data.get('social_links'),
            profile_image_url=data.get('profile_image_url'),
            banner_image_url=data.get('banner_image_url'),
            created_by=current_user.id
        )
        
        db.session.add(band)
        
        # Add creator as primary contact member
        member = BandMember(
            band_id=band.id,
            user_id=current_user.id,
            role=data.get('creator_role', 'Band Member'),
            is_primary_contact=True
        )
        
        db.session.add(member)
        db.session.commit()
        
        return jsonify({
            'message': 'Band created successfully',
            'band': band.to_dict(include_stats=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating band: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bands_bp.route('/bands/<slug>', methods=['PUT'])
@band_access_required(band_id_param='slug')
def update_band(slug):
    """
    PUT /api/bands/:slug
    Update band information (band members only)
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'JSON data required'}), 400
        
        # Find band
        band = Band.query.filter_by(slug=slug, is_active=True).first()
        if not band:
            return jsonify({'error': 'Band not found'}), 404
        
        # Validate data
        errors = validate_band_data(data)
        if errors:
            return jsonify({'errors': errors}), 400
        
        # Update fields
        updateable_fields = [
            'name', 'bio', 'formed_year', 'genres', 'hometown', 'county',
            'member_count', 'contact_email', 'contact_phone', 'website',
            'social_links', 'profile_image_url', 'banner_image_url',
            'photo_gallery_urls'
        ]
        
        for field in updateable_fields:
            if field in data:
                setattr(band, field, data[field])
        
        # Update slug if name changed
        if 'name' in data and data['name'] != band.name:
            base_slug = Band.generate_slug(data['name'])
            slug = base_slug
            counter = 1
            while Band.query.filter_by(slug=slug).filter(Band.id != band.id).first():
                slug = f"{base_slug}-{counter}"
                counter += 1
            band.slug = slug
        
        db.session.commit()
        
        return jsonify({
            'message': 'Band updated successfully',
            'band': band.to_dict(include_stats=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating band {slug}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# ============================================================================
# GIGS ENDPOINTS
# ============================================================================

@bands_bp.route('/gigs', methods=['GET'])
@firebase_auth_optional
def list_gigs():
    """
    GET /api/gigs
    List gigs with filtering and pagination
    """
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        band_slug = request.args.get('band')
        venue_slug = request.args.get('venue')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        status = request.args.get('status')
        county = request.args.get('county')
        
        # Build base query
        query = Gig.query.filter(Gig.is_public == True)
        
        # Apply filters
        filters = []
        
        if band_slug:
            band = Band.query.filter_by(slug=band_slug).first()
            if band:
                filters.append(Gig.band_id == band.id)
        
        if venue_slug:
            venue = Venue.query.filter_by(slug=venue_slug).first()
            if venue:
                filters.append(Gig.venue_id == venue.id)
        
        if date_from:
            try:
                from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00')).date()
                filters.append(Gig.gig_date >= from_date)
            except ValueError:
                return jsonify({'error': 'Invalid date_from format'}), 400
        
        if date_to:
            try:
                to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00')).date()
                filters.append(Gig.gig_date <= to_date)
            except ValueError:
                return jsonify({'error': 'Invalid date_to format'}), 400
        
        if status:
            statuses = status.split(',')
            filters.append(Gig.status.in_(statuses))
        
        if county:
            # Join with venues to filter by county
            query = query.join(Venue).filter(Venue.county.ilike(f"%{county}%"))
        
        if filters:
            query = query.filter(and_(*filters))
        
        # Order by date
        query = query.order_by(desc(Gig.gig_date))
        
        # Paginate results
        pagination = paginate_query(query, page, per_page)
        
        # Serialize results
        gigs = [gig.to_dict(include_venue=True, include_band=True, include_supporting=True) 
                for gig in pagination.items]
        
        return jsonify({
            'gigs': gigs,
            'pagination': {
                'page': pagination.page,
                'pages': pagination.pages,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error listing gigs: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bands_bp.route('/gigs', methods=['POST'])
@band_member_required
def create_gig():
    """
    POST /api/gigs
    Create a new gig (band members only)
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'JSON data required'}), 400
        
        # Validate data
        errors = validate_gig_data(data)
        if errors:
            return jsonify({'errors': errors}), 400
        
        current_user = get_current_user()
        
        # Verify user is member of the band
        membership = BandMember.query.filter_by(
            band_id=data['band_id'],
            user_id=current_user.id,
            is_active=True
        ).first()
        
        if not membership:
            return jsonify({'error': 'Not authorized to create gigs for this band'}), 403
        
        # Verify venue exists
        venue = Venue.query.filter_by(id=data['venue_id'], is_active=True).first()
        if not venue:
            return jsonify({'error': 'Venue not found'}), 404
        
        # Create gig
        gig = Gig(
            band_id=data['band_id'],
            venue_id=data['venue_id'],
            title=data.get('title'),
            description=data.get('description'),
            gig_date=datetime.fromisoformat(data['gig_date'].replace('Z', '+00:00')).date(),
            start_time=datetime.fromisoformat(data['start_time']).time() if data.get('start_time') else None,
            end_time=datetime.fromisoformat(data['end_time']).time() if data.get('end_time') else None,
            door_price=data.get('door_price'),
            ticket_url=data.get('ticket_url'),
            status=data.get('status', 'scheduled'),
            gig_type=data.get('gig_type', 'regular'),
            expected_attendance=data.get('expected_attendance'),
            age_restriction=data.get('age_restriction'),
            special_notes=data.get('special_notes'),
            created_by=current_user.id
        )
        
        db.session.add(gig)
        
        # Add supporting bands if provided
        if data.get('supporting_bands'):
            for i, support_band_id in enumerate(data['supporting_bands']):
                support = GigSupportingBand(
                    gig_id=gig.id,
                    band_id=support_band_id,
                    performance_order=i + 1
                )
                db.session.add(support)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Gig created successfully',
            'gig': gig.to_dict(include_venue=True, include_band=True, include_supporting=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating gig: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# ============================================================================
# REVIEWS ENDPOINTS
# ============================================================================

@bands_bp.route('/reviews/bands', methods=['GET'])
@firebase_auth_optional
def list_band_reviews():
    """
    GET /api/reviews/bands
    List band reviews with filtering and pagination
    """
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        band_slug = request.args.get('band')
        reviewer_id = request.args.get('reviewer_id')
        
        # Build base query
        query = BandReview.query.filter(BandReview.is_published == True)
        
        # Apply filters
        if band_slug:
            band = Band.query.filter_by(slug=band_slug).first()
            if band:
                query = query.filter(BandReview.band_id == band.id)
            else:
                return jsonify({'error': 'Band not found'}), 404
        
        if reviewer_id:
            query = query.filter(BandReview.reviewer_id == reviewer_id)
        
        # Order by creation date
        query = query.order_by(desc(BandReview.created_at))
        
        # Paginate results
        pagination = paginate_query(query, page, per_page)
        
        # Serialize results
        reviews = [review.to_dict(include_reviewer=True, include_band=True) 
                  for review in pagination.items]
        
        return jsonify({
            'reviews': reviews,
            'pagination': {
                'page': pagination.page,
                'pages': pagination.pages,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error listing band reviews: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bands_bp.route('/reviews/bands', methods=['POST'])
@firebase_auth_required
def create_band_review():
    """
    POST /api/reviews/bands
    Create a new band review
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'JSON data required'}), 400
        
        # Validate data
        errors = validate_review_data(data)
        if errors:
            return jsonify({'errors': errors}), 400
        
        current_user = get_current_user()
        
        # Verify band exists
        band = Band.query.filter_by(id=data['band_id'], is_active=True).first()
        if not band:
            return jsonify({'error': 'Band not found'}), 404
        
        # Check for duplicate review if gig_id provided
        if data.get('gig_id'):
            existing = BandReview.query.filter_by(
                band_id=data['band_id'],
                reviewer_id=current_user.id,
                gig_id=data['gig_id']
            ).first()
            if existing:
                return jsonify({'error': 'You have already reviewed this band for this gig'}), 400
        
        # Create review
        review = BandReview(
            band_id=data['band_id'],
            reviewer_id=current_user.id,
            gig_id=data.get('gig_id'),
            rating=data['rating'],
            title=data.get('title'),
            review_text=data['review_text'],
            performance_rating=data.get('performance_rating'),
            stage_presence_rating=data.get('stage_presence_rating'),
            sound_quality_rating=data.get('sound_quality_rating'),
            song_variety_rating=data.get('song_variety_rating'),
            would_recommend=data.get('would_recommend'),
            tags=data.get('tags'),
            is_anonymous=data.get('is_anonymous', False)
        )
        
        db.session.add(review)
        db.session.commit()
        
        return jsonify({
            'message': 'Review created successfully',
            'review': review.to_dict(include_reviewer=True, include_band=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating band review: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bands_bp.route('/reviews/venues', methods=['GET'])
@firebase_auth_optional
def list_venue_reviews_by_bands():
    """
    GET /api/reviews/venues
    List venue reviews written by bands
    """
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        venue_slug = request.args.get('venue')
        band_slug = request.args.get('band')
        
        # Build base query
        query = VenueReviewByBand.query.filter(VenueReviewByBand.is_published == True)
        
        # Apply filters
        if venue_slug:
            venue = Venue.query.filter_by(slug=venue_slug).first()
            if venue:
                query = query.filter(VenueReviewByBand.venue_id == venue.id)
            else:
                return jsonify({'error': 'Venue not found'}), 404
        
        if band_slug:
            band = Band.query.filter_by(slug=band_slug).first()
            if band:
                query = query.filter(VenueReviewByBand.band_id == band.id)
            else:
                return jsonify({'error': 'Band not found'}), 404
        
        # Order by creation date
        query = query.order_by(desc(VenueReviewByBand.created_at))
        
        # Paginate results
        pagination = paginate_query(query, page, per_page)
        
        # Serialize results
        reviews = [review.to_dict(include_band=True, include_venue=True) 
                  for review in pagination.items]
        
        return jsonify({
            'reviews': reviews,
            'pagination': {
                'page': pagination.page,
                'pages': pagination.pages,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error listing venue reviews by bands: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bands_bp.route('/reviews/venues', methods=['POST'])
@band_member_required
def create_venue_review_by_band():
    """
    POST /api/reviews/venues
    Create a venue review by a band
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'JSON data required'}), 400
        
        # Validate data
        errors = validate_review_data(data)
        if errors:
            return jsonify({'errors': errors}), 400
        
        current_user = get_current_user()
        
        # Verify band membership
        membership = BandMember.query.filter_by(
            band_id=data['band_id'],
            user_id=current_user.id,
            is_active=True
        ).first()
        
        if not membership:
            return jsonify({'error': 'Not authorized to review venues for this band'}), 403
        
        # Verify venue exists
        venue = Venue.query.filter_by(id=data['venue_id'], is_active=True).first()
        if not venue:
            return jsonify({'error': 'Venue not found'}), 404
        
        # Check for duplicate review if gig_id provided
        if data.get('gig_id'):
            existing = VenueReviewByBand.query.filter_by(
                band_id=data['band_id'],
                venue_id=data['venue_id'],
                gig_id=data['gig_id']
            ).first()
            if existing:
                return jsonify({'error': 'This band has already reviewed this venue for this gig'}), 400
        
        # Create review
        review = VenueReviewByBand(
            band_id=data['band_id'],
            venue_id=data['venue_id'],
            gig_id=data.get('gig_id'),
            rating=data['rating'],
            title=data.get('title'),
            review_text=data['review_text'],
            sound_quality_rating=data.get('sound_quality_rating'),
            staff_rating=data.get('staff_rating'),
            payment_promptness_rating=data.get('payment_promptness_rating'),
            crowd_response_rating=data.get('crowd_response_rating'),
            would_play_again=data.get('would_play_again'),
            pros=data.get('pros'),
            cons=data.get('cons'),
            recommended_for=data.get('recommended_for'),
            is_anonymous=data.get('is_anonymous', False)
        )
        
        db.session.add(review)
        db.session.commit()
        
        return jsonify({
            'message': 'Venue review created successfully',
            'review': review.to_dict(include_band=True, include_venue=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating venue review by band: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# ============================================================================
# BAND FOLLOWERS ENDPOINTS
# ============================================================================

@bands_bp.route('/bands/<slug>/follow', methods=['POST'])
@firebase_auth_required
def follow_band(slug):
    """
    POST /api/bands/:slug/follow
    Follow a band
    """
    try:
        current_user = get_current_user()
        
        # Find band
        band = Band.query.filter_by(slug=slug, is_active=True).first()
        if not band:
            return jsonify({'error': 'Band not found'}), 404
        
        # Check if already following
        existing = BandFollower.query.filter_by(
            band_id=band.id,
            follower_id=current_user.id
        ).first()
        
        if existing:
            return jsonify({'error': 'Already following this band'}), 400
        
        # Create follow relationship
        follow = BandFollower(
            band_id=band.id,
            follower_id=current_user.id
        )
        
        db.session.add(follow)
        db.session.commit()
        
        return jsonify({
            'message': 'Successfully followed band',
            'band_name': band.name
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error following band {slug}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bands_bp.route('/bands/<slug>/unfollow', methods=['DELETE'])
@firebase_auth_required
def unfollow_band(slug):
    """
    DELETE /api/bands/:slug/unfollow
    Unfollow a band
    """
    try:
        current_user = get_current_user()
        
        # Find band
        band = Band.query.filter_by(slug=slug, is_active=True).first()
        if not band:
            return jsonify({'error': 'Band not found'}), 404
        
        # Find follow relationship
        follow = BandFollower.query.filter_by(
            band_id=band.id,
            follower_id=current_user.id
        ).first()
        
        if not follow:
            return jsonify({'error': 'Not following this band'}), 400
        
        # Remove follow relationship
        db.session.delete(follow)
        db.session.commit()
        
        return jsonify({
            'message': 'Successfully unfollowed band',
            'band_name': band.name
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error unfollowing band {slug}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# ============================================================================
# STATISTICS AND SEARCH ENDPOINTS
# ============================================================================

@bands_bp.route('/stats', methods=['GET'])
@firebase_auth_optional
def get_platform_stats():
    """
    GET /api/stats
    Get platform statistics
    """
    try:
        stats = {
            'total_bands': Band.query.filter_by(is_active=True).count(),
            'total_venues': Venue.query.filter_by(is_active=True).count(),
            'total_gigs': Gig.query.filter(Gig.is_public == True).count(),
            'upcoming_gigs': Gig.query.filter(
                and_(
                    Gig.gig_date >= date.today(),
                    Gig.status.in_(['scheduled', 'confirmed']),
                    Gig.is_public == True
                )
            ).count(),
            'total_reviews': BandReview.query.filter_by(is_published=True).count() + 
                           VenueReviewByBand.query.filter_by(is_published=True).count(),
            'verified_bands': Band.query.filter(
                and_(Band.is_active == True, Band.is_verified == True)
            ).count()
        }
        
        # Get popular genres
        popular_genres = db.session.query(
            func.unnest(Band.genres).label('genre'),
            func.count().label('count')
        ).filter(Band.is_active == True).group_by('genre').order_by(desc('count')).limit(10).all()
        
        stats['popular_genres'] = [
            {'genre': genre[0], 'count': genre[1]} 
            for genre in popular_genres
        ]
        
        return jsonify(stats), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting platform stats: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@bands_bp.route('/search', methods=['GET'])
@firebase_auth_optional
def search_all():
    """
    GET /api/search
    Global search across bands, venues, and gigs
    """
    try:
        query = request.args.get('q', '').strip()
        if not query:
            return jsonify({'error': 'Search query required'}), 400
        
        search_term = f"%{query}%"
        
        # Search bands
        bands = Band.query.filter(
            and_(
                Band.is_active == True,
                or_(
                    Band.name.ilike(search_term),
                    Band.bio.ilike(search_term),
                    Band.hometown.ilike(search_term)
                )
            )
        ).limit(10).all()
        
        # Search venues
        venues = Venue.query.filter(
            and_(
                Venue.is_active == True,
                or_(
                    Venue.name.ilike(search_term),
                    Venue.description.ilike(search_term),
                    Venue.city.ilike(search_term)
                )
            )
        ).limit(10).all()
        
        # Search upcoming gigs
        gigs = Gig.query.join(Band).join(Venue).filter(
            and_(
                Gig.is_public == True,
                Gig.gig_date >= date.today(),
                or_(
                    Gig.title.ilike(search_term),
                    Gig.description.ilike(search_term),
                    Band.name.ilike(search_term),
                    Venue.name.ilike(search_term)
                )
            )
        ).limit(10).all()
        
        return jsonify({
            'query': query,
            'results': {
                'bands': [band.to_dict(include_stats=False) for band in bands],
                'venues': [venue.to_dict(include_stats=False) for venue in venues],
                'gigs': [gig.to_dict(include_venue=True, include_band=True) for gig in gigs]
            },
            'total_results': len(bands) + len(venues) + len(gigs)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in global search: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
