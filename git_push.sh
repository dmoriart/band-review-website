#!/bin/bash
cd /Users/desmoriarty/Code/band-review-website
git add .
git commit -m "Implement comprehensive Irish location system

Features:
- Centralized irish_locations.py with 32 counties and 391+ cities
- Updated scrapers with standardized location data
- Enhanced CMS schemas with comprehensive county dropdowns
- Frontend location utilities with TypeScript interfaces
- Organized location filtering across all sections
- County-level search for venues, studios, and bands
- Complete coverage of Republic of Ireland and Northern Ireland

Data: 778 venues + 96 studios + 982 bands with standardized locations"

git push origin main
echo "Git push completed successfully!"
