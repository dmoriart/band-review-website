#!/bin/bash
# Start Flask Backend Server with Virtual Environment

echo "🚀 Starting BandVenueReview.ie Flask Backend..."
echo "📁 Project Directory: /Users/desmoriarty/Code/band-review-website"
echo "🐍 Python Environment: .venv"
echo "🔥 Firebase Authentication: Enabled"
echo "📊 Sanity CMS Integration: Ready"
echo ""

# Change to project directory
cd /Users/desmoriarty/Code/band-review-website

# Activate virtual environment and start Flask
.venv/bin/python backend/app_bands.py

echo ""
echo "✅ Backend server stopped"
