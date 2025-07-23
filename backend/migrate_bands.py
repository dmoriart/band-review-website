"""
Database Migration Script for Bands API
Migrates from existing models to comprehensive bands system
"""

import os
import sys
from flask import Flask
from flask_migrate import Migrate, init, migrate, upgrade
from models_bands import db
from config_bands import get_config

def create_app():
    """Create Flask app for migration"""
    app = Flask(__name__)
    app.config.from_object(get_config())
    
    db.init_app(app)
    Migrate(app, db)
    
    return app

def run_migration():
    """Run the database migration"""
    app = create_app()
    
    with app.app_context():
        # Check if migrations directory exists
        if not os.path.exists('migrations'):
            print("Initializing migrations...")
            init()
        
        print("Creating migration for bands system...")
        migrate(message="Add comprehensive bands system with gigs and reviews")
        
        print("Applying migration...")
        upgrade()
        
        print("Migration completed successfully!")

if __name__ == '__main__':
    run_migration()
