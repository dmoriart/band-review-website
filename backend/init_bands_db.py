#!/usr/bin/env python3
"""
Initialize database for bands system
"""
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app_bands import create_app
from models_bands_sqlite import db

def init_bands_database():
    """Initialize database tables for bands system"""
    app = create_app('development')
    
    with app.app_context():
        print("🗄️  Creating bands database tables...")
        
        # Create all tables
        db.create_all()
        
        print("✅ Database tables created successfully!")
        print("📊 Available tables:")
        
        # List the created tables
        inspector = db.inspect(db.engine)
        for table_name in inspector.get_table_names():
            print(f"   - {table_name}")

if __name__ == '__main__':
    init_bands_database()
