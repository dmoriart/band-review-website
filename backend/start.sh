#!/bin/bash

# Yelp for Bands - Backend Startup Script
# This script activates the virtual environment and starts the Flask server

echo "🎸 Starting Yelp for Bands Backend Server..."
echo "----------------------------------------"

# Navigate to backend directory
cd "$(dirname "$0")"

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Start Flask server
echo "🚀 Starting Flask server on http://localhost:5000..."
echo "📍 API endpoints available at http://localhost:5000/api/"
echo "🔗 Test with: curl http://localhost:5000/api/hello"
echo ""
echo "Press Ctrl+C to stop the server"
echo "----------------------------------------"

python app.py
