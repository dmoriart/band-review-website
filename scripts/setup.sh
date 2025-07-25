#!/bin/bash

# Irish Music Studios Data Scraper Setup
echo "🎵 Setting up Irish Music Studios Data Scraper..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3 from https://python.org"
    exit 1
fi

echo "✅ Python 3 found"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

echo "✅ Setup complete!"
echo ""
echo "🚀 To run the scraper:"
echo "   1. source venv/bin/activate"
echo "   2. python irish_studios_scraper.py"
echo ""
echo "📁 Output files will be created:"
echo "   - irish_studios_data.json (raw data)"
echo "   - studios_for_sanity.json (Sanity CMS format)"
