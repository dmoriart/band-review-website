#!/usr/bin/env python3
"""
Test Merchandise API
Quick test to verify the merchandise API is working
"""

import os
import sys
import requests
import json
from flask import Flask
from config import config, build_database_url
from models import db
from models_merchandise import ProductCategory, Product
from merchandise_api_simple import merchandise_bp

def create_test_app():
    """Create Flask app for testing"""
    app = Flask(__name__)
    
    # Load configuration
    config_name = os.environ.get('FLASK_CONFIG', 'development')
    app.config.from_object(config[config_name])
    
    # Override database URL with our new function
    db_url = build_database_url()
    if db_url:
        app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    
    # Initialize extensions
    db.init_app(app)
    
    # Register blueprint
    app.register_blueprint(merchandise_bp, url_prefix='/api')
    
    return app

def test_api_directly():
    """Test the API directly without HTTP requests"""
    print("🧪 Testing Merchandise API Directly")
    print("=" * 50)
    
    app = create_test_app()
    
    with app.app_context():
        try:
            # Test database connection
            print("\n1. Testing database connection...")
            category_count = ProductCategory.query.count()
            product_count = Product.query.count()
            print(f"   Categories: {category_count}")
            print(f"   Products: {product_count}")
            
            if product_count == 0:
                print("   ❌ No products found! Run init_merchandise_db.py first")
                return False
            
            # Test products query
            print("\n2. Testing products query...")
            products = Product.query.filter(Product.is_active == True).all()
            print(f"   Found {len(products)} active products:")
            
            for prod in products:
                category_obj = ProductCategory.query.filter_by(id=prod.category).first()
                print(f"     - {prod.title} (€{prod.price}) - {category_obj.name if category_obj else 'Unknown'}")
            
            # Test categories query
            print("\n3. Testing categories query...")
            categories = ProductCategory.query.order_by(ProductCategory.sort_order).all()
            print(f"   Found {len(categories)} categories:")
            
            for cat in categories:
                product_count = Product.query.filter_by(category=cat.id, is_active=True).count()
                print(f"     - {cat.name} ({cat.id}): {product_count} products")
            
            print("\n✅ Direct API tests completed successfully")
            return True
            
        except Exception as e:
            print(f"\n❌ Direct API testing failed: {e}")
            import traceback
            traceback.print_exc()
            return False

def test_with_test_client():
    """Test using Flask test client"""
    print("\n🧪 Testing with Flask Test Client")
    print("=" * 50)
    
    app = create_test_app()
    
    with app.test_client() as client:
        try:
            # Test health endpoint
            print("\n1. Testing health endpoint...")
            response = client.get('/api/health')
            if response.status_code == 200:
                print("   ✅ Health endpoint working")
            else:
                print(f"   ❌ Health endpoint failed: {response.status_code}")
            
            # Test products endpoint
            print("\n2. Testing products endpoint...")
            response = client.get('/api/products')
            print(f"   Status code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.get_json()
                products = data.get('products', [])
                print(f"   ✅ Products endpoint working - found {len(products)} products")
                
                if products:
                    sample_product = products[0]
                    print(f"   Sample product: {sample_product['title']} - €{sample_product['price']}")
            else:
                print(f"   ❌ Products endpoint failed: {response.status_code}")
                print(f"   Response: {response.get_data(as_text=True)}")
            
            # Test categories endpoint
            print("\n3. Testing categories endpoint...")
            response = client.get('/api/products/categories')
            print(f"   Status code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.get_json()
                categories = data.get('categories', [])
                print(f"   ✅ Categories endpoint working - found {len(categories)} categories")
                
                if categories:
                    for cat in categories[:3]:  # Show first 3
                        print(f"     - {cat['name']} ({cat['id']})")
            else:
                print(f"   ❌ Categories endpoint failed: {response.status_code}")
                print(f"   Response: {response.get_data(as_text=True)}")
            
            print("\n✅ Test client tests completed")
            return True
            
        except Exception as e:
            print(f"\n❌ Test client testing failed: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    print("🚀 Starting Merchandise API Tests")
    print("=" * 60)
    
    # Test 1: Direct database/API testing
    direct_success = test_api_directly()
    
    # Test 2: Flask test client
    if direct_success:
        client_success = test_with_test_client()
        
        if client_success:
            print("\n" + "=" * 60)
            print("🎉 ALL TESTS PASSED!")
            print("\n💡 Your merchandise API is working correctly.")
            print("   The store page should now load products properly.")
            print("\n🔗 API Endpoints:")
            print("   GET /api/products - List all products")
            print("   GET /api/products/categories - List all categories")
            print("   GET /api/products/<id> - Get specific product")
            sys.exit(0)
        else:
            print("\n⚠️  Direct tests passed but test client failed.")
            sys.exit(1)
    else:
        print("\n💥 Direct API tests failed.")
        sys.exit(1)
