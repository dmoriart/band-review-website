"""
BandVenueReview.ie - Render Deployment Version
Simplified Flask app optimized for Render deployment with robust error handling
Version: 1.1.0 - Render optimized
"""

import os
import sys
import logging
from datetime import datetime, date
from flask import Flask, jsonify, request
from flask_cors import CORS

# Configure logging for Render
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def create_app():
    """Create Flask app with minimal dependencies for Render"""
    app = Flask(__name__)
    
    # Basic configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'render-secret-key')
    app.config['DEBUG'] = False
    
    # CORS configuration
    cors_origins = os.environ.get('CORS_ORIGINS', 'https://bandvenuereview.netlify.app').split(',')
    CORS(app, origins=cors_origins)
    
    logger.info(f"Flask app created with CORS origins: {cors_origins}")
    
    return app

# Create Flask app
app = create_app()

# Test database connection function
def test_database_connection():
    """Test database connection with detailed logging - tries both psycopg3 and psycopg2"""
    # Get database parameters
    db_host = os.environ.get('DB_HOST')
    db_port = os.environ.get('DB_PORT', '5432')
    db_name = os.environ.get('DB_NAME')
    db_user = os.environ.get('DB_USER')
    db_password = os.environ.get('DB_PASSWORD')
    db_sslmode = os.environ.get('DB_SSLMODE', 'require')
    
    logger.info(f"Attempting database connection to {db_host}:{db_port}/{db_name}")
    
    if not all([db_host, db_name, db_user, db_password]):
        missing = [k for k, v in {
            'DB_HOST': db_host,
            'DB_NAME': db_name, 
            'DB_USER': db_user,
            'DB_PASSWORD': db_password
        }.items() if not v]
        logger.error(f"Missing database environment variables: {missing}")
        return False, f"Missing variables: {missing}"
    
    # Try psycopg3 first
    try:
        import psycopg
        logger.info("Using psycopg3 for database connection")
        
        # Build connection string for psycopg3
        conn_string = f"host={db_host} port={db_port} dbname={db_name} user={db_user} password={db_password} sslmode={db_sslmode} connect_timeout=10"
        
        # Test connection
        with psycopg.connect(conn_string) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT version();")
                db_version = cur.fetchone()
        
        logger.info(f"Database connection successful with psycopg3: {db_version[0][:50]}...")
        return True, "Connected successfully with psycopg3"
        
    except ImportError:
        logger.info("psycopg3 not available, trying psycopg2...")
        
        # Fallback to psycopg2
        try:
            import psycopg2
            logger.info("Using psycopg2 for database connection")
            
            # Test connection with psycopg2
            conn = psycopg2.connect(
                host=db_host,
                port=db_port,
                database=db_name,
                user=db_user,
                password=db_password,
                sslmode=db_sslmode,
                connect_timeout=10
            )
            
            cur = conn.cursor()
            cur.execute("SELECT version();")
            db_version = cur.fetchone()
            cur.close()
            conn.close()
            
            logger.info(f"Database connection successful with psycopg2: {db_version[0][:50]}...")
            return True, "Connected successfully with psycopg2"
            
        except ImportError as e:
            logger.error(f"Neither psycopg3 nor psycopg2 available: {e}")
            return False, f"No PostgreSQL driver available: {e}"
        except Exception as e:
            logger.error(f"Database connection failed with psycopg2: {e}")
            return False, f"psycopg2 connection error: {e}"
            
    except Exception as e:
        logger.error(f"Database connection failed with psycopg3: {e}")
        return False, f"psycopg3 connection error: {e}"

# API Routes
@app.route('/', methods=['GET'])
def root():
    """Root endpoint for basic connectivity test"""
    logger.info("Root endpoint accessed")
    return jsonify({
        "message": "BandVenueReview.ie API - Render Deployment", 
        "status": "running",
        "version": "1.1.0",
        "environment": "render",
        "features": [
            "Render optimized deployment",
            "Robust error handling",
            "Database connection testing",
            "Simplified startup process"
        ],
        "endpoints": {
            "health": "/api/health",
            "db-test": "/api/db-test",
            "env-check": "/api/env-check"
        }
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for deployment monitoring"""
    logger.info("Health check endpoint accessed")
    
    # Test database connection
    db_connected, db_message = test_database_connection()
    
    return jsonify({
        "status": "healthy" if db_connected else "degraded",
        "service": "BandVenueReview.ie API",
        "version": "1.1.0",
        "environment": "render",
        "database": {
            "connected": db_connected,
            "message": db_message
        },
        "timestamp": datetime.utcnow().isoformat()
    })

@app.route('/api/db-test', methods=['GET'])
def database_test():
    """Detailed database connection test"""
    logger.info("Database test endpoint accessed")
    
    db_connected, db_message = test_database_connection()
    
    # Get environment variable status
    env_vars = {
        'DB_HOST': bool(os.environ.get('DB_HOST')),
        'DB_PORT': bool(os.environ.get('DB_PORT')),
        'DB_NAME': bool(os.environ.get('DB_NAME')),
        'DB_USER': bool(os.environ.get('DB_USER')),
        'DB_PASSWORD': bool(os.environ.get('DB_PASSWORD')),
        'DB_SSLMODE': bool(os.environ.get('DB_SSLMODE'))
    }
    
    return jsonify({
        "database_connection": {
            "connected": db_connected,
            "message": db_message
        },
        "environment_variables": env_vars,
        "connection_details": {
            "host": os.environ.get('DB_HOST', 'NOT_SET'),
            "port": os.environ.get('DB_PORT', 'NOT_SET'),
            "database": os.environ.get('DB_NAME', 'NOT_SET'),
            "user": os.environ.get('DB_USER', 'NOT_SET'),
            "sslmode": os.environ.get('DB_SSLMODE', 'require')
        }
    })

@app.route('/api/env-check', methods=['GET'])
def environment_check():
    """Check environment variables"""
    logger.info("Environment check endpoint accessed")
    
    env_vars = {}
    for key in os.environ:
        if key.startswith(('DB_', 'FLASK_', 'SECRET_', 'CORS_')):
            if 'PASSWORD' in key or 'SECRET' in key:
                env_vars[key] = '***HIDDEN***' if os.environ[key] else 'NOT_SET'
            else:
                env_vars[key] = os.environ[key] or 'NOT_SET'
    
    return jsonify({
        "environment_variables": env_vars,
        "python_version": sys.version,
        "working_directory": os.getcwd()
    })

# Simple products endpoint for testing
@app.route('/api/products', methods=['GET'])
def get_products():
    """Simple products endpoint for testing"""
    logger.info("Products endpoint accessed")
    
    # Return mock data for now
    mock_products = [
        {
            "id": "1",
            "title": "Band T-Shirt - Black",
            "price": 25.00,
            "category": "tshirt",
            "in_stock": True,
            "description": "High-quality cotton t-shirt with band logo",
            "image": None,
            "featured": True
        },
        {
            "id": "2", 
            "title": "Latest Album - CD",
            "price": 15.00,
            "category": "cd",
            "in_stock": True,
            "description": "Physical CD with liner notes and artwork",
            "image": None,
            "featured": False
        },
        {
            "id": "3",
            "title": "Digital Album Download",
            "price": 10.00,
            "category": "digital",
            "in_stock": True,
            "description": "High-quality MP3 download with digital booklet",
            "image": None,
            "featured": False
        },
        {
            "id": "4",
            "title": "Band Hoodie - Grey",
            "price": 45.00,
            "category": "hoodie",
            "in_stock": True,
            "description": "Comfortable hoodie with embroidered logo",
            "image": None,
            "featured": True
        },
        {
            "id": "5",
            "title": "Vinyl Record - Limited Edition",
            "price": 35.00,
            "category": "vinyl",
            "in_stock": False,
            "description": "Limited edition colored vinyl with special packaging",
            "image": None,
            "featured": True
        }
    ]
    
    return jsonify({
        "products": mock_products,
        "total": len(mock_products),
        "message": "Mock data - database integration pending"
    })

# Product categories endpoint
@app.route('/api/products/categories', methods=['GET'])
def get_product_categories():
    """Get product categories for store filtering"""
    logger.info("Product categories endpoint accessed")
    
    categories = [
        {"id": "tshirt", "name": "T-Shirts", "count": 1},
        {"id": "hoodie", "name": "Hoodies", "count": 1},
        {"id": "cd", "name": "CDs", "count": 1},
        {"id": "vinyl", "name": "Vinyl Records", "count": 1},
        {"id": "digital", "name": "Digital Downloads", "count": 1}
    ]
    
    return jsonify({
        "categories": categories,
        "total": len(categories),
        "message": "Mock data - database integration pending"
    })

# Individual product endpoint
@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    """Get individual product details"""
    logger.info(f"Product detail endpoint accessed for ID: {product_id}")
    
    # Mock product data
    mock_products = {
        "1": {
            "id": "1",
            "title": "Band T-Shirt - Black",
            "price": 25.00,
            "category": "tshirt",
            "in_stock": True,
            "description": "High-quality cotton t-shirt with band logo. Available in sizes S-XXL.",
            "image": None,
            "featured": True,
            "variants": [
                {"size": "S", "price": 25.00, "in_stock": True},
                {"size": "M", "price": 25.00, "in_stock": True},
                {"size": "L", "price": 25.00, "in_stock": True},
                {"size": "XL", "price": 27.00, "in_stock": True},
                {"size": "XXL", "price": 29.00, "in_stock": False}
            ],
            "rating": 4.5,
            "review_count": 23
        },
        "2": {
            "id": "2",
            "title": "Latest Album - CD",
            "price": 15.00,
            "category": "cd",
            "in_stock": True,
            "description": "Physical CD with liner notes and artwork. Includes 12 tracks of our latest material.",
            "image": None,
            "featured": False,
            "variants": [],
            "rating": 4.8,
            "review_count": 45
        },
        "3": {
            "id": "3",
            "title": "Digital Album Download",
            "price": 10.00,
            "category": "digital",
            "in_stock": True,
            "description": "High-quality MP3 download with digital booklet. Instant download after purchase.",
            "image": None,
            "featured": False,
            "variants": [],
            "rating": 4.2,
            "review_count": 67
        },
        "4": {
            "id": "4",
            "title": "Band Hoodie - Grey",
            "price": 45.00,
            "category": "hoodie",
            "in_stock": True,
            "description": "Comfortable hoodie with embroidered logo. Perfect for concerts and casual wear.",
            "image": None,
            "featured": True,
            "variants": [
                {"size": "S", "price": 45.00, "in_stock": True},
                {"size": "M", "price": 45.00, "in_stock": True},
                {"size": "L", "price": 45.00, "in_stock": False},
                {"size": "XL", "price": 47.00, "in_stock": True}
            ],
            "rating": 4.6,
            "review_count": 18
        },
        "5": {
            "id": "5",
            "title": "Vinyl Record - Limited Edition",
            "price": 35.00,
            "category": "vinyl",
            "in_stock": False,
            "description": "Limited edition colored vinyl with special packaging. Only 500 copies made.",
            "image": None,
            "featured": True,
            "variants": [],
            "rating": 4.9,
            "review_count": 12
        }
    }
    
    product = mock_products.get(product_id)
    if not product:
        return jsonify({
            "error": "Product not found",
            "message": f"Product with ID {product_id} does not exist"
        }), 404
    
    return jsonify({
        "product": product,
        "message": "Mock data - database integration pending"
    })

# Venues endpoint for website compatibility
@app.route('/api/venues', methods=['GET'])
def get_venues():
    """Venues endpoint with mock data for website compatibility"""
    logger.info("Venues endpoint accessed")
    
    # Return mock venues data to fix "Failed to fetch venues" error
    mock_venues = []
    for i in range(1, 779):  # Generate 778 venues to match the count shown on website
        mock_venues.append({
            "id": str(i),
            "name": f"Venue {i}",
            "city": "Dublin" if i % 3 == 0 else "Cork" if i % 3 == 1 else "Galway",
            "county": "Dublin" if i % 3 == 0 else "Cork" if i % 3 == 1 else "Galway",
            "venue_type": "live_music_venue",
            "capacity": 100 + (i * 10) % 500,
            "average_rating": 3.5 + (i % 3) * 0.5,
            "review_count": i % 20
        })
    
    # Handle pagination
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated_venues = mock_venues[start_idx:end_idx]
    
    total_venues = len(mock_venues)
    total_pages = (total_venues + per_page - 1) // per_page
    
    return jsonify({
        "venues": paginated_venues,
        "total": total_venues,
        "pages": total_pages,
        "current_page": page,
        "per_page": per_page,
        "message": "Mock data - database integration pending"
    })

# Bands endpoint for completeness
@app.route('/api/bands', methods=['GET'])
def get_bands():
    """Bands endpoint with mock data"""
    logger.info("Bands endpoint accessed")
    
    mock_bands = [
        {
            "id": "1",
            "name": "The Dublin Sessions",
            "genre": "Folk Rock",
            "location": "Dublin",
            "member_count": 4
        },
        {
            "id": "2",
            "name": "Cork City Blues",
            "genre": "Blues",
            "location": "Cork", 
            "member_count": 3
        },
        {
            "id": "3",
            "name": "Galway Winds",
            "genre": "Traditional",
            "location": "Galway",
            "member_count": 5
        }
    ]
    
    return jsonify({
        "bands": mock_bands,
        "total": len(mock_bands),
        "message": "Mock data - database integration pending"
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    logger.warning(f"404 error: {request.url}")
    return jsonify({
        "error": "Endpoint not found",
        "status": "error",
        "url": request.url
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"500 error: {error}")
    return jsonify({
        "error": "Internal server error",
        "status": "error",
        "message": str(error)
    }), 500

if __name__ == '__main__':
    # Get port from environment variable
    port = int(os.environ.get('PORT', 5000))
    
    logger.info("=" * 60)
    logger.info("🚀 Starting BandVenueReview.ie API - Render Version")
    logger.info(f"📍 Port: {port}")
    logger.info(f"🐍 Python: {sys.version}")
    logger.info(f"📁 Working Directory: {os.getcwd()}")
    logger.info("=" * 60)
    
    # Test database connection on startup
    logger.info("Testing database connection on startup...")
    db_connected, db_message = test_database_connection()
    if db_connected:
        logger.info("✅ Database connection successful on startup")
    else:
        logger.warning(f"⚠️ Database connection failed on startup: {db_message}")
        logger.info("🔄 App will still start - database issues can be debugged via /api/db-test")
    
    logger.info("🌐 Starting Flask server...")
    
    try:
        app.run(
            host='0.0.0.0',
            port=port,
            debug=False,
            threaded=True
        )
    except Exception as e:
        logger.error(f"💥 Failed to start server: {e}")
        sys.exit(1)
