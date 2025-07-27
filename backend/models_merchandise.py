"""
Merchandise Store Models for Flask SQLAlchemy
"""

from models import db
from datetime import datetime
import json

class ProductCategory(db.Model):
    __tablename__ = 'product_categories'
    
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    products = db.relationship('Product', backref='category_obj', lazy=True)

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.String(50), primary_key=True)
    band_id = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    category = db.Column(db.String(50), db.ForeignKey('product_categories.id'), nullable=False)
    inventory_count = db.Column(db.Integer, default=0)
    images = db.Column(db.Text)  # JSON array of image URLs
    variants = db.Column(db.Text)  # JSON object for variants
    digital_file_url = db.Column(db.String(500))
    is_active = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    weight_grams = db.Column(db.Integer, default=0)
    tags = db.Column(db.Text)  # JSON array of tags
    seo_slug = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    cart_items = db.relationship('CartItem', backref='product', lazy=True)
    order_items = db.relationship('OrderItem', backref='product', lazy=True)
    reviews = db.relationship('ProductReview', backref='product', lazy=True)
    
    @property
    def images_list(self):
        """Return images as a list"""
        if self.images:
            try:
                return json.loads(self.images)
            except:
                return []
        return []
    
    @property
    def variants_dict(self):
        """Return variants as a dictionary"""
        if self.variants:
            try:
                return json.loads(self.variants)
            except:
                return {}
        return {}
    
    @property
    def tags_list(self):
        """Return tags as a list"""
        if self.tags:
            try:
                return json.loads(self.tags)
            except:
                return []
        return []
    
    @property
    def in_stock(self):
        """Check if product is in stock"""
        return self.inventory_count > 0 or self.category == 'digital'
    
    @property
    def average_rating(self):
        """Calculate average rating from reviews"""
        if self.reviews:
            total = sum(review.rating for review in self.reviews)
            return round(total / len(self.reviews), 1)
        return 0
    
    @property
    def review_count(self):
        """Get number of reviews"""
        return len(self.reviews)

class Cart(db.Model):
    __tablename__ = 'carts'
    
    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    items = db.relationship('CartItem', backref='cart', lazy=True, cascade='all, delete-orphan')

class CartItem(db.Model):
    __tablename__ = 'cart_items'
    
    id = db.Column(db.String(50), primary_key=True)
    cart_id = db.Column(db.String(50), db.ForeignKey('carts.id'), nullable=False)
    product_id = db.Column(db.String(50), db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    variant_selection = db.Column(db.Text)  # JSON object for selected variants
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    @property
    def variant_selection_dict(self):
        """Return variant selection as a dictionary"""
        if self.variant_selection:
            try:
                return json.loads(self.variant_selection)
            except:
                return {}
        return {}

class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.String(100), nullable=False)
    customer_email = db.Column(db.String(200), nullable=False)
    customer_name = db.Column(db.String(200))
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), default='EUR')
    status = db.Column(db.String(50), default='pending')
    stripe_payment_intent_id = db.Column(db.String(200))
    shipping_address = db.Column(db.Text)  # JSON object
    billing_address = db.Column(db.Text)   # JSON object
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.String(50), primary_key=True)
    order_id = db.Column(db.String(50), db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.String(50), db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    total_price = db.Column(db.Numeric(10, 2), nullable=False)
    variant_selection = db.Column(db.Text)  # JSON object
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ProductReview(db.Model):
    __tablename__ = 'product_reviews'
    
    id = db.Column(db.String(50), primary_key=True)
    product_id = db.Column(db.String(50), db.ForeignKey('products.id'), nullable=False)
    user_id = db.Column(db.String(100), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    review_text = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class BandProfile(db.Model):
    __tablename__ = 'band_profiles'
    
    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.String(100), nullable=False)
    band_name = db.Column(db.String(200), nullable=False)
    bio = db.Column(db.Text)
    avatar_url = db.Column(db.String(500))
    stripe_account_id = db.Column(db.String(200))
    commission_rate = db.Column(db.Numeric(5, 2), default=10.0)  # Platform commission %
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
