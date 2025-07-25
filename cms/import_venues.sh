#!/bin/bash
# Sanity Venue Import Script
# Run this from your CMS directory

echo "🎵 Importing venues to Sanity CMS..."
echo "Project: band-review-website"
echo "Dataset: production"
echo ""

# Check if sanity CLI is available
if ! command -v sanity &> /dev/null; then
    echo "❌ Sanity CLI not found. Please install it first:"
    echo "npm install -g @sanity/cli"
    exit 1
fi

# Import the venues
echo "📊 Importing 768 venues..."
sanity dataset import venues_import.ndjson production --replace

echo "✅ Import completed!"
echo ""
echo "🔗 View your venues at: https://band-review-website.sanity.studio/structure/venue"
