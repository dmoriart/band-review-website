#!/usr/bin/env bash
# Build script for Render.com deployment

echo "🎸 Building Yelp for Bands Backend..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "✅ Backend build complete!"
