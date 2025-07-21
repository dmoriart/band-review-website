#!/usr/bin/env python3
"""
Simple Flask app test for Supabase connection
"""
import os
import sys
sys.path.append('backend')

from flask import Flask, jsonify
from backend.models import db
from backend.config import config

def create_simple_app():
    app = Flask(__name__)
    
    # Load development configuration
    app.config.from_object(config['development'])
    
    # Initialize database
    db.init_app(app)
    
    @app.route('/api/health')
    def health():
        try:
            # Test database connection
            with db.engine.connect() as connection:
                result = connection.execute(db.text("SELECT 1"))
                result.fetchone()
            
            return jsonify({
                "status": "success",
                "message": "BandVenueReview.ie API is running",
                "service": "Flask API",
                "version": "1.0.0",
                "database": "Connected to Supabase PostgreSQL"
            })
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": "Database connection failed",
                "error": str(e)
            }), 500
    
    @app.route('/api/test-venues')
    def test_venues():
        try:
            from backend.models import Venue
            venues = Venue.query.limit(3).all()
            return jsonify({
                "status": "success",
                "count": len(venues),
                "venues": [{"name": v.name, "city": v.city} for v in venues]
            })
        except Exception as e:
            return jsonify({
                "status": "error",
                "error": str(e)
            }), 500
    
    return app

if __name__ == '__main__':
    print("🧪 Starting simple Flask test server...")
    app = create_simple_app()
    
    try:
        with app.app_context():
            # Test connection before starting server
            print("🔗 Testing database connection...")
            db.engine.connect()
            print("✅ Database connection successful!")
        
        print("🚀 Starting server on http://localhost:8001")
        app.run(host='0.0.0.0', port=8001, debug=True)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)
