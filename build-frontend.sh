#!/bin/bash

# BandVenueReview.ie - Netlify Build Script
# This script ensures the frontend builds correctly on Netlify

echo "🎵 Building BandVenueReview.ie Frontend for Netlify..."
echo "================================================="

# Navigate to frontend directory
cd frontend || exit 1

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the React app
echo "🏗️ Building React application..."
npm run build

# Check if build was successful
if [ -d "build" ]; then
    echo "✅ Build successful! Frontend ready for deployment."
    echo "📁 Build directory created with $(ls -1 build | wc -l) files"
else
    echo "❌ Build failed! Build directory not found."
    exit 1
fi

echo "🚀 Ready for Netlify deployment!"
