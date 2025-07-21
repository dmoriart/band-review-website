#!/usr/bin/env python3
"""
Minimal test Flask app with SQLite
"""
import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

# Add backend directory to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)

from models import db, Venue, Genre
from config import config

def create_test_app():
    app = Flask(__name__)
    
    # Use development config
    app.config.from_object(config['development'])
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)
    
    @app.route('/api/health')
    def health():
        return jsonify({
            "status": "healthy",
            "message": "BandVenueReview.ie Test API",
            "database": "SQLite Local"
        })
    
    @app.route('/api/venues')
    def get_venues():
        try:
            venues = Venue.query.limit(5).all()
            return jsonify({
                "status": "success",
                "count": len(venues),
                "venues": [v.to_dict() for v in venues]
            })
        except Exception as e:
            return jsonify({
                "status": "error",
                "error": str(e)
            }), 500
    
    @app.route('/api/genres')
    def get_genres():
        try:
            genres = Genre.query.all()
            return jsonify({
                "status": "success",
                "count": len(genres),
                "genres": [g.to_dict() for g in genres]
            })
        except Exception as e:
            return jsonify({
                "status": "error",
                "error": str(e)
            }), 500
    
    return app

if __name__ == '__main__':
    print("🧪 Starting minimal test server...")
    app = create_test_app()
    
    with app.app_context():
        # Ensure database exists
        db_path = 'instance/bandvenuereview_dev.db'
        if not os.path.exists(db_path):
            print("❌ Database not found. Run: python init_dev_db.py")
            sys.exit(1)
        print(f"✅ Database found: {db_path}")
    
    print("🚀 Starting on http://localhost:8003")
    app.run(host='0.0.0.0', port=8003, debug=False)  # Disable debug to avoid hanging
