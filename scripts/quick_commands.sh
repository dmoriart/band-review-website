#!/bin/bash

# 🎵 Enhanced Irish Music Studios - Quick Commands Reference

echo "🎵 ENHANCED IRISH MUSIC STUDIOS SCRAPER"
echo "========================================="

echo ""
echo "📁 SETUP (one-time):"
echo "cd /Users/desmoriarty/Code/band-review-website/scripts"
echo "pip install requests beautifulsoup4 lxml"

echo ""
echo "🔍 COLLECT STUDIOS (with Google Places discovery):"
echo "python3 irish_studios_scraper.py"
echo "# Expected output: 25-40+ studios with full data"

echo ""
echo "🧹 PROCESS & DEDUPLICATE:"
echo "python3 sanity_importer.py"
echo "# Shows duplicate detection report"
echo "# Creates clean import files"

echo ""
echo "📊 IMPORT TO SANITY CMS:"
echo "cd ../cms"
echo "npx sanity@latest dataset import studios_import.ndjson production"

echo ""
echo "🧪 TEST & DEMO:"
echo "cd scripts"
echo "python3 demo_enhancements.py    # Show capabilities"
echo "python3 test_enhancements.py    # Test duplicate detection"

echo ""
echo "📋 KEY FEATURES:"
echo "✅ 28+ curated Irish studios"
echo "✅ Google Places API discovery" 
echo "✅ Intelligent duplicate detection"
echo "✅ Multi-city geographic coverage"
echo "✅ Professional data quality"
echo "✅ Automatic photo extraction"
echo "✅ GPS coordinates for all locations"

echo ""
echo "🎯 EXPECTED RESULTS:"
echo "• Before: 5 studios"
echo "• After: 25-40+ unique studios"
echo "• Coverage: Dublin, Cork, Belfast, Galway, Limerick + regional"
echo "• Quality: Professional contact info, pricing, equipment lists"

echo ""
echo "🏆 Your Irish music platform now has the most comprehensive"
echo "   studio directory in Ireland! 🇮🇪"
