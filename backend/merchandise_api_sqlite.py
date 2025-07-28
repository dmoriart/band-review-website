"""
SQLite-compatible merchandise API for production fallback
This ensures merchandise functionality works even when PostgreSQL fails
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json
import os

# Import SQLite models
from models_merchandise_sqlite import (
    db, User, Band, Venue, Review, Genre,
    ProductCategory, Product, Cart, CartItem, 
    Order, OrderItem, ProductReview, BandProfile
)

def create_app():
    """Create Flask app with SQLite merchandise functionality"""
    app = Flask(__name__)
    
    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bandvenuereview_merchandise.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # CORS configuration
    cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
    CORS(app, origins=cors_origins)
    
    db.init_app(app)
    
    return app

def seed_merchandise_data():
    """Seed the database with sample merchandise data"""
    try:
        # Create product categories
        categories = [
            {'name': 'T-Shirts', 'description': 'Band t-shirts and apparel'},
            {'name': 'CDs', 'description': 'Physical music albums'},
            {'name': 'Vinyl', 'description': 'Vinyl records and LPs'},
            {'name': 'Digital', 'description': 'Digital downloads'},
            {'name': 'Merchandise', 'description': 'Other band merchandise'}
        ]
        
        for cat_data in categories:
            if not ProductCategory.query.filter_by(name=cat_data['name']).first():
                category = ProductCategory(
                    name=cat_data['name'],
                    description=cat_data['description']
                )
                db.session.add(category)
        
        db.session.commit()
        
        # Create a sample band if none exists
        sample_band = Band.query.first()
        if not sample_band:
            # Create a user first
            user = User(
                email='testband@example.com',
                user_type='band',
                name='The Irish Rovers'
            )
            user.set_password('password123')
            db.session.add(user)
            db.session.flush()  # Get the user ID
            
            # Create the band
            sample_band = Band(
                user_id=user.id,
                genre='Folk',
                location='Dublin, Ireland',
                member_count=4,
                formation_year=2020
            )
            db.session.add(sample_band)
            db.session.commit()
        
        # Create sample products
        tshirt_category = ProductCategory.query.filter_by(name='T-Shirts').first()
        cd_category = ProductCategory.query.filter_by(name='CDs').first()
        digital_category = ProductCategory.query.filter_by(name='Digital').first()
        
        sample_products = [
            {
                'name': 'Band T-Shirt - Black',
                'description': 'Official band t-shirt in classic black with logo',
                'price': 25.00,
                'category_id': tshirt_category.id if tshirt_category else 1,
                'inventory_count': 50,
                'images': json.dumps(['https://via.placeholder.com/400x400/000000/FFFFFF?text=Band+T-Shirt']),
                'variants': json.dumps({'sizes': ['S', 'M', 'L', 'XL'], 'colors': ['Black']})
            },
            {
                'name': 'Latest Album - CD',
                'description': 'Our latest studio album on compact disc',
                'price': 15.00,
                'category_id': cd_category.id if cd_category else 2,
                'inventory_count': 100,
                'images': json.dumps(['https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Album+CD']),
                'variants': json.dumps({})
            },
            {
                'name': 'Digital Album Download',
                'description': 'High-quality digital download of our latest album',
                'price': 10.00,
                'category_id': digital_category.id if digital_category else 4,
                'inventory_count': 999,
                'images': json.dumps(['https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=Digital+Album']),
                'is_digital': True,
                'download_url': 'https://example.com/download/album',
                'variants': json.dumps({'formats': ['MP3', 'FLAC']})
            }
        ]
        
        for product_data in sample_products:
            if not Product.query.filter_by(name=product_data['name']).first():
                product = Product(
                    band_id=sample_band.id,
                    **product_data
                )
                db.session.add(product)
        
        db.session.commit()
        print("✅ Merchandise data seeded successfully")
        
    except Exception as e:
        print(f"❌ Error seeding merchandise data: {str(e)}")
        db.session.rollback()

def register_routes(app):
    """Register merchandise API routes"""
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        try:
            venue_count = Venue.query.count()
            product_count = Product.query.count()
            return jsonify({
                'status': 'healthy',
                'service': 'BandVenueReview.ie API',
                'version': '1.0.3',  # Updated version with merchandise
                'database': 'sqlite',
                'cors_enabled': True,
                'timestamp': datetime.utcnow().isoformat(),
                'venues': venue_count,
                'products': product_count
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }), 500
    
    @app.route('/api/products', methods=['GET'])
    def get_products():
        """Get all products with filtering"""
        try:
            # Get query parameters
            category = request.args.get('category')
            band_id = request.args.get('band_id')
            search = request.args.get('search')
            min_price = request.args.get('min_price', type=float)
            max_price = request.args.get('max_price', type=float)
            sort_by = request.args.get('sort_by', 'created_at')
            sort_order = request.args.get('sort_order', 'desc')
            
            # Build query
            query = Product.query.filter_by(is_active=True)
            
            if category:
                category_obj = ProductCategory.query.filter_by(name=category).first()
                if category_obj:
                    query = query.filter_by(category_id=category_obj.id)
            
            if band_id:
                query = query.filter_by(band_id=band_id)
            
            if search:
                query = query.filter(Product.name.contains(search))
            
            if min_price is not None:
                query = query.filter(Product.price >= min_price)
            
            if max_price is not None:
                query = query.filter(Product.price <= max_price)
            
            # Apply sorting
            if sort_by == 'price':
                if sort_order == 'asc':
                    query = query.order_by(Product.price.asc())
                else:
                    query = query.order_by(Product.price.desc())
            elif sort_by == 'name':
                if sort_order == 'asc':
                    query = query.order_by(Product.name.asc())
                else:
                    query = query.order_by(Product.name.desc())
            else:  # created_at
                if sort_order == 'asc':
                    query = query.order_by(Product.created_at.asc())
                else:
                    query = query.order_by(Product.created_at.desc())
            
            products = query.all()
            
            return jsonify({
                'products': [product.to_dict() for product in products],
                'total': len(products)
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/products/<int:product_id>', methods=['GET'])
    def get_product(product_id):
        """Get a specific product"""
        try:
            product = Product.query.get_or_404(product_id)
            return jsonify(product.to_dict())
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/categories', methods=['GET'])
    def get_categories():
        """Get all product categories"""
        try:
            categories = ProductCategory.query.all()
            return jsonify({
                'categories': [category.to_dict() for category in categories]
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/bands', methods=['GET'])
    def get_bands():
        """Get all bands with products"""
        try:
            # Get bands that have products
            bands_with_products = db.session.query(Band).join(Product).distinct().all()
            
            return jsonify({
                'bands': [band.to_dict() for band in bands_with_products]
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/cart', methods=['POST'])
    def add_to_cart():
        """Add item to cart"""
        try:
            data = request.get_json()
            product_id = data.get('product_id')
            quantity = data.get('quantity', 1)
            session_id = data.get('session_id')
            
            if not product_id:
                return jsonify({'error': 'Product ID is required'}), 400
            
            # Find or create cart
            cart = Cart.query.filter_by(session_id=session_id).first()
            if not cart:
                cart = Cart(session_id=session_id)
                db.session.add(cart)
                db.session.flush()
            
            # Check if item already in cart
            cart_item = CartItem.query.filter_by(
                cart_id=cart.id,
                product_id=product_id
            ).first()
            
            if cart_item:
                cart_item.quantity += quantity
            else:
                cart_item = CartItem(
                    cart_id=cart.id,
                    product_id=product_id,
                    quantity=quantity,
                    selected_variant=json.dumps(data.get('variant', {}))
                )
                db.session.add(cart_item)
            
            db.session.commit()
            
            return jsonify({
                'message': 'Item added to cart',
                'cart': cart.to_dict()
            })
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/cart/<session_id>', methods=['GET'])
    def get_cart(session_id):
        """Get cart contents"""
        try:
            cart = Cart.query.filter_by(session_id=session_id).first()
            if not cart:
                return jsonify({'cart': {'items': [], 'total': 0}})
            
            return jsonify({'cart': cart.to_dict()})
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/venues', methods=['GET'])
    def get_venues():
        """Get all venues (existing functionality)"""
        try:
            venues = Venue.query.all()
            return jsonify({
                'venues': [venue.to_dict() for venue in venues]
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app = create_app()
    
    with app.app_context():
        # Create tables
        db.create_all()
        
        # Seed data if empty
        if Product.query.count() == 0:
            seed_merchandise_data()
    
    # Register routes
    register_routes(app)
    
    # Run the app
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
