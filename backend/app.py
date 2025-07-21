"""
Yelp for Bands - Flask Backend API
A simple Flask server with CORS support for the band review application.
"""

from flask import Flask, jsonify
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for all routes to allow frontend requests
# In production, you should specify allowed origins instead of using *
CORS(app)

# Sample data - in a real app, this would come from a database
SAMPLE_BANDS = [
    {"id": 1, "name": "The Rolling Stones", "genre": "Rock", "rating": 4.5},
    {"id": 2, "name": "Led Zeppelin", "genre": "Rock", "rating": 4.8},
    {"id": 3, "name": "Pink Floyd", "genre": "Progressive Rock", "rating": 4.7}
]

@app.route('/api/hello', methods=['GET'])
def hello():
    """
    Simple hello endpoint to test API connectivity
    Returns a welcome message for the Yelp for Bands app
    """
    return jsonify({
        "message": "Welcome to Yelp for Bands API!",
        "status": "success",
        "version": "1.0.0"
    })

@app.route('/api/bands', methods=['GET'])
def get_bands():
    """
    Get all bands endpoint
    Returns a list of all bands in the database
    """
    return jsonify({
        "bands": SAMPLE_BANDS,
        "count": len(SAMPLE_BANDS),
        "status": "success"
    })

@app.route('/api/bands/<int:band_id>', methods=['GET'])
def get_band(band_id):
    """
    Get a specific band by ID
    Returns band details if found, otherwise returns 404
    """
    band = next((band for band in SAMPLE_BANDS if band["id"] == band_id), None)
    if band:
        return jsonify({
            "band": band,
            "status": "success"
        })
    else:
        return jsonify({
            "error": "Band not found",
            "status": "error"
        }), 404

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for deployment monitoring
    """
    return jsonify({
        "status": "healthy",
        "service": "Yelp for Bands API"
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        "error": "Endpoint not found",
        "status": "error"
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        "error": "Internal server error",
        "status": "error"
    }), 500

if __name__ == '__main__':
    # Run the Flask development server
    # Debug mode enabled for development - disable in production
    print("🎸 Starting Yelp for Bands API server...")
    print("📍 Server running at: http://localhost:5000")
    print("🔗 Test endpoint: http://localhost:5000/api/hello")
    
    app.run(
        host='0.0.0.0',  # Allow external connections
        port=5000,       # Standard Flask port
        debug=True       # Enable debug mode for development
    )
