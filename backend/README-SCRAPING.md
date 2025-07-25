# 🎸 Irish Gig Scraping System

An automated system for collecting and importing Irish music events from multiple sources into Sanity CMS.

## 🌟 Features

- **Multi-Platform Scraping**: Bandsintown, Songkick, Eventbrite
- **Automated Scheduling**: Daily, hourly, and weekly jobs
- **Irish Focus**: Targets 32+ Irish cities and venues
- **Smart Deduplication**: Prevents duplicate events
- **Sanity CMS Integration**: Automatic venue/band creation
- **Rate Limiting**: Respectful API usage
- **Comprehensive Logging**: Winston-based logging system
- **RESTful API**: Manual triggering and status monitoring

## 📋 Prerequisites

- Node.js 16+ 
- NPM or Yarn
- Sanity CMS project with write permissions
- Environment variables configured (see [SANITY_SETUP.md](./SANITY_SETUP.md))

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your Sanity API token in .env
# See SANITY_SETUP.md for detailed instructions

# Start the scraping service
npm run start:scheduler

# Or run in development mode
npm run dev
```

## 📅 Automated Schedule

| Job | Schedule | Description |
|-----|----------|-------------|
| **Daily Full Scrape** | 2:00 AM (Dublin) | Comprehensive scrape of all sources |
| **Hourly Updates** | 9 AM - 11 PM (Dublin) | Quick checks for new events |
| **Weekly Cleanup** | Sunday 3:00 AM (Dublin) | Maintenance and old event processing |

## 🎯 Targeted Locations

The system focuses on Irish venues in major cities:

**Major Cities**: Dublin, Cork, Galway, Limerick, Waterford, Kilkenny, Wexford, Sligo

**Additional Locations**: Drogheda, Dundalk, Bray, Navan, Ennis, Tralee, Carlow, Naas, Athlone, Letterkenny, Tullamore, Killarney, Arklow, Cobh, Castlebar, Midleton, Mallow, Ballina, Enniscorthy, Wicklow, Clonmel, Youghal, Bandon, Ballinasloe

## 🔧 API Endpoints

### Health Check
```http
GET /health
```

### Scraping Status
```http
GET /api/scraping/status
```

**Response:**
```json
{
  "lastFullScrape": "2025-07-25T02:00:00.000Z",
  "lastQuickScrape": "2025-07-25T10:00:00.000Z",
  "totalGigsScraped": 1247,
  "isRunning": false,
  "scheduledJobs": [...]
}
```

### Manual Triggers

**Full Scrape:**
```http
POST /api/scraping/trigger/full
```

**Quick Scrape:**
```http
POST /api/scraping/trigger/quick
```

## 📊 Data Sources

### 1. Bandsintown
- **Type**: API-based
- **Coverage**: International events with Irish locations
- **Data Quality**: High (structured data)
- **Rate Limit**: 1 request/second

### 2. Songkick
- **Type**: Web scraping
- **Coverage**: Local venue listings
- **Data Quality**: Medium (HTML parsing)
- **Rate Limit**: 1 request/2 seconds

### 3. Eventbrite
- **Type**: Web scraping  
- **Coverage**: Independent events and festivals
- **Data Quality**: Medium (HTML parsing)
- **Rate Limit**: 1 request/2 seconds

## 🏗️ Architecture

```
├── src/
│   ├── services/
│   │   ├── gigScrapingService.ts    # Core scraping logic
│   │   └── gigScrapingScheduler.ts  # Cron job management
│   ├── utils/
│   │   ├── logger.ts               # Winston logging
│   │   └── sanityClient.ts         # Sanity CMS integration
│   ├── types/
│   │   └── gig.types.ts           # TypeScript definitions
│   ├── index.ts                   # TypeScript server
│   └── server-with-scheduling.js  # Production server
```

## 🔄 Data Flow

1. **Scheduled Job Triggers** → Cron jobs execute at defined times
2. **Source Scraping** → Parallel scraping from all sources
3. **Data Transformation** → Convert to unified format
4. **Deduplication** → Remove duplicate events
5. **Sanity Processing** → Create venues/bands if needed
6. **Event Creation** → Import gigs with metadata
7. **Logging & Monitoring** → Track results and errors

## 📝 Logging

Logs are written to:
- **Console**: Colored output for development
- **`logs/combined.log`**: All log levels
- **`logs/error.log`**: Errors only

Log levels: `error`, `warn`, `info`, `debug`

## 🚦 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SANITY_PROJECT_ID` | Sanity project ID | `sy7ko2cx` |
| `SANITY_DATASET` | Sanity dataset | `production` |
| `SANITY_API_TOKEN` | Sanity write token | *Required* |
| `PORT` | Server port | `3001` |
| `LOG_LEVEL` | Logging level | `info` |
| `SCRAPING_ENABLED` | Enable/disable scraping | `true` |

## 🔍 Monitoring & Debugging

### View Real-time Logs
```bash
tail -f logs/combined.log
```

### Check Errors Only
```bash
tail -f logs/error.log
```

### Test Individual Sources
```bash
# Test Bandsintown only
curl -X POST http://localhost:3001/api/scraping/trigger/quick

# View status
curl http://localhost:3001/api/scraping/status | jq
```

## 🐛 Troubleshooting

### Common Issues

**1. Sanity API Token Invalid**
```
Error: Sanity API token is missing or invalid
```
→ Check your `.env` file and verify the token in Sanity console

**2. Network Timeouts**
```
Error: Request timeout after 15000ms
```
→ Check internet connection and source website availability

**3. Rate Limiting**
```
Warning: Rate limited by source API
```
→ Normal behavior - the system respects rate limits automatically

### Debug Mode

Enable detailed logging:
```bash
LOG_LEVEL=debug npm run start:scheduler
```

## 🚀 Deployment

### Production Environment

1. **Set Environment Variables**:
   ```bash
   export SANITY_API_TOKEN=your_production_token
   export NODE_ENV=production
   export LOG_LEVEL=info
   ```

2. **Start Production Server**:
   ```bash
   npm run start:scheduler
   ```

3. **Process Management** (PM2):
   ```bash
   npm install -g pm2
   pm2 start src/server-with-scheduling.js --name "gig-scraper"
   pm2 startup
   pm2 save
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "run", "start:scheduler"]
```

## 📈 Performance

- **Memory Usage**: ~50-100MB
- **CPU Usage**: Low (spikes during scraping)
- **Network**: Respectful rate limiting
- **Storage**: Logs rotate automatically

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

---

**🎵 Keep the Irish music scene alive with automated event discovery! 🇮🇪**
