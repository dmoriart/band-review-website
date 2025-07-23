"""
Production application entry point
"""
import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set environment variables before importing app
os.environ.setdefault('FLASK_ENV', 'production')
os.environ.setdefault('FLASK_CONFIG', 'production')

from app_bands import create_app

# Create the application
app = create_app('production')

# Debug: Print route information
print("=== WSGI Application Starting ===")
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
