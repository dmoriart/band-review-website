import express from 'express';
import cors from 'cors';
import logger from './utils/logger';
import { GigScrapingScheduler } from './services/gigScrapingScheduler';

const app = express();
const port = process.env.PORT || 3001;

// Initialize scheduler
const scheduler = new GigScrapingScheduler();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'band-review-backend'
  });
});

// Scraping endpoints
app.get('/api/scraping/status', (req, res) => {
  try {
    const status = scheduler.getJobStatus();
    res.json({ jobs: status });
  } catch (error) {
    logger.error('Error getting scraping status:', error);
    res.status(500).json({ error: 'Failed to get scraping status' });
  }
});

app.post('/api/scraping/trigger/full', async (req, res) => {
  try {
    logger.info('Manual full scrape triggered via API');
    scheduler.triggerFullScrape(); // Don't await - run in background
    res.json({ message: 'Full scrape triggered successfully' });
  } catch (error) {
    logger.error('Error triggering full scrape:', error);
    res.status(500).json({ error: 'Failed to trigger full scrape' });
  }
});

app.post('/api/scraping/trigger/quick', async (req, res) => {
  try {
    logger.info('Manual quick scrape triggered via API');
    scheduler.triggerQuickScrape(); // Don't await - run in background
    res.json({ message: 'Quick scrape triggered successfully' });
  } catch (error) {
    logger.error('Error triggering quick scrape:', error);
    res.status(500).json({ error: 'Failed to trigger quick scrape' });
  }
});

// Start scheduler
scheduler.startScheduledJobs();
logger.info('Gig scraping scheduler started');

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  scheduler.stopScheduledJobs();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  scheduler.stopScheduledJobs();
  process.exit(0);
});

// Start server
app.listen(port, () => {
  logger.info(`Backend server running on port ${port}`);
});

export default app;
