"""
Production-compatible models that work with both SQLite and PostgreSQL
"""
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text, Column, Integer, String, Text, Boolean, DateTime, Date, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import json
import os

db = SQLAlchemy()

# Check if we're in production (PostgreSQL) or development (SQLite)
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///bandvenuereview_dev.db')
IS_POSTGRESQL = DATABASE_URL.startswith('postgresql://') or DATABASE_URL.startswith('postgres://')

# Use appropriate JSON type based on database
if IS_POSTGRESQL:
    from sqlalchemy.dialects.postgresql import JSONB
    JsonType = JSONB
else:
    JsonType = Text

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True)  # Firebase UID
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    display_name = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'display_name': self.display_name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Band(db.Model):
    __tablename__ = 'bands'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    bio = db.Column(db.Text, nullable=True)
    formed_year = db.Column(db.Integer, nullable=True)
    
    # Use JsonType (JSONB for PostgreSQL, Text for SQLite)
    genres = db.Column(JsonType, nullable=True)
    hometown = db.Column(db.String(100), nullable=True)
    county = db.Column(db.String(50), nullable=True)
    country = db.Column(db.String(50), default='Ireland')
    
    member_count = db.Column(db.Integer, nullable=True)
    contact_email = db.Column(db.String(255), nullable=True)
    contact_phone = db.Column(db.String(20), nullable=True)
    website = db.Column(db.String(255), nullable=True)
    
    # JSON fields
    social_links = db.Column(JsonType, nullable=True)
    profile_image_url = db.Column(db.String(500), nullable=True)
    banner_image_url = db.Column(db.String(500), nullable=True)
    photo_gallery_urls = db.Column(JsonType, nullable=True)
    
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    verification_level = db.Column(db.String(20), default='none')
    
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Helper methods for JSON fields (SQLite compatibility)
    def get_genres(self):
        if IS_POSTGRESQL:
            return self.genres if self.genres else []
        else:
            return json.loads(self.genres) if self.genres else []
    
    def set_genres(self, genres_list):
        if IS_POSTGRESQL:
            self.genres = genres_list
        else:
            self.genres = json.dumps(genres_list)
    
    def get_social_links(self):
        if IS_POSTGRESQL:
            return self.social_links if self.social_links else {}
        else:
            return json.loads(self.social_links) if self.social_links else {}
    
    def set_social_links(self, links_dict):
        if IS_POSTGRESQL:
            self.social_links = links_dict
        else:
            self.social_links = json.dumps(links_dict)
    
    def get_photo_gallery_urls(self):
        if IS_POSTGRESQL:
            return self.photo_gallery_urls if self.photo_gallery_urls else []
        else:
            return json.loads(self.photo_gallery_urls) if self.photo_gallery_urls else []
    
    def set_photo_gallery_urls(self, urls_list):
        if IS_POSTGRESQL:
            self.photo_gallery_urls = urls_list
        else:
            self.photo_gallery_urls = json.dumps(urls_list)
    
    def to_dict(self, include_stats=False, include_members=False):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'bio': self.bio,
            'formed_year': self.formed_year,
            'genres': self.get_genres(),
            'hometown': self.hometown,
            'county': self.county,
            'country': self.country,
            'member_count': self.member_count,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'website': self.website,
            'social_links': self.get_social_links(),
            'profile_image_url': self.profile_image_url,
            'banner_image_url': self.banner_image_url,
            'photo_gallery_urls': self.get_photo_gallery_urls(),
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'verification_level': self.verification_level,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'upcoming_gigs': []  # Placeholder for API compatibility
        }

class Venue(db.Model):
    __tablename__ = 'venues'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    address = db.Column(db.String(500), nullable=True)
    city = db.Column(db.String(100), nullable=True, index=True)
    county = db.Column(db.String(50), nullable=True, index=True)
    country = db.Column(db.String(50), default='Ireland')
    eircode = db.Column(db.String(10), nullable=True)
    
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    
    capacity = db.Column(db.Integer, nullable=True)
    venue_type = db.Column(db.String(50), nullable=False, default='live_music_venue')
    
    # JSON fields
    primary_genres = db.Column(JsonType, nullable=True)
    contact_email = db.Column(db.String(255), nullable=True)
    contact_phone = db.Column(db.String(20), nullable=True)
    website = db.Column(db.String(255), nullable=True)
    social_links = db.Column(JsonType, nullable=True)
    
    profile_image_url = db.Column(db.String(500), nullable=True)
    photo_gallery_urls = db.Column(JsonType, nullable=True)
    
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def get_primary_genres(self):
        if IS_POSTGRESQL:
            return self.primary_genres if self.primary_genres else []
        else:
            return json.loads(self.primary_genres) if self.primary_genres else []
    
    def set_primary_genres(self, genres_list):
        if IS_POSTGRESQL:
            self.primary_genres = genres_list
        else:
            self.primary_genres = json.dumps(genres_list)
    
    def to_dict(self, include_stats=False):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'address': self.address,
            'city': self.city,
            'county': self.county,
            'country': self.country,
            'eircode': self.eircode,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'capacity': self.capacity,
            'venue_type': self.venue_type,
            'primary_genres': self.get_primary_genres(),
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'website': self.website,
            'social_links': self.get_social_links() if hasattr(self, 'get_social_links') else {},
            'profile_image_url': self.profile_image_url,
            'photo_gallery_urls': self.get_photo_gallery_urls() if hasattr(self, 'get_photo_gallery_urls') else [],
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# Minimal models for core functionality
class Gig(db.Model):
    __tablename__ = 'gigs'
    
    id = db.Column(db.Integer, primary_key=True)
    band_id = db.Column(db.Integer, db.ForeignKey('bands.id'), nullable=False)
    venue_id = db.Column(db.Integer, db.ForeignKey('venues.id'), nullable=False)
    
    gig_date = db.Column(db.Date, nullable=False, index=True)
    doors_time = db.Column(db.Time, nullable=True)
    start_time = db.Column(db.Time, nullable=True)
    end_time = db.Column(db.Time, nullable=True)
    
    ticket_price = db.Column(db.Float, nullable=True)
    ticket_url = db.Column(db.String(500), nullable=True)
    
    status = db.Column(db.String(20), default='scheduled', nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Minimal other models for API compatibility
class BandMember(db.Model):
    __tablename__ = 'band_members'
    
    id = db.Column(db.Integer, primary_key=True)
    band_id = db.Column(db.Integer, db.ForeignKey('bands.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='member')
    instrument = db.Column(db.String(100), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    joined_date = db.Column(db.Date, nullable=True)
    left_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class BandReview(db.Model):
    __tablename__ = 'band_reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    band_id = db.Column(db.Integer, db.ForeignKey('bands.id'), nullable=False)
    reviewer_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    gig_id = db.Column(db.Integer, db.ForeignKey('gigs.id'), nullable=True)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class VenueReviewByBand(db.Model):
    __tablename__ = 'venue_reviews_by_bands'
    
    id = db.Column(db.Integer, primary_key=True)
    venue_id = db.Column(db.Integer, db.ForeignKey('venues.id'), nullable=False)
    band_id = db.Column(db.Integer, db.ForeignKey('bands.id'), nullable=False)
    reviewer_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    gig_id = db.Column(db.Integer, db.ForeignKey('gigs.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class BandFollower(db.Model):
    __tablename__ = 'band_followers'
    
    id = db.Column(db.Integer, primary_key=True)
    band_id = db.Column(db.Integer, db.ForeignKey('bands.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    notification_preferences = db.Column(JsonType, default={'new_gigs': True, 'new_releases': False, 'band_updates': True})
    followed_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('band_id', 'user_id', name='unique_band_follower'),)

class Setlist(db.Model):
    __tablename__ = 'setlists'
    
    id = db.Column(db.Integer, primary_key=True)
    gig_id = db.Column(db.Integer, db.ForeignKey('gigs.id'), nullable=False)
    band_id = db.Column(db.Integer, db.ForeignKey('bands.id'), nullable=False)
    songs = db.Column(JsonType, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    encore_songs = db.Column(JsonType, nullable=True)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class GigSupportingBand(db.Model):
    __tablename__ = 'gig_supporting_bands'
    
    id = db.Column(db.Integer, primary_key=True)
    gig_id = db.Column(db.Integer, db.ForeignKey('gigs.id'), nullable=False)
    band_id = db.Column(db.Integer, db.ForeignKey('bands.id'), nullable=False)
    performance_order = db.Column(db.Integer, nullable=False, default=1)
    is_headliner = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ReviewVote(db.Model):
    __tablename__ = 'review_votes'
    
    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, nullable=False)
    review_type = db.Column(db.String(20), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    vote_type = db.Column(db.String(10), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('review_id', 'review_type', 'user_id', name='unique_review_vote'),)
