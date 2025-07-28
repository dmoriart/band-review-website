"""
SQLite-compatible merchandise models for production fallback
This ensures merchandise functionality works even when PostgreSQL fails
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    user_type = db.Column(db.String(20), nullable=False)  # 'band' or 'venue_owner'
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    website = db.Column(db.String(200))
    bio = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'user_type': self.user_type,
            'name': self.name,
            'phone': self.phone,
            'website': self.website,
            'bio': self.bio,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Band(db.Model):
    __tablename__ = 'bands'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    genre = db.Column(db.String(50))
    location = db.Column(db.String(100))
    member_count = db.Column(db.Integer)
    formation_year = db.Column(db.Integer)
    
    user = db.relationship('User', backref='band_profile')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.user.name if self.user else None,
            'genre': self.genre,
            'location': self.location,
            'member_count': self.member_count,
            'formation_year': self.formation_year
        }

class Venue(db.Model):
    __tablename__ = 'venues'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(200))
    city = db.Column(db.String(50))
    county = db.Column(db.String(50))
    eircode = db.Column(db.String(10))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    website = db.Column(db.String(200))
    capacity = db.Column(db.Integer)
    venue_type = db.Column(db.String(50))
    primary_genres = db.Column(db.Text)  # JSON string
    facilities = db.Column(db.Text)  # JSON string
    description = db.Column(db.Text)
    average_rating = db.Column(db.Float, default=0.0)
    total_reviews = db.Column(db.Integer, default=0)
    claimed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'city': self.city,
            'county': self.county,
            'capacity': self.capacity,
            'venue_type': self.venue_type,
            'average_rating': self.average_rating,
            'total_reviews': self.total_reviews
        }

class Review(db.Model):
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    band_id = db.Column(db.Integer, db.ForeignKey('bands.id'), nullable=False)
    venue_id = db.Column(db.Integer, db.ForeignKey('venues.id'), nullable=False)
    overall_rating = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    review_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'band_id': self.band_id,
            'venue_id': self.venue_id,
            'overall_rating': self.overall_rating,
            'title': self.title,
            'review_text': self.review_text,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Genre(db.Model):
    __tablename__ = 'genres'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description
        }

# Merchandise Models
class ProductCategory(db.Model):
    __tablename__ = 'product_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description
        }

class BandProfile(db.Model):
    __tablename__ = 'band_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    band_id = db.Column(db.Integer, db.ForeignKey('bands.id'), nullable=False)
    store_name = db.Column(db.String(100))
    store_description = db.Column(db.Text)
    stripe_account_id = db.Column(db.String(100))
    commission_rate = db.Column(db.Float, default=0.10)  # 10% default
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    band = db.relationship('Band', backref='profile')
    
    def to_dict(self):
        return {
            'id': self.id,
            'band_id': self.band_id,
            'store_name': self.store_name,
            'store_description': self.store_description,
            'commission_rate': self.commission_rate,
            'is_active': self.is_active
        }

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    band_id = db.Column(db.Integer, db.ForeignKey('bands.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('product_categories.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='EUR')
    inventory_count = db.Column(db.Integer, default=0)
    images = db.Column(db.Text)  # JSON string of image URLs
    is_digital = db.Column(db.Boolean, default=False)
    download_url = db.Column(db.String(500))  # For digital products
    variants = db.Column(db.Text)  # JSON string for sizes, colors, etc.
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    band = db.relationship('Band', backref='products')
    category = db.relationship('ProductCategory', backref='products')
    
    def to_dict(self):
        return {
            'id': self.id,
            'band_id': self.band_id,
            'category_id': self.category_id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'currency': self.currency,
            'inventory_count': self.inventory_count,
            'images': json.loads(self.images) if self.images else [],
            'is_digital': self.is_digital,
            'variants': json.loads(self.variants) if self.variants else {},
            'is_active': self.is_active,
            'band_name': self.band.user.name if self.band and self.band.user else None,
            'category_name': self.category.name if self.category else None
        }

class Cart(db.Model):
    __tablename__ = 'carts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    session_id = db.Column(db.String(100))  # For guest users
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'items': [item.to_dict() for item in self.items]
        }

class CartItem(db.Model):
    __tablename__ = 'cart_items'
    
    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey('carts.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    selected_variant = db.Column(db.Text)  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    cart = db.relationship('Cart', backref='items')
    product = db.relationship('Product', backref='cart_items')
    
    def to_dict(self):
        return {
            'id': self.id,
            'cart_id': self.cart_id,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'selected_variant': json.loads(self.selected_variant) if self.selected_variant else {},
            'product': self.product.to_dict() if self.product else None
        }

class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    customer_email = db.Column(db.String(120), nullable=False)
    customer_name = db.Column(db.String(100))
    shipping_address = db.Column(db.Text)
    total_amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='EUR')
    status = db.Column(db.String(20), default='pending')  # pending, paid, shipped, delivered, cancelled
    stripe_payment_intent_id = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'customer_email': self.customer_email,
            'customer_name': self.customer_name,
            'total_amount': self.total_amount,
            'currency': self.currency,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'items': [item.to_dict() for item in self.items]
        }

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    band_id = db.Column(db.Integer, db.ForeignKey('bands.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    selected_variant = db.Column(db.Text)  # JSON string
    
    order = db.relationship('Order', backref='items')
    product = db.relationship('Product', backref='order_items')
    band = db.relationship('Band', backref='order_items')
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'product_id': self.product_id,
            'band_id': self.band_id,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'selected_variant': json.loads(self.selected_variant) if self.selected_variant else {},
            'product': self.product.to_dict() if self.product else None
        }

class ProductReview(db.Model):
    __tablename__ = 'product_reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    customer_name = db.Column(db.String(100))
    customer_email = db.Column(db.String(120))
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    title = db.Column(db.String(200))
    review_text = db.Column(db.Text)
    is_verified_purchase = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    product = db.relationship('Product', backref='reviews')
    user = db.relationship('User', backref='product_reviews')
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'customer_name': self.customer_name,
            'rating': self.rating,
            'title': self.title,
            'review_text': self.review_text,
            'is_verified_purchase': self.is_verified_purchase,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
