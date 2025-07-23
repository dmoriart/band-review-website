#!/bin/bash

# Database Setup Script for Band Venue Review Website
# This script automates the PostgreSQL database setup process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
DB_NAME="band_venue_review"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
LOAD_SAMPLE_DATA=false

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if PostgreSQL is running
check_postgresql() {
    print_status "Checking PostgreSQL connection..."
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1; then
        print_error "PostgreSQL is not running or not accessible at $DB_HOST:$DB_PORT"
        print_error "Please ensure PostgreSQL is installed and running."
        exit 1
    fi
    print_status "PostgreSQL is running ✓"
}

# Function to check if database exists
database_exists() {
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"
}

# Function to create database
create_database() {
    if database_exists; then
        print_warning "Database '$DB_NAME' already exists."
        read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Dropping existing database..."
            dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
        else
            print_status "Using existing database."
            return 0
        fi
    fi
    
    print_status "Creating database '$DB_NAME'..."
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
    print_status "Database created successfully ✓"
}

# Function to run schema
run_schema() {
    print_status "Running database schema..."
    if [ ! -f "database/schema.sql" ]; then
        print_error "Schema file 'database/schema.sql' not found!"
        exit 1
    fi
    
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/schema.sql
    print_status "Schema applied successfully ✓"
}

# Function to load sample data
load_sample_data() {
    if [ "$LOAD_SAMPLE_DATA" = true ]; then
        print_status "Loading sample data..."
        if [ ! -f "database/sample_data.sql" ]; then
            print_warning "Sample data file 'database/sample_data.sql' not found. Skipping sample data."
            return 0
        fi
        
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/sample_data.sql
        print_status "Sample data loaded successfully ✓"
    fi
}

# Function to create app user
create_app_user() {
    print_status "Creating application database user..."
    
    # Generate a random password
    APP_USER_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    # Create user and set permissions
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
-- Create application user if it doesn't exist
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'band_app_user') THEN
        CREATE USER band_app_user WITH PASSWORD '$APP_USER_PASSWORD';
    END IF;
END
\$\$;

-- Grant necessary permissions
GRANT CONNECT ON DATABASE $DB_NAME TO band_app_user;
GRANT USAGE ON SCHEMA public TO band_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO band_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO band_app_user;

-- Grant permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO band_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO band_app_user;
EOF

    print_status "Application user 'band_app_user' created successfully ✓"
    print_warning "Application user password: $APP_USER_PASSWORD"
    print_warning "Please save this password securely and add it to your environment variables."
}

# Function to verify installation
verify_installation() {
    print_status "Verifying database installation..."
    
    # Check if tables exist
    TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    
    if [ "$TABLE_COUNT" -gt 10 ]; then
        print_status "Database verification successful ✓"
        print_status "Found $TABLE_COUNT tables in the database."
    else
        print_error "Database verification failed. Expected more than 10 tables, found $TABLE_COUNT."
        exit 1
    fi
    
    # Test basic queries
    print_status "Testing basic database operations..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 'Database connection test successful' as status;" > /dev/null
    print_status "Database operations test successful ✓"
}

# Function to generate environment template
generate_env_template() {
    print_status "Generating environment variable template..."
    
    cat > .env.database.template << EOF
# Database Configuration for Band Venue Review Website
# Copy this to your backend .env file and update the password

DATABASE_URL=postgresql://band_app_user:YOUR_PASSWORD_HERE@$DB_HOST:$DB_PORT/$DB_NAME
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=band_app_user
DB_PASSWORD=YOUR_PASSWORD_HERE
DB_SSL=false

# Connection Pool Settings
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000

# For production, set DB_SSL=true and update host/credentials accordingly
EOF
    
    print_status "Environment template created as '.env.database.template' ✓"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -h, --host HOST      Database host (default: localhost)"
    echo "  -p, --port PORT      Database port (default: 5432)"
    echo "  -U, --user USER      Database user (default: postgres)"
    echo "  -d, --database NAME  Database name (default: band_venue_review)"
    echo "  -s, --sample-data    Load sample data after schema creation"
    echo "  --help               Show this help message"
    echo
    echo "Example:"
    echo "  $0 --host localhost --user postgres --sample-data"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            DB_HOST="$2"
            shift 2
            ;;
        -p|--port)
            DB_PORT="$2"
            shift 2
            ;;
        -U|--user)
            DB_USER="$2"
            shift 2
            ;;
        -d|--database)
            DB_NAME="$2"
            shift 2
            ;;
        -s|--sample-data)
            LOAD_SAMPLE_DATA=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_status "Starting Band Venue Review Database Setup"
    print_status "Database: $DB_NAME on $DB_HOST:$DB_PORT"
    print_status "User: $DB_USER"
    if [ "$LOAD_SAMPLE_DATA" = true ]; then
        print_status "Sample data will be loaded"
    fi
    echo
    
    # Confirm before proceeding
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Setup cancelled."
        exit 0
    fi
    
    # Execute setup steps
    check_postgresql
    create_database
    run_schema
    load_sample_data
    create_app_user
    verify_installation
    generate_env_template
    
    print_status ""
    print_status "🎉 Database setup completed successfully!"
    print_status ""
    print_status "Next steps:"
    print_status "1. Update your backend .env file with the database credentials"
    print_status "2. Use the generated password for 'band_app_user'"
    print_status "3. Test your API connection to the database"
    print_status "4. Consider setting up regular backups"
    print_status ""
    print_status "For more information, see database/README.md"
}

# Run main function
main
