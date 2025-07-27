"""
Merchandise Store API Blueprint for Flask
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models_merchandise import (
    db, Product, ProductCategory, Cart, CartItem, 
    Order, OrderItem, ProductReview, BandProfile
)
import uuid
import json
from datetime import datetime

merchandise_bp = Blueprint('merchandise', __name__)

def generate_id():
    """Generate a unique ID"""
    return str(uuid.uuid4())

@merchandise_bp.route('/products', methods=['GET'])
def get_products():
    """Get products with filtering and pagination"""
    try:
        # Get query parameters
        category = request.args.get('category')
        search = request.args.get('search')
        sort = request.args.get('sort', 'newest')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        featured = request.args.get('featured', type=bool)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Build query
        query = Product.query.filter(Product.is_active == True)
        
        # Apply filters
        if category:
            query = query.filter(Product.category == category)
        
        if search:
            query = query.filter(
                Product.title.ilike(f'%{search}%') |
                Product.description.ilike(f'%{search}%')
            )
        
        if min_price is not None:
            query = query.filter(Product.price >= min_price)
        
        if max_price is not None:
            query = query.filter(Product.price <= max_price)
        
        if featured:
            query = query.filter(Product.is_featured == True)
        
        # Apply sorting
        if sort == 'price_low':
            query = query.order_by(Product.price.asc())
        elif sort == 'price_high':
            query = query.order_by(Product.price.desc())
        elif sort == 'popular':
            # Sort by number of reviews (popularity proxy)
            query = query.outerjoin(ProductReview).group_by(Product.id).order_by(
                db.func.count(ProductReview.id).desc()
            )
        elif sort == 'rating':
            # Sort by average rating
            query = query.outerjoin(ProductReview).group_by(Product.id).order_by(
                db.func.avg(ProductReview.rating).desc().nullslast()
            )
        else:  # newest
            query = query.order_by(Product.created_at.desc())
        
        # Paginate
        products = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Format response
        products_data = []
        for product in products.items:
            category_obj = ProductCategory.query.get(product.category)
            products_data.append({
                'id': product.id,
                'band_id': product.band_id,
                'title': product.title,
                'description': product.description,
                'price': float(product.price),
                'category': product.category,
                'category_name': category_obj.name if category_obj else product.category,
                'inventory_count': product.inventory_count,
                'images': product.images_list,
                'variants': product.variants_dict,
                'digital_file_url': product.digital_file_url,
                'is_active': product.is_active,
                'is_featured': product.is_featured,
                'weight_grams': product.weight_grams,
                'tags': product.tags_list,
                'seo_slug': product.seo_slug,
                'created_at': product.created_at.isoformat(),
                'average_rating': product.average_rating,
                'review_count': product.review_count,
                'in_stock': product.in_stock
            })
        
        return jsonify({
            'products': products_data,
            'pagination': {
                'page': products.page,
                'pages': products.pages,
                'per_page': products.per_page,
                'total': products.total,
                'has_next': products.has_next,
                'has_prev': products.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@merchandise_bp.route('/products/categories', methods=['GET'])
def get_categories():
    """Get all product categories"""
    try:
        categories = ProductCategory.query.order_by(ProductCategory.sort_order).all()
        
        categories_data = []
        for category in categories:
            categories_data.append({
                'id': category.id,
                'name': category.name,
                'description': category.description,
                'sort_order': category.sort_order,
                'created_at': category.created_at.isoformat()
            })
        
        return jsonify({'categories': categories_data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@merchandise_bp.route('/products/<product_id>', methods=['GET'])
def get_product(product_id):
    """Get a single product by ID"""
    try:
        product = Product.query.get_or_404(product_id)
        category_obj = ProductCategory.query.get(product.category)
        
        product_data = {
            'id': product.id,
            'band_id': product.band_id,
            'title': product.title,
            'description': product.description,
            'price': float(product.price),
            'category': product.category,
            'category_name': category_obj.name if category_obj else product.category,
            'inventory_count': product.inventory_count,
            'images': product.images_list,
            'variants': product.variants_dict,
            'digital_file_url': product.digital_file_url,
            'is_active': product.is_active,
            'is_featured': product.is_featured,
            'weight_grams': product.weight_grams,
            'tags': product.tags_list,
            'seo_slug': product.seo_slug,
            'created_at': product.created_at.isoformat(),
            'average_rating': product.average_rating,
            'review_count': product.review_count,
            'in_stock': product.in_stock
        }
        
        return jsonify({'product': product_data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@merchandise_bp.route('/cart/add', methods=['POST'])
@jwt_required()
def add_to_cart():
    """Add item to cart"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        variant_selection = data.get('variant_selection', {})
        
        if not product_id:
            return jsonify({'error': 'Product ID is required'}), 400
        
        # Check if product exists
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Get or create cart for user
        cart = Cart.query.filter_by(user_id=user_id).first()
        if not cart:
            cart = Cart(
                id=generate_id(),
                user_id=user_id
            )
            db.session.add(cart)
        
        # Check if item already exists in cart
        existing_item = CartItem.query.filter_by(
            cart_id=cart.id,
            product_id=product_id,
            variant_selection=json.dumps(variant_selection, sort_keys=True)
        ).first()
        
        if existing_item:
            existing_item.quantity += quantity
        else:
            cart_item = CartItem(
                id=generate_id(),
                cart_id=cart.id,
                product_id=product_id,
                quantity=quantity,
                variant_selection=json.dumps(variant_selection)
            )
            db.session.add(cart_item)
        
        db.session.commit()
        
        return jsonify({'message': 'Item added to cart successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@merchandise_bp.route('/cart', methods=['GET'])
@jwt_required()
def get_cart():
    """Get user's cart"""
    try:
        user_id = get_jwt_identity()
        
        cart = Cart.query.filter_by(user_id=user_id).first()
        if not cart:
            return jsonify({'cart': {'items': [], 'total': 0}})
        
        cart_items = []
        total = 0
        
        for item in cart.items:
            product = item.product
            item_total = float(product.price) * item.quantity
            total += item_total
            
            cart_items.append({
                'id': item.id,
                'product_id': item.product_id,
                'quantity': item.quantity,
                'variant_selection': item.variant_selection_dict,
                'product': {
                    'id': product.id,
                    'title': product.title,
                    'price': float(product.price),
                    'images': product.images_list,
                    'category': product.category
                },
                'item_total': item_total
            })
        
        return jsonify({
            'cart': {
                'id': cart.id,
                'items': cart_items,
                'total': total,
                'item_count': len(cart_items)
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def seed_merchandise_data():
    """Seed the database with sample merchandise data"""
    try:
        # Create categories
        categories_data = [
            {'id': 'cd', 'name': 'CDs', 'description': 'Compact Discs', 'sort_order': 1},
            {'id': 'vinyl', 'name': 'Vinyl Records', 'description': 'Vinyl LPs and Singles', 'sort_order': 2},
            {'id': 'tshirt', 'name': 'T-Shirts', 'description': 'Band T-Shirts', 'sort_order': 3},
            {'id': 'hoodie', 'name': 'Hoodies', 'description': 'Hooded Sweatshirts', 'sort_order': 4},
            {'id': 'poster', 'name': 'Posters', 'description': 'Band Posters and Prints', 'sort_order': 5},
            {'id': 'sticker', 'name': 'Stickers', 'description': 'Band Stickers', 'sort_order': 6},
            {'id': 'digital', 'name': 'Digital Downloads', 'description': 'Digital Music Downloads', 'sort_order': 7}
        ]
        
        for cat_data in categories_data:
            if not ProductCategory.query.get(cat_data['id']):
                category = ProductCategory(**cat_data)
                db.session.add(category)
        
        # Create sample products
        products_data = [
            {
                'id': generate_id(),
                'band_id': 'sample_band_1',
                'title': 'Band T-Shirt - Black',
                'description': 'Official band t-shirt in classic black with logo print',
                'price': 25.00,
                'category': 'tshirt',
                'inventory_count': 50,
                'images': json.dumps([]),
                'variants': json.dumps({'sizes': ['S', 'M', 'L', 'XL'], 'colors': ['Black']}),
                'is_active': True,
                'is_featured': True,
                'weight_grams': 200,
                'tags': json.dumps(['apparel', 'cotton', 'unisex']),
                'seo_slug': 'band-tshirt-black'
            },
            {
                'id': generate_id(),
                'band_id': 'sample_band_1',
                'title': 'Latest Album - CD',
                'description': 'Our latest studio album on compact disc',
                'price': 15.00,
                'category': 'cd',
                'inventory_count': 100,
                'images': json.dumps([]),
                'variants': json.dumps({}),
                'is_active': True,
                'is_featured': False,
                'weight_grams': 100,
                'tags': json.dumps(['music', 'album', 'cd']),
                'seo_slug': 'latest-album-cd'
            },
            {
                'id': generate_id(),
                'band_id': 'sample_band_1',
                'title': 'Digital Album Download',
                'description': 'High-quality digital download of our latest album',
                'price': 10.00,
                'category': 'digital',
                'inventory_count': 999,
                'images': json.dumps([]),
                'variants': json.dumps({'formats': ['MP3', 'FLAC']}),
                'is_active': True,
                'is_featured': True,
                'weight_grams': 0,
                'tags': json.dumps(['digital', 'music', 'download']),
                'seo_slug': 'digital-album-download'
            }
        ]
        
        for prod_data in products_data:
            if not Product.query.get(prod_data['id']):
                product = Product(**prod_data)
                db.session.add(product)
        
        db.session.commit()
        print("✅ Merchandise data seeded successfully")
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Merchandise seeding failed: {e}")
