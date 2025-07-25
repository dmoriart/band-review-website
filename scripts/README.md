# Irish Music Studios Data Scraper

A comprehensive Python web scraping tool to collect real data on music studios in Ireland using Google Maps API and ethical website scraping.

## 🎯 Purpose

This scraper collects detailed information about recording studios across Ireland to populate the Sound Studios CMS with real, verified data.

## 🛠 Features

- **Google Maps Integration**: Uses Google Places API to find studios and extract photos
- **Ethical Web Scraping**: Respects robots.txt and implements rate limiting
- **Comprehensive Data**: Extracts contact info, equipment, pricing, and more
- **Sanity CMS Format**: Outputs data ready for direct import into Sanity CMS
- **Geocoding**: Gets precise coordinates for map integration

## 📋 Prerequisites

- Python 3.7+
- Google Maps API key (provided)
- Internet connection

## 🚀 Quick Start

1. **Setup Environment**:
   ```bash
   cd scripts
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Activate Virtual Environment**:
   ```bash
   source venv/bin/activate
   ```

3. **Run the Scraper**:
   ```bash
   python irish_studios_scraper.py
   ```

## 📊 Output Files

The scraper creates two main output files:

### 1. `irish_studios_data.json`
Raw scraped data in a structured format for analysis and backup.

### 2. `studios_for_sanity.json`
Formatted specifically for Sanity CMS import with proper schema structure.

## 🏗 Data Structure

Each studio record includes:

```json
{
  "_type": "soundStudio",
  "name": "Studio Name",
  "slug": {"_type": "slug", "current": "studio-name"},
  "description": "Studio description",
  "address": {
    "street": "Street Address",
    "city": "City",
    "county": "County",
    "country": "Ireland"
  },
  "location": {
    "_type": "geopoint",
    "lat": 53.3498,
    "lng": -6.2603
  },
  "contact": {
    "phone": "+353 1 234 5678",
    "email": "info@studio.ie",
    "website": "https://studio.ie",
    "facebook": "https://facebook.com/studio",
    "instagram": "https://instagram.com/studio"
  },
  "profileImageUrl": "Google Places photo URL",
  "amenities": ["ssl_console", "pro_tools", "grand_piano"],
  "pricing": {
    "hourlyRate": 80,
    "currency": "EUR"
  },
  "genresSupported": ["rock", "pop", "indie"],
  "bandFriendly": true,
  "studioType": "professional"
}
```

## 🎯 Data Sources

### 1. Google Maps Places API
- Studio discovery and basic information
- High-quality photos
- User ratings and reviews
- Precise location coordinates

### 2. Studio Websites
- Detailed equipment lists
- Pricing information
- Contact details
- Social media links
- Studio descriptions

### 3. Manual Curation
- Known legendary studios (Windmill Lane, Grouse Lodge, etc.)
- Verified contact information
- Professional categorization

## 🔧 Configuration

### API Key
The Google Maps API key is configured in the script:
```python
GOOGLE_API_KEY = "AIzaSyCEjWukCdjVFH8PuUWlz9AQ7GQse87NhZA"
```

### Rate Limiting
- 2-second delays between website requests
- 1-second delays between API calls
- Respects robots.txt files

## 📈 Data Quality

### Extracted Information
- ✅ Studio names and locations
- ✅ Contact information (phone, email, website)
- ✅ Social media profiles
- ✅ Equipment and amenities
- ✅ Pricing (where available)
- ✅ GPS coordinates
- ✅ Professional photos

### Data Validation
- Email format validation
- Irish phone number patterns
- URL validation
- Coordinate bounds checking

## 🚫 Ethical Considerations

1. **Robots.txt Compliance**: Checks and respects robots.txt files
2. **Rate Limiting**: Implements delays to avoid overwhelming servers
3. **Public Data Only**: Only scrapes publicly available information
4. **Attribution**: Maintains source attribution where required

## 🔍 Known Studios Included

The scraper includes manually curated data for these legendary Irish studios:

- **Windmill Lane Studios** (Dublin) - Where U2 recorded
- **Grouse Lodge Studios** (Westmeath) - Residential facility
- **Temple Lane Studios** (Dublin) - Temple Bar location
- **Sun Studios** (Dublin) - Multi-room facility
- **Westland Studios** (Dublin) - State-of-the-art
- **Pulse Recording** (Dublin) - Professional audio
- **Big Space Studios** (Dublin) - Large format
- **Sonic Studios** (Cork) - Premier Cork facility
- **Studio 1** (Belfast) - Professional Belfast studio
- **Orphan Studios** (Dublin) - Boutique facility

## 📁 File Structure

```
scripts/
├── irish_studios_scraper.py    # Main scraper script
├── studio_scraper.py           # Advanced Google Places scraper
├── requirements.txt            # Python dependencies
├── setup.sh                    # Setup script
├── sample_cms_structure.json   # Example output format
└── README.md                   # This file
```

## 🛠 Dependencies

- `requests` - HTTP requests
- `beautifulsoup4` - HTML parsing
- `lxml` - XML/HTML parser
- `urllib3` - URL handling

## 🚨 Troubleshooting

### Common Issues

1. **API Quota Exceeded**:
   - The Google Maps API has daily limits
   - Check your Google Cloud Console for quota usage

2. **Connection Timeouts**:
   - Some studio websites may be slow
   - The scraper includes timeout handling

3. **Missing Data**:
   - Not all studios have complete information online
   - Manual verification may be needed

### Logs
Check `studio_scraper.log` for detailed execution logs.

## 📦 Import to Sanity CMS

1. Use the `studios_for_sanity.json` file
2. Import through Sanity Studio or CLI
3. Verify data structure matches your soundStudio schema
4. Review and approve imported content

## 🔄 Updates

To refresh the data:
1. Run the scraper again
2. Compare with existing CMS data
3. Merge new discoveries
4. Update changed information

## 📞 Support

For issues or questions about the scraper, check the execution logs or review the data validation steps in the code.

---

**Note**: This tool is designed for legitimate business use in populating a music venue review platform. Always respect website terms of service and rate limiting guidelines.
