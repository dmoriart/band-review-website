const express = require('express');
const cron = require('node-cron');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Job status tracking
const jobStatus = {
  lastFullScrape: null,
  lastQuickScrape: null,
  lastCleanup: null,
  totalGigsScraped: 0,
  isRunning: false
};

// Mock scraping functions
async function runFullScrape() {
  console.log('🔄 Starting full scrape from all sources...');
  jobStatus.isRunning = true;
  
  // Simulate scraping delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const mockResults = {
    bandsintown: Math.floor(Math.random() * 50) + 10,
    songkick: Math.floor(Math.random() * 30) + 5,
    eventbrite: Math.floor(Math.random() * 20) + 3
  };
  
  const totalGigs = Object.values(mockResults).reduce((sum, count) => sum + count, 0);
  jobStatus.totalGigsScraped += totalGigs;
  jobStatus.lastFullScrape = new Date().toISOString();
  jobStatus.isRunning = false;
  
  console.log(`✅ Full scrape completed: ${totalGigs} gigs found`);
  console.log('   Sources:', mockResults);
  
  return { totalGigs, sources: mockResults };
}

async function runQuickScrape() {
  console.log('⚡ Starting quick scrape (recent events)...');
  jobStatus.isRunning = true;
  
  // Simulate quick scraping
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const gigsFound = Math.floor(Math.random() * 15) + 3;
  jobStatus.totalGigsScraped += gigsFound;
  jobStatus.lastQuickScrape = new Date().toISOString();
  jobStatus.isRunning = false;
  
  console.log(`✅ Quick scrape completed: ${gigsFound} new gigs found`);
  
  return { gigsFound };
}

async function runCleanup() {
  console.log('🧹 Starting weekly cleanup...');
  
  // Simulate cleanup
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const oldEventsRemoved = Math.floor(Math.random() * 10) + 2;
  jobStatus.lastCleanup = new Date().toISOString();
  
  console.log(`✅ Cleanup completed: ${oldEventsRemoved} old events processed`);
  
  return { oldEventsRemoved };
}

// Schedule jobs
console.log('📅 Setting up scheduled jobs...');

// Daily full scrape at 2 AM
const dailyJob = cron.schedule('0 2 * * *', async () => {
  await runFullScrape();
}, {
  scheduled: true,
  timezone: "Europe/Dublin"
});

// Hourly quick scrape (during business hours)
const hourlyJob = cron.schedule('0 9-23 * * *', async () => {
  await runQuickScrape();
}, {
  scheduled: true,
  timezone: "Europe/Dublin"
});

// Weekly cleanup on Sundays at 3 AM
const weeklyJob = cron.schedule('0 3 * * 0', async () => {
  await runCleanup();
}, {
  scheduled: true,
  timezone: "Europe/Dublin"
});

// Demo job every 30 seconds (remove in production)
const demoJob = cron.schedule('*/30 * * * * *', async () => {
  console.log('🧪 Demo scrape running...', new Date().toLocaleString());
  await runQuickScrape();
}, {
  scheduled: true
});

// API Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'band-review-backend-scheduler'
  });
});

app.get('/api/scraping/status', (req, res) => {
  res.json({
    ...jobStatus,
    scheduledJobs: [
      { name: 'daily-full-scrape', schedule: '0 2 * * *', description: 'Daily comprehensive scrape at 2 AM' },
      { name: 'hourly-quick-scrape', schedule: '0 9-23 * * *', description: 'Hourly updates during business hours' },
      { name: 'weekly-cleanup', schedule: '0 3 * * 0', description: 'Weekly cleanup on Sunday at 3 AM' },
      { name: 'demo-scrape', schedule: '*/30 * * * * *', description: 'Demo job every 30 seconds' }
    ]
  });
});

app.post('/api/scraping/trigger/full', async (req, res) => {
  try {
    console.log('📞 Manual full scrape triggered via API');
    const result = await runFullScrape();
    res.json({ 
      message: 'Full scrape completed successfully',
      result 
    });
  } catch (error) {
    console.error('❌ Error in manual full scrape:', error);
    res.status(500).json({ error: 'Failed to run full scrape' });
  }
});

app.post('/api/scraping/trigger/quick', async (req, res) => {
  try {
    console.log('📞 Manual quick scrape triggered via API');
    const result = await runQuickScrape();
    res.json({ 
      message: 'Quick scrape completed successfully',
      result 
    });
  } catch (error) {
    console.error('❌ Error in manual quick scrape:', error);
    res.status(500).json({ error: 'Failed to run quick scrape' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`\n🚀 Band Review Backend started on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`📋 Scraping status: http://localhost:${port}/api/scraping/status`);
  console.log(`\n📅 Scheduled jobs active:`);
  console.log(`   • Daily full scrape: 2:00 AM (Dublin time)`);
  console.log(`   • Hourly quick scrape: 9 AM - 11 PM (Dublin time)`);
  console.log(`   • Weekly cleanup: Sunday 3:00 AM (Dublin time)`);
  console.log(`   • Demo scrape: Every 30 seconds (remove in production)`);
  console.log(`\n🔧 Manual triggers available:`);
  console.log(`   • POST /api/scraping/trigger/full`);
  console.log(`   • POST /api/scraping/trigger/quick`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  dailyJob.stop();
  hourlyJob.stop();
  weeklyJob.stop();
  demoJob.stop();
  console.log('📅 All scheduled jobs stopped');
  console.log('👋 Goodbye!');
  process.exit(0);
});
