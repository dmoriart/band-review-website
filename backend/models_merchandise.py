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
