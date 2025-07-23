#!/usr/bin/env python3
"""
Debug database connection
"""
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app_bands import create_app

def debug_database():
    """Check database configuration"""
    app = create_app('development')
    
    with app.app_context():
        print("🔍 Database Configuration Debug:")
        print(f"   Working Directory: {os.getcwd()}")
        print(f"   App Instance Path: {app.instance_path}")
        print(f"   Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        print(f"   Environment DATABASE_URL: {os.environ.get('DATABASE_URL', 'Not set')}")
        
        # Check if database file exists
        db_uri = app.config['SQLALCHEMY_DATABASE_URI']
        if db_uri.startswith('sqlite:///'):
            db_path = db_uri.replace('sqlite:///', '')
            if not os.path.isabs(db_path):
                # Relative path - check in instance folder
                full_path = os.path.join(app.instance_path, db_path)
                print(f"   Full Database Path: {full_path}")
                print(f"   Database Exists: {os.path.exists(full_path)}")
            else:
                print(f"   Database Path: {db_path}")
                print(f"   Database Exists: {os.path.exists(db_path)}")

if __name__ == '__main__':
    debug_database()
