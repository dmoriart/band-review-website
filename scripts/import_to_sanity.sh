#!/bin/bash

# Import Irish Music Studios into Sanity CMS
echo "🎵 Importing Irish Music Studios into Sanity CMS..."

# Check if we're in the correct directory
if [ ! -f "studios_import.ndjson" ]; then
    echo "❌ studios_import.ndjson not found"
    echo "Run the sanity_importer.py script first"
    exit 1
fi

# Copy import files to CMS directory
echo "📁 Copying import files to CMS directory..."
cp studios_import.ndjson ../cms/
cp studios_import.json ../cms/
cp studio-types.ts ../cms/

# Move to CMS directory
cd ../cms

echo "📊 Studio data ready for import:"
echo "   - studios_import.ndjson (Sanity CLI import)"
echo "   - studios_import.json (manual review)"
echo "   - studio-types.ts (TypeScript definitions)"

echo ""
echo "🚀 TO IMPORT:"
echo "   1. Review the data in studios_import.json"
echo "   2. Import using Sanity CLI:"
echo "      sanity dataset import studios_import.ndjson production"
echo "   3. Or use Sanity Studio's import feature"

echo ""
echo "💡 NEXT STEPS:"
echo "   - Add profile images manually"
echo "   - Verify contact information"
echo "   - Set featured studios"
echo "   - Review and publish content"
