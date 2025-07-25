# Sanity CMS Integration Setup Guide

## 🔐 Getting Your Sanity API Token

To enable the gig scraping system to write data to your Sanity CMS, you'll need a Sanity API token with write permissions.

### Step 1: Access Sanity Management Console

1. Go to [sanity.io/manage](https://sanity.io/manage)
2. Sign in to your account
3. Select your project: **Band Venue Review CMS** (`sy7ko2cx`)

### Step 2: Create API Token

1. In your project dashboard, click on **"API"** in the left sidebar
2. Click **"Tokens"** tab
3. Click **"Add API token"** button
4. Configure the token:
   - **Label**: `Backend Gig Scraping` (or any descriptive name)
   - **Permissions**: Select **"Editor"** (required for write operations)
   - **Dataset**: `production`

5. Click **"Save"** 
6. **Copy the token immediately** - it won't be shown again!

### Step 3: Configure Environment Variables

1. In your backend directory, copy the example file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` and add your Sanity token:
   ```bash
   SANITY_PROJECT_ID=sy7ko2cx
   SANITY_DATASET=production
   SANITY_API_TOKEN=your_actual_token_here
   ```

### Step 4: Test the Integration

```bash
# Start the scraping service
npm run start:scheduler

# Trigger a test scrape
curl -X POST http://localhost:3001/api/scraping/trigger/quick

# Check the status
curl http://localhost:3001/api/scraping/status
```

## 🔒 Security Notes

- **Never commit your `.env` file** - it's already in `.gitignore`
- **Keep your API token secure** - treat it like a password
- **Use "Editor" permissions only** - don't use "Admin" unless necessary
- **Rotate tokens periodically** for security

## 🏗️ What the Integration Does

### Automatic Data Creation

The scraping system will automatically:

1. **Create Venues**: New venues are added if they don't exist
2. **Create Bands**: New band profiles are generated for artists
3. **Create Gigs**: Events are imported with full details
4. **Upload Images**: Event posters are downloaded and uploaded to Sanity
5. **Prevent Duplicates**: Checks for existing events before creating

### Data Mapping

| Scraped Data | Sanity Field | Notes |
|--------------|--------------|-------|
| Event title | `title` | Required |
| Artist name | `headliner` | Auto-creates band if needed |
| Venue info | `venue` | Auto-creates venue if needed |
| Date/time | `date` | Converted to ISO format |
| Ticket price | `ticketPrice` | Numeric value in euros |
| Ticket URL | `ticketUrl` | Direct link to tickets |
| Description | `description` | Event details |
| Poster image | `poster` | Downloaded and uploaded |
| Age restriction | `ageRestriction` | Parsed from description |

### Source Tracking

Each imported gig includes metadata:
- **Source**: Which platform (Bandsintown, Songkick, Eventbrite)
- **Source ID**: Original event ID from the platform
- **Source URL**: Link back to original event
- **Import timestamp**: When the data was scraped

## 🎯 Monitoring Your Data

### Sanity Studio

1. Open your Sanity Studio: `cd cms && npm run dev`
2. Navigate to **"Gigs"** section
3. View imported events with auto-generated content
4. Edit and enhance imported data as needed

### API Endpoints

- **Status**: `GET /api/scraping/status` - View scraping statistics
- **Manual Trigger**: `POST /api/scraping/trigger/full` - Run full scrape
- **Quick Update**: `POST /api/scraping/trigger/quick` - Run incremental update

## 🚀 Ready to Go!

Once configured, your system will automatically:
- **Scrape daily** at 2:00 AM for comprehensive updates
- **Check hourly** during business hours (9 AM - 11 PM) for new events
- **Clean up weekly** on Sundays at 3:00 AM

Your Irish music event database will stay fresh and up-to-date! 🎸🇮🇪
