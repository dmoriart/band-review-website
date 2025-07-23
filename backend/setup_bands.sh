#!/bin/bash

# Setup script for Bands API Backend
# This script sets up the development environment and initializes the database

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Python virtual environment exists
check_venv() {
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    print_status "Activating virtual environment..."
    source venv/bin/activate
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    print_status "Dependencies installed successfully ✓"
}

# Function to setup environment variables
setup_environment() {
    if [ ! -f ".env" ]; then
        print_status "Creating .env file from template..."
        cat > .env << EOF
# Flask Configuration
FLASK_CONFIG=development
FLASK_ENV=development
SECRET_KEY=dev-secret-key-change-in-production

# Database Configuration (update with your PostgreSQL credentials)
DATABASE_URL=postgresql://band_app_user:YOUR_PASSWORD_HERE@localhost:5432/band_venue_review
DB_HOST=localhost
DB_PORT=5432
DB_NAME=band_venue_review
DB_USER=band_app_user
DB_PASSWORD=YOUR_PASSWORD_HERE
DB_SSL=false

# Firebase Configuration (update with your Firebase credentials)
FIREBASE_PROJECT_ID=project-767641273466
FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json
# FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}  # For production

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-here

# CORS Origins (add your frontend URLs)
CORS_ORIGINS=http://localhost:3000,https://bandvenuereview.netlify.app

# Optional: Redis for rate limiting
# REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=INFO
SQLALCHEMY_ECHO=false
EOF
        print_warning "Created .env file. Please update it with your actual credentials!"
        print_warning "1. Update database credentials (get password from database setup)"
        print_warning "2. Add Firebase service account key"
        print_warning "3. Set secure JWT secret key"
    else
        print_status ".env file already exists ✓"
    fi
}

# Function to setup Firebase service account
setup_firebase() {
    if [ ! -f "firebase-service-account.json" ]; then
        print_warning "Firebase service account key not found."
        print_warning "Please download your Firebase service account key and save it as:"
        print_warning "  firebase-service-account.json"
        print_warning ""
        print_warning "To get your service account key:"
        print_warning "1. Go to Firebase Console → Project Settings → Service Accounts"
        print_warning "2. Click 'Generate new private key'"
        print_warning "3. Download and save as firebase-service-account.json"
        print_warning ""
        read -p "Continue without Firebase setup? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Please set up Firebase service account key and run this script again."
            exit 1
        fi
    else
        print_status "Firebase service account key found ✓"
    fi
}

# Function to test database connection
test_database() {
    print_status "Testing database connection..."
    
    python3 << EOF
import os
from dotenv import load_dotenv
load_dotenv()

try:
    import psycopg2
    
    # Get database credentials from environment
    db_host = os.getenv('DB_HOST', 'localhost')
    db_port = os.getenv('DB_PORT', '5432')
    db_name = os.getenv('DB_NAME', 'band_venue_review')
    db_user = os.getenv('DB_USER', 'band_app_user')
    db_password = os.getenv('DB_PASSWORD', '')
    
    # Test connection
    conn = psycopg2.connect(
        host=db_host,
        port=db_port,
        database=db_name,
        user=db_user,
        password=db_password
    )
    
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %s', ('public',))
    table_count = cursor.fetchone()[0]
    
    cursor.close()
    conn.close()
    
    print(f"✓ Database connection successful")
    print(f"✓ Found {table_count} tables in database")
    
except ImportError:
    print("✗ psycopg2 not installed")
    exit(1)
except Exception as e:
    print(f"✗ Database connection failed: {e}")
    print("Please check your database credentials in .env file")
    exit(1)
EOF

    if [ $? -eq 0 ]; then
        print_status "Database connection test successful ✓"
    else
        print_error "Database connection test failed"
        print_error "Please check your database setup and credentials"
        exit 1
    fi
}

# Function to run database migrations
setup_database() {
    print_status "Setting up database schema..."
    
    # Set Flask app environment variable
    export FLASK_APP=app_bands.py
    
    # Initialize migrations if needed
    if [ ! -d "migrations" ]; then
        print_status "Initializing Flask-Migrate..."
        flask db init
    fi
    
    # Create migration
    print_status "Creating database migration..."
    flask db migrate -m "Add comprehensive bands system"
    
    # Apply migration
    print_status "Applying database migration..."
    flask db upgrade
    
    print_status "Database setup completed ✓"
}

# Function to verify API setup
verify_setup() {
    print_status "Verifying API setup..."
    
    # Start the development server in background
    export FLASK_APP=app_bands.py
    export FLASK_ENV=development
    
    print_status "Starting development server for testing..."
    flask run --port=5001 &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 3
    
    # Test health endpoint
    if curl -s http://localhost:5001/health > /dev/null; then
        print_status "Health endpoint test successful ✓"
        
        # Test API info endpoint
        if curl -s http://localhost:5001/api/info > /dev/null; then
            print_status "API info endpoint test successful ✓"
        else
            print_warning "API info endpoint test failed"
        fi
    else
        print_warning "Health endpoint test failed"
    fi
    
    # Stop test server
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    
    print_status "API verification completed"
}

# Function to show next steps
show_next_steps() {
    print_status ""
    print_status "🎉 Bands API Backend Setup Complete!"
    print_status ""
    print_status "Next steps:"
    print_status "1. Update .env file with your actual credentials"
    print_status "2. Add Firebase service account key (firebase-service-account.json)"
    print_status "3. Start the development server:"
    print_status "   export FLASK_APP=app_bands.py"
    print_status "   flask run"
    print_status ""
    print_status "4. Test the API:"
    print_status "   curl http://localhost:5000/health"
    print_status "   curl http://localhost:5000/api/info"
    print_status ""
    print_status "5. Available endpoints:"
    print_status "   GET  /api/bands              - List bands"
    print_status "   POST /api/bands              - Create band (auth required)"  
    print_status "   GET  /api/bands/:slug        - Get band details"
    print_status "   GET  /api/gigs               - List gigs"
    print_status "   GET  /api/reviews/bands      - List band reviews"
    print_status "   GET  /api/search             - Global search"
    print_status "   GET  /api/stats              - Platform statistics"
    print_status ""
    print_status "6. For production deployment:"
    print_status "   - Use gunicorn: gunicorn -c gunicorn.conf.py app_bands:app"
    print_status "   - Set FLASK_CONFIG=production"
    print_status "   - Use environment variables for secrets"
    print_status ""
    print_status "Documentation: See BANDS_API.md for complete API specification"
}

# Main execution
main() {
    print_status "Starting Bands API Backend Setup"
    print_status "================================="
    
    # Check if we're in the right directory
    if [ ! -f "requirements.txt" ]; then
        print_error "requirements.txt not found. Please run this script from the backend directory."
        exit 1
    fi
    
    # Confirm before proceeding
    read -p "Continue with backend setup? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Setup cancelled."
        exit 0
    fi
    
    # Execute setup steps
    check_venv
    install_dependencies
    setup_environment
    setup_firebase
    test_database
    setup_database
    verify_setup
    show_next_steps
}

# Run main function
main
