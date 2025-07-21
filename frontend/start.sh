#!/bin/bash

# Yelp for Bands - Frontend Startup Script
# This script starts the React development server

echo "🎸 Starting Yelp for Bands Frontend..."
echo "-------------------------------------"

# Navigate to frontend directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start React development server
echo "🚀 Starting React development server..."
echo "📍 Frontend will be available at http://localhost:3000"
echo "🔗 Make sure backend is running at http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo "-------------------------------------"

npm start
