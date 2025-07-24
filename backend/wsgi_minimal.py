"""
Minimal Flask app for testing route registration
"""
import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify

def create_minimal_app():
    """Create a minimal Flask app to test basic functionality"""
    app = Flask(__name__)
    
    @app.route('/')
    def root():
        return jsonify({
            'message': 'Minimal Flask app is working!',
            'status': 'success',
            'routes': [str(rule) for rule in app.url_map.iter_rules()]
        })
    
    @app.route('/test')
    def test():
        return jsonify({
            'message': 'Test endpoint working!',
            'environment': {
                'FLASK_ENV': os.environ.get('FLASK_ENV'),
                'DATABASE_URL': os.environ.get('DATABASE_URL', '')[:50] + '...',
                'CORS_ORIGINS': os.environ.get('CORS_ORIGINS'),
                'PYTHONPATH': os.environ.get('PYTHONPATH', ''),
            }
        })
    
    return app

# Create the minimal app
app = create_minimal_app()

print("=== MINIMAL APP CREATED ===")
print("Available routes:")
for rule in app.url_map.iter_rules():
    print(f"  {rule}")
print("===========================")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting minimal app on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
