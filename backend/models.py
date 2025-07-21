"""
BandVenueReview.ie - Database Models
SQLAlchemy models for the Irish live music venue review platform
"""

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import uuid

db = SQLAlchemy()

class User(db.Model):
    """Base user model for both bands and venue owners"""
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    user_type = db.Column(db.String(20), nullable=False)  # 'band' or 'venue'
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    website = db.Column(db.String(200), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    profile_image = db.Column(db.String(500), nullable=True)
    verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Convert user to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'email': self.email,
            'user_type': self.user_type,
            'name': self.name,
            'phone': self.phone,
            'website': self.website,
            'bio': self.bio,
            'profile_image': self.profile_image,
            'verified': self.verified,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Band(db.Model):
    """Band/Artist specific information"""
    __tablename__ = 'bands'
    
    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    genre = db.Column(db.String(100), nullable=True)
    member_count = db.Column(db.Integer, nullable=True)
    formation_year = db.Column(db.Integer, nullable=True)
    location = db.Column(db.String(100), nullable=True)  # City/County in Ireland
    social_links = db.Column(db.JSON, nullable=True)  # {"facebook": "", "instagram": "", etc}
    
    # Relationship
    user = db.relationship('User', backref='band_profile')
    reviews = db.relationship('Review', backref='band', lazy=True)

    def to_dict(self):
        user_data = self.user.to_dict() if self.user else {}
        return {
            **user_data,
            'id': self.id,
            'genre': self.genre,
            'member_count': self.member_count,
            'formation_year': self.formation_year,
            'location': self.location,
            'social_links': self.social_links,
            'review_count': len(self.reviews) if self.reviews else 0
        }

class Venue(db.Model):
    """Live music venues in Ireland"""
    __tablename__ = 'venues'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)  # Optional - for claimed venues
    name = db.Column(db.String(200), nullable=False)
    address = db.Column(db.String(500), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    county = db.Column(db.String(50), nullable=False)  # Irish counties
    eircode = db.Column(db.String(10), nullable=True)  # Irish postal code
    phone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    website = db.Column(db.String(200), nullable=True)
    capacity = db.Column(db.Integer, nullable=True)
    venue_type = db.Column(db.String(50), nullable=True)  # pub, theatre, arena, etc
    primary_genres = db.Column(db.JSON, nullable=True)  # ["rock", "folk", "traditional"]
    facilities = db.Column(db.JSON, nullable=True)  # ["sound_system", "lighting", "parking"]
    description = db.Column(db.Text, nullable=True)
    images = db.Column(db.JSON, nullable=True)  # Array of image URLs
    claimed = db.Column(db.Boolean, default=False)
    verified = db.Column(db.Boolean, default=False)
    average_rating = db.Column(db.Float, default=0.0)
    review_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='venue_profile')
    reviews = db.relationship('Review', backref='venue', lazy=True, cascade='all, delete-orphan')

    def update_rating(self):
        """Calculate and update average rating from reviews"""
        if self.reviews:
            total_rating = sum(review.overall_rating for review in self.reviews)
            self.average_rating = round(total_rating / len(self.reviews), 1)
            self.review_count = len(self.reviews)
        else:
            self.average_rating = 0.0
            self.review_count = 0

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'city': self.city,
            'county': self.county,
            'eircode': self.eircode,
            'phone': self.phone,
            'email': self.email,
            'website': self.website,
            'capacity': self.capacity,
            'venue_type': self.venue_type,
            'primary_genres': self.primary_genres,
            'facilities': self.facilities,
            'description': self.description,
            'images': self.images,
            'claimed': self.claimed,
            'verified': self.verified,
            'average_rating': self.average_rating,
            'review_count': self.review_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Review(db.Model):
    """Reviews left by bands about venues"""
    __tablename__ = 'reviews'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    band_id = db.Column(db.String(36), db.ForeignKey('bands.id'), nullable=False)
    venue_id = db.Column(db.String(36), db.ForeignKey('venues.id'), nullable=False)
    
    # Performance details
    performance_date = db.Column(db.Date, nullable=False)
    event_name = db.Column(db.String(200), nullable=True)
    audience_size = db.Column(db.String(50), nullable=True)  # "packed", "half-full", "sparse"
    
    # Ratings (1-5 scale)
    sound_quality = db.Column(db.Integer, nullable=False)  # Sound system quality
    hospitality = db.Column(db.Integer, nullable=False)    # Staff friendliness
    payment_promptness = db.Column(db.Integer, nullable=False)  # How quickly paid
    crowd_engagement = db.Column(db.Integer, nullable=False)   # Audience response
    facilities_rating = db.Column(db.Integer, nullable=False)  # Green room, parking, etc
    overall_rating = db.Column(db.Integer, nullable=False)     # Overall experience
    
    # Written review
    title = db.Column(db.String(200), nullable=False)
    review_text = db.Column(db.Text, nullable=False)
    pros = db.Column(db.Text, nullable=True)
    cons = db.Column(db.Text, nullable=True)
    
    # Recommendations
    would_return = db.Column(db.Boolean, nullable=False)
    recommended_for = db.Column(db.JSON, nullable=True)  # ["emerging_bands", "established_acts"]
    
    # Metadata
    verified_performance = db.Column(db.Boolean, default=False)  # Admin verified
    helpful_votes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'band_id': self.band_id,
            'venue_id': self.venue_id,
            'performance_date': self.performance_date.isoformat() if self.performance_date else None,
            'event_name': self.event_name,
            'audience_size': self.audience_size,
            'sound_quality': self.sound_quality,
            'hospitality': self.hospitality,
            'payment_promptness': self.payment_promptness,
            'crowd_engagement': self.crowd_engagement,
            'facilities_rating': self.facilities_rating,
            'overall_rating': self.overall_rating,
            'title': self.title,
            'review_text': self.review_text,
            'pros': self.pros,
            'cons': self.cons,
            'would_return': self.would_return,
            'recommended_for': self.recommended_for,
            'verified_performance': self.verified_performance,
            'helpful_votes': self.helpful_votes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'band_name': self.band.user.name if self.band and self.band.user else None
        }

# Association table for many-to-many relationship between venues and genres
venue_genres = db.Table('venue_genres',
    db.Column('venue_id', db.String(36), db.ForeignKey('venues.id'), primary_key=True),
    db.Column('genre_id', db.String(36), db.ForeignKey('genres.id'), primary_key=True)
)

class Genre(db.Model):
    """Music genres for categorizing venues and bands"""
    __tablename__ = 'genres'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description
        }
