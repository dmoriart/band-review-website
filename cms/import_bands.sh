#!/bin/bash
# Sanity Band Import Script
# Run this from your CMS directory

echo "🎵 Importing bands to Sanity CMS..."
echo "Project: band-review-website"
echo "Dataset: production"
echo ""

# Check if sanity CLI is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js first"
    exit 1
fi

# Import the bands
echo "📊 Importing 982 bands..."
npx sanity dataset import bands_import.ndjson production --missing

echo "✅ Import completed!"
echo ""
echo "🔗 View your bands at: https://band-review-website.sanity.studio/structure/band"
