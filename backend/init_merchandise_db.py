#!/usr/bin/env python3
"""
Initialize Merchandise Database
Creates tables and seeds sample data for the merchandise store
"""

import os
import sys
from flask import Flask
from config import config, build_database_url
from models import db
from models_merchandise import (
    ProductCategory, Product, Cart, CartItem, 
    Order, OrderItem, ProductReview, BandProfile
)
from merchandise_api_simple import seed_merchandise_data

def create_app():
    """Create Flask app for database initialization"""
    app = Flask(__name__)
    
    # Load configuration
    config_name = os.environ.get('FLASK_CONFIG', 'development')
    app.config.from_object(config[config_name])
    
    # Override database URL with our new function
    db_url = build_database_url()
    if db_url:
        app.config['SQLALCHEMY_DATABASE_URI'] = db_url
        print(f"✅ Using individual DB parameters")
    else:
        print(f"✅ Using DATABASE_URL or SQLite fallback")
    
    print(f"📊 Database URL: {app.config['SQLALCHEMY_DATABASE_URI'][:50]}...")
    
    # Initialize extensions
    db.init_app(app)
    
    return app

def init_merchandise_database():
    """Initialize the merchandise database"""
    print("🚀 Initializing Merchandise Database")
    print("=" * 50)
    
    app = create_app()
    
    with app.app_context():
        try:
            # Test database connection
            print("\n🔍 Testing database connection...")
            with db.engine.connect() as connection:
                connection.execute(db.text('SELECT 1'))
            print("✅ Database connection successful")
            
            # Create all tables
            print("\n📋 Creating database tables...")
            db.create_all()
            print("✅ All tables created successfully")
            
            # Check if merchandise tables exist and have data
            print("\n🔍 Checking existing data...")
            
            category_count = ProductCategory.query.count()
            product_count = Product.query.count()
            
            print(f"   Categories: {category_count}")
            print(f"   Products: {product_count}")
            
            if category_count == 0 or product_count == 0:
                print("\n🌱 Seeding merchandise data...")
                seed_merchandise_data()
                
                # Verify seeding
                category_count = ProductCategory.query.count()
                product_count = Product.query.count()
                
                print(f"✅ Seeding complete:")
                print(f"   Categories: {category_count}")
                print(f"   Products: {product_count}")
            else:
                print("✅ Data already exists, skipping seeding")
            
            # Test API endpoints
            print("\n🧪 Testing merchandise API...")
            
            # Test categories
            categories = ProductCategory.query.all()
            print(f"   Found {len(categories)} categories:")
            for cat in categories:
                print(f"     - {cat.name} ({cat.id})")
            
            # Test products
            products = Product.query.filter(Product.is_active == True).limit(3).all()
            print(f"   Found {len(products)} active products (showing first 3):")
            for prod in products:
                print(f"     - {prod.title} (€{prod.price})")
            
            print("\n" + "=" * 50)
            print("🎉 Merchandise database initialization complete!")
            print("\n💡 You can now:")
            print("   1. Start your Flask server")
            print("   2. Visit /api/products to see products")
            print("   3. Visit /api/products/categories to see categories")
            
            return True
            
        except Exception as e:
            print(f"\n❌ Database initialization failed: {e}")
            import traceback
            traceback.print_exc()
            return False

def test_merchandise_api():
    """Test the merchandise API endpoints"""
    print("\n🧪 Testing Merchandise API Endpoints")
    print("=" * 50)
    
    app = create_app()
    
    with app.app_context():
        try:
            # Import the blueprint
            from merchandise_api_simple import merchandise_bp
            
            # Test products endpoint logic
            print("\n1. Testing products query...")
            products = Product.query.filter(Product.is_active == True).all()
            print(f"   Found {len(products)} active products")
            
            if products:
                sample_product = products[0]
                category_obj = ProductCategory.query.get(sample_product.category)
                print(f"   Sample product: {sample_product.title}")
                print(f"   Category: {category_obj.name if category_obj else 'Unknown'}")
                print(f"   Price: €{sample_product.price}")
                print(f"   In stock: {sample_product.in_stock}")
            
            # Test categories endpoint logic
            print("\n2. Testing categories query...")
            categories = ProductCategory.query.order_by(ProductCategory.sort_order).all()
            print(f"   Found {len(categories)} categories")
            
            for cat in categories:
                product_count = Product.query.filter_by(category=cat.id, is_active=True).count()
                print(f"   - {cat.name}: {product_count} products")
            
            print("\n✅ API endpoint tests completed successfully")
            return True
            
        except Exception as e:
            print(f"\n❌ API testing failed: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    success = init_merchandise_database()
    
    if success:
        test_success = test_merchandise_api()
        if test_success:
            print("\n🎯 All tests passed! Your merchandise store is ready.")
            sys.exit(0)
        else:
            print("\n⚠️  Database initialized but API tests failed.")
            sys.exit(1)
    else:
        print("\n💥 Database initialization failed.")
        sys.exit(1)
