"""
Production application entry point
"""
import os
import sys
import traceback

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set environment variables before importing app
os.environ.setdefault('FLASK_ENV', 'production')
os.environ.setdefault('FLASK_CONFIG', 'production')

print("=== WSGI Starting ===")
print(f"Python path: {sys.path}")
print(f"Current directory: {os.getcwd()}")
print(f"Backend directory: {os.path.dirname(os.path.abspath(__file__))}")

try:
    print("Importing app_bands...")
    from app_bands import create_app
    print("✅ Import successful")
    
    print("Creating app...")
    app = create_app('production')
    print("✅ App created")
    
    # Debug: Print route information
    print("=== WSGI Application Starting ===")
    print(f"Flask Environment: {os.environ.get('FLASK_ENV', 'not set')}")
    print(f"Flask Config: {os.environ.get('FLASK_CONFIG', 'not set')}")
    print(f"Database URL: {os.environ.get('DATABASE_URL', 'not set')[:50]}...")

    print("\nRegistered routes:")
    try:
        route_count = 0
        for rule in app.url_map.iter_rules():
            print(f"  {rule.endpoint}: {rule.rule} [{', '.join(rule.methods)}]")
            route_count += 1
        print(f"Total routes registered: {route_count}")
    except Exception as e:
        print(f"Error listing routes: {e}")

    print("=== WSGI Application Ready ===")
    
except Exception as e:
    print(f"❌ Error creating app: {e}")
    print("Full traceback:")
    traceback.print_exc()
    
    # Create a minimal fallback app
    from flask import Flask, jsonify
    app = Flask(__name__)
    
    @app.route('/')
    def error_info():
        return jsonify({
            'error': 'Failed to load main application',
            'message': str(e),
            'status': 'fallback_app_running'
        })
    
    print("Created fallback app with error info")
print(f"Flask Environment: {os.environ.get('FLASK_ENV', 'not set')}")
print(f"Flask Config: {os.environ.get('FLASK_CONFIG', 'not set')}")
print(f"Database URL: {os.environ.get('DATABASE_URL', 'not set')[:50]}...")

print("\nRegistered routes:")
try:
    for rule in app.url_map.iter_rules():
        print(f"  {rule.endpoint}: {rule.rule} [{', '.join(rule.methods)}]")
except Exception as e:
    print(f"Error listing routes: {e}")

print("=== WSGI Application Ready ===")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting development server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
