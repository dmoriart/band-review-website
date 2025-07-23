"""
BandVenueReview.ie - Enhanced Models for Bands API
Updated SQLAlchemy models to match the comprehensive PostgreSQL schema
"""

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, date
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy import func, text
import uuid
import re

db = SQLAlchemy()

class User(db.Model):
    """User accounts synced with Firebase Auth"""
    __tablename__ = 'users'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firebase_uid = db.Column(db.String(128), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    display_name = db.Column(db.String(100), nullable=True)
    photo_url = db.Column(db.Text, nullable=True)
    user_type = db.Column(db.String(20), default='fan', nullable=False)  # fan, band, venue, promoter
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    band_memberships = db.relationship('BandMember', back_populates='user', cascade='all, delete-orphan')
    band_reviews = db.relationship('BandReview', back_populates='reviewer', cascade='all, delete-orphan')
    band_follows = db.relationship('BandFollower', back_populates='follower', cascade='all, delete-orphan')
    created_gigs = db.relationship('Gig', back_populates='creator')

    def to_dict(self):
        return {
            'id': str(self.id),
            'firebase_uid': self.firebase_uid,
            'email': self.email,
            'display_name': self.display_name,
            'photo_url': self.photo_url,
            'user_type': self.user_type,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Venue(db.Model):
    """Live music venues (integrated with existing venue system)"""
    __tablename__ = 'venues'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    address = db.Column(db.Text, nullable=False)
    city = db.Column(db.String(100), nullable=False, index=True)
    county = db.Column(db.String(50), nullable=False, index=True)
    country = db.Column(db.String(50), default='Ireland')
    phone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(255), nullable=True)
    website = db.Column(db.Text, nullable=True)
    capacity = db.Column(db.Integer, nullable=True)
    venue_type = db.Column(db.String(50), nullable=True)  # pub, club, concert_hall, outdoor, festival, other
    description = db.Column(db.Text, nullable=True)
    facilities = db.Column(ARRAY(db.String), nullable=True)  # sound_system, lighting, parking
    latitude = db.Column(db.Numeric(10, 8), nullable=True)
    longitude = db.Column(db.Numeric(11, 8), nullable=True)
    google_maps_url = db.Column(db.Text, nullable=True)
    social_links = db.Column(JSONB, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    gigs = db.relationship('Gig', back_populates='venue')
    venue_reviews = db.relationship('VenueReviewByBand', back_populates='venue')

    def to_dict(self, include_stats=False):
        data = {
            'id': str(self.id),
            'name': self.name,
            'slug': self.slug,
            'address': self.address,
            'city': self.city,
            'county': self.county,
            'country': self.country,
            'phone': self.phone,
            'email': self.email,
            'website': self.website,
            'capacity': self.capacity,
            'venue_type': self.venue_type,
            'description': self.description,
            'facilities': self.facilities,
            'latitude': float(self.latitude) if self.latitude else None,
            'longitude': float(self.longitude) if self.longitude else None,
            'google_maps_url': self.google_maps_url,
            'social_links': self.social_links,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_stats:
            data.update({
                'total_gigs': len(self.gigs) if self.gigs else 0,
                'total_reviews': len(self.venue_reviews) if self.venue_reviews else 0,
                'average_rating': self.get_average_rating()
            })
            
        return data

    def get_average_rating(self):
        if self.venue_reviews:
            return sum(review.rating for review in self.venue_reviews) / len(self.venue_reviews)
        return None

class Band(db.Model):
    """Band profiles and information"""
    __tablename__ = 'bands'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    bio = db.Column(db.Text, nullable=True)
    formed_year = db.Column(db.Integer, nullable=True)
    genres = db.Column(ARRAY(db.String), nullable=False)  # Array of genres
    hometown = db.Column(db.String(100), nullable=True)
    county = db.Column(db.String(50), nullable=True, index=True)
    country = db.Column(db.String(50), default='Ireland')
    member_count = db.Column(db.Integer, nullable=True)
    contact_email = db.Column(db.String(255), nullable=True)
    contact_phone = db.Column(db.String(20), nullable=True)
    website = db.Column(db.Text, nullable=True)
    social_links = db.Column(JSONB, nullable=True)  # JSON object with platform: url pairs
    profile_image_url = db.Column(db.Text, nullable=True)
    banner_image_url = db.Column(db.Text, nullable=True)
    photo_gallery_urls = db.Column(ARRAY(db.String), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    verification_level = db.Column(db.String(20), default='none')  # none, basic, verified, featured
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by])
    members = db.relationship('BandMember', back_populates='band', cascade='all, delete-orphan')
    gigs = db.relationship('Gig', back_populates='band')
    venue_reviews = db.relationship('VenueReviewByBand', back_populates='band')
    band_reviews = db.relationship('BandReview', back_populates='band')
    followers = db.relationship('BandFollower', back_populates='band', cascade='all, delete-orphan')
    setlists = db.relationship('Setlist', back_populates='band')

    def to_dict(self, include_stats=False, include_members=False):
        data = {
            'id': str(self.id),
            'name': self.name,
            'slug': self.slug,
            'bio': self.bio,
            'formed_year': self.formed_year,
            'genres': self.genres,
            'hometown': self.hometown,
            'county': self.county,
            'country': self.country,
            'member_count': self.member_count,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'website': self.website,
            'social_links': self.social_links,
            'profile_image_url': self.profile_image_url,
            'banner_image_url': self.banner_image_url,
            'photo_gallery_urls': self.photo_gallery_urls,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'verification_level': self.verification_level,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_stats:
            data.update({
                'follower_count': len(self.followers) if self.followers else 0,
                'total_gigs': len(self.gigs) if self.gigs else 0,
                'total_reviews': len(self.band_reviews) if self.band_reviews else 0,
                'average_rating': self.get_average_rating(),
                'upcoming_gigs_count': self.get_upcoming_gigs_count()
            })
        
        if include_members:
            data['members'] = [member.to_dict() for member in self.members if member.is_active]
            
        return data

    def get_average_rating(self):
        if self.band_reviews:
            return sum(review.rating for review in self.band_reviews) / len(self.band_reviews)
        return None

    def get_upcoming_gigs_count(self):
        return len([gig for gig in self.gigs if gig.gig_date >= date.today() and gig.status in ['scheduled', 'confirmed']])

    @staticmethod
    def generate_slug(name):
        """Generate URL-friendly slug from band name"""
        slug = re.sub(r'[^a-zA-Z0-9\s\-]', '', name.lower())
        slug = re.sub(r'\s+', '-', slug)
        slug = re.sub(r'\-+', '-', slug).strip('-')
        return slug

class BandMember(db.Model):
    """Many-to-many relationship between users and bands"""
    __tablename__ = 'band_members'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    band_id = db.Column(UUID(as_uuid=True), db.ForeignKey('bands.id'), nullable=False)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.String(100), nullable=True)  # vocalist, guitarist, drummer, etc.
    is_primary_contact = db.Column(db.Boolean, default=False)
    joined_date = db.Column(db.Date, default=date.today)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    band = db.relationship('Band', back_populates='members')
    user = db.relationship('User', back_populates='band_memberships')

    def to_dict(self):
        return {
            'id': str(self.id),
            'band_id': str(self.band_id),
            'user_id': str(self.user_id),
            'role': self.role,
            'is_primary_contact': self.is_primary_contact,
            'joined_date': self.joined_date.isoformat() if self.joined_date else None,
            'is_active': self.is_active,
            'user_name': self.user.display_name if self.user else None,
            'user_email': self.user.email if self.user else None
        }

class Gig(db.Model):
    """Concert/performance events"""
    __tablename__ = 'gigs'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    band_id = db.Column(UUID(as_uuid=True), db.ForeignKey('bands.id'), nullable=False)
    venue_id = db.Column(UUID(as_uuid=True), db.ForeignKey('venues.id'), nullable=False)
    title = db.Column(db.String(300), nullable=True)  # Event title if different from band name
    description = db.Column(db.Text, nullable=True)
    gig_date = db.Column(db.Date, nullable=False, index=True)
    start_time = db.Column(db.Time, nullable=True)
    end_time = db.Column(db.Time, nullable=True)
    door_price = db.Column(db.Numeric(8, 2), nullable=True)
    ticket_url = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='scheduled')  # scheduled, confirmed, cancelled, completed
    gig_type = db.Column(db.String(30), default='regular')  # regular, support, headline, festival, private
    expected_attendance = db.Column(db.Integer, nullable=True)
    age_restriction = db.Column(db.String(10), nullable=True)  # 18+, All Ages
    special_notes = db.Column(db.Text, nullable=True)
    is_public = db.Column(db.Boolean, default=True)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    band = db.relationship('Band', back_populates='gigs')
    venue = db.relationship('Venue', back_populates='gigs')
    creator = db.relationship('User', back_populates='created_gigs')
    supporting_bands = db.relationship('GigSupportingBand', back_populates='gig', cascade='all, delete-orphan')
    venue_reviews = db.relationship('VenueReviewByBand', back_populates='gig')
    band_reviews = db.relationship('BandReview', back_populates='gig')
    setlists = db.relationship('Setlist', back_populates='gig')

    def to_dict(self, include_venue=True, include_band=True, include_supporting=False):
        data = {
            'id': str(self.id),
            'band_id': str(self.band_id),
            'venue_id': str(self.venue_id),
            'title': self.title,
            'description': self.description,
            'gig_date': self.gig_date.isoformat() if self.gig_date else None,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'door_price': float(self.door_price) if self.door_price else None,
            'ticket_url': self.ticket_url,
            'status': self.status,
            'gig_type': self.gig_type,
            'expected_attendance': self.expected_attendance,
            'age_restriction': self.age_restriction,
            'special_notes': self.special_notes,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_venue and self.venue:
            data['venue'] = {
                'id': str(self.venue.id),
                'name': self.venue.name,
                'slug': self.venue.slug,
                'city': self.venue.city,
                'county': self.venue.county
            }
        
        if include_band and self.band:
            data['band'] = {
                'id': str(self.band.id),
                'name': self.band.name,
                'slug': self.band.slug,
                'genres': self.band.genres
            }
        
        if include_supporting:
            data['supporting_bands'] = [support.to_dict() for support in self.supporting_bands]
            
        return data

class GigSupportingBand(db.Model):
    """Supporting bands for gigs (many-to-many)"""
    __tablename__ = 'gig_supporting_bands'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    gig_id = db.Column(UUID(as_uuid=True), db.ForeignKey('gigs.id'), nullable=False)
    band_id = db.Column(UUID(as_uuid=True), db.ForeignKey('bands.id'), nullable=False)
    performance_order = db.Column(db.Integer, nullable=True)  # 1 for opener, 2 for second support
    set_duration_minutes = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    gig = db.relationship('Gig', back_populates='supporting_bands')
    band = db.relationship('Band')

    def to_dict(self):
        return {
            'id': str(self.id),
            'gig_id': str(self.gig_id),
            'band_id': str(self.band_id),
            'performance_order': self.performance_order,
            'set_duration_minutes': self.set_duration_minutes,
            'band_name': self.band.name if self.band else None,
            'band_slug': self.band.slug if self.band else None
        }

class VenueReviewByBand(db.Model):
    """Venue reviews written by bands"""
    __tablename__ = 'venue_reviews_by_bands'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    band_id = db.Column(UUID(as_uuid=True), db.ForeignKey('bands.id'), nullable=False)
    venue_id = db.Column(UUID(as_uuid=True), db.ForeignKey('venues.id'), nullable=False)
    gig_id = db.Column(UUID(as_uuid=True), db.ForeignKey('gigs.id'), nullable=True)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 scale
    title = db.Column(db.String(200), nullable=True)
    review_text = db.Column(db.Text, nullable=False)
    sound_quality_rating = db.Column(db.Integer, nullable=True)  # 1-5 scale
    staff_rating = db.Column(db.Integer, nullable=True)  # 1-5 scale
    payment_promptness_rating = db.Column(db.Integer, nullable=True)  # 1-5 scale
    crowd_response_rating = db.Column(db.Integer, nullable=True)  # 1-5 scale
    would_play_again = db.Column(db.Boolean, nullable=True)
    pros = db.Column(ARRAY(db.String), nullable=True)
    cons = db.Column(ARRAY(db.String), nullable=True)
    recommended_for = db.Column(ARRAY(db.String), nullable=True)  # Band types/genres
    is_anonymous = db.Column(db.Boolean, default=False)
    is_published = db.Column(db.Boolean, default=True)
    helpful_votes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    band = db.relationship('Band', back_populates='venue_reviews')
    venue = db.relationship('Venue', back_populates='venue_reviews')
    gig = db.relationship('Gig', back_populates='venue_reviews')

    def to_dict(self, include_band=True, include_venue=True):
        data = {
            'id': str(self.id),
            'rating': self.rating,
            'title': self.title,
            'review_text': self.review_text,
            'sound_quality_rating': self.sound_quality_rating,
            'staff_rating': self.staff_rating,
            'payment_promptness_rating': self.payment_promptness_rating,
            'crowd_response_rating': self.crowd_response_rating,
            'would_play_again': self.would_play_again,
            'pros': self.pros,
            'cons': self.cons,
            'recommended_for': self.recommended_for,
            'is_anonymous': self.is_anonymous,
            'is_published': self.is_published,
            'helpful_votes': self.helpful_votes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'gig_date': self.gig.gig_date.isoformat() if self.gig and self.gig.gig_date else None
        }
        
        if include_band and self.band and not self.is_anonymous:
            data['band'] = {
                'id': str(self.band.id),
                'name': self.band.name,
                'slug': self.band.slug
            }
        
        if include_venue and self.venue:
            data['venue'] = {
                'id': str(self.venue.id),
                'name': self.venue.name,
                'slug': self.venue.slug,
                'city': self.venue.city,
                'county': self.venue.county
            }
            
        return data

class BandReview(db.Model):
    """Band reviews written by fans/users"""
    __tablename__ = 'band_reviews'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    band_id = db.Column(UUID(as_uuid=True), db.ForeignKey('bands.id'), nullable=False)
    reviewer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    gig_id = db.Column(UUID(as_uuid=True), db.ForeignKey('gigs.id'), nullable=True)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 scale
    title = db.Column(db.String(200), nullable=True)
    review_text = db.Column(db.Text, nullable=False)
    performance_rating = db.Column(db.Integer, nullable=True)  # 1-5 scale
    stage_presence_rating = db.Column(db.Integer, nullable=True)  # 1-5 scale
    sound_quality_rating = db.Column(db.Integer, nullable=True)  # 1-5 scale
    song_variety_rating = db.Column(db.Integer, nullable=True)  # 1-5 scale
    would_recommend = db.Column(db.Boolean, nullable=True)
    tags = db.Column(ARRAY(db.String), nullable=True)  # Descriptive tags
    is_anonymous = db.Column(db.Boolean, default=False)
    is_published = db.Column(db.Boolean, default=True)
    helpful_votes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    band = db.relationship('Band', back_populates='band_reviews')
    reviewer = db.relationship('User', back_populates='band_reviews')
    gig = db.relationship('Gig', back_populates='band_reviews')

    def to_dict(self, include_reviewer=True, include_band=True):
        data = {
            'id': str(self.id),
            'rating': self.rating,
            'title': self.title,
            'review_text': self.review_text,
            'performance_rating': self.performance_rating,
            'stage_presence_rating': self.stage_presence_rating,
            'sound_quality_rating': self.sound_quality_rating,
            'song_variety_rating': self.song_variety_rating,
            'would_recommend': self.would_recommend,
            'tags': self.tags,
            'is_anonymous': self.is_anonymous,
            'is_published': self.is_published,
            'helpful_votes': self.helpful_votes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'gig_date': self.gig.gig_date.isoformat() if self.gig and self.gig.gig_date else None
        }
        
        if include_reviewer and self.reviewer and not self.is_anonymous:
            data['reviewer'] = {
                'id': str(self.reviewer.id),
                'display_name': self.reviewer.display_name,
                'is_verified': self.reviewer.is_verified
            }
        
        if include_band and self.band:
            data['band'] = {
                'id': str(self.band.id),
                'name': self.band.name,
                'slug': self.band.slug
            }
            
        return data

class BandFollower(db.Model):
    """Fans following bands"""
    __tablename__ = 'band_followers'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    band_id = db.Column(UUID(as_uuid=True), db.ForeignKey('bands.id'), nullable=False)
    follower_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    notification_preferences = db.Column(JSONB, default={'new_gigs': True, 'new_releases': False, 'band_updates': True})
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    band = db.relationship('Band', back_populates='followers')
    follower = db.relationship('User', back_populates='band_follows')

    def to_dict(self):
        return {
            'id': str(self.id),
            'band_id': str(self.band_id),
            'follower_id': str(self.follower_id),
            'notification_preferences': self.notification_preferences,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'band_name': self.band.name if self.band else None,
            'follower_name': self.follower.display_name if self.follower else None
        }

class Setlist(db.Model):
    """Setlists for detailed gig information"""
    __tablename__ = 'setlists'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    gig_id = db.Column(UUID(as_uuid=True), db.ForeignKey('gigs.id'), nullable=False)
    band_id = db.Column(UUID(as_uuid=True), db.ForeignKey('bands.id'), nullable=False)
    songs = db.Column(JSONB, nullable=False)  # Array of song objects
    total_duration_minutes = db.Column(db.Integer, nullable=True)
    encore_songs = db.Column(JSONB, nullable=True)  # Optional encore songs
    notes = db.Column(db.Text, nullable=True)
    is_complete = db.Column(db.Boolean, default=False)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    gig = db.relationship('Gig', back_populates='setlists')
    band = db.relationship('Band', back_populates='setlists')
    creator = db.relationship('User')

    def to_dict(self):
        return {
            'id': str(self.id),
            'gig_id': str(self.gig_id),
            'band_id': str(self.band_id),
            'songs': self.songs,
            'total_duration_minutes': self.total_duration_minutes,
            'encore_songs': self.encore_songs,
            'notes': self.notes,
            'is_complete': self.is_complete,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'gig_date': self.gig.gig_date.isoformat() if self.gig and self.gig.gig_date else None,
            'venue_name': self.gig.venue.name if self.gig and self.gig.venue else None,
            'band_name': self.band.name if self.band else None
        }

class ReviewVote(db.Model):
    """Helpfulness votes on reviews"""
    __tablename__ = 'review_votes'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id = db.Column(UUID(as_uuid=True), nullable=False)  # Can reference either review type
    review_type = db.Column(db.String(20), nullable=False)  # 'venue_review' or 'band_review'
    voter_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    is_helpful = db.Column(db.Boolean, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

    # Relationship
    voter = db.relationship('User')

    def to_dict(self):
        return {
            'id': str(self.id),
            'review_id': str(self.review_id),
            'review_type': self.review_type,
            'voter_id': str(self.voter_id),
            'is_helpful': self.is_helpful,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
