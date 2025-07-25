const cron = require('node-cron');

console.log('🚀 Backend gig scraping system started');
console.log('📅 Scheduled jobs:');
console.log('  - Daily full scrape: 2:00 AM');
console.log('  - Hourly quick scrape: 9 AM - 11 PM');
console.log('  - Weekly cleanup: Sunday 3:00 AM');

// Daily full scrape at 2 AM
const dailyJob = cron.schedule('0 2 * * *', () => {
  console.log('🔄 Running daily full scrape...', new Date().toISOString());
}, {
  scheduled: false,
  timezone: "Europe/Dublin"
});

// Hourly quick scrape (during business hours)
const hourlyJob = cron.schedule('0 9-23 * * *', () => {
  console.log('⚡ Running hourly quick scrape...', new Date().toISOString());
}, {
  scheduled: false,
  timezone: "Europe/Dublin"
});

// Weekly cleanup on Sundays at 3 AM
const weeklyJob = cron.schedule('0 3 * * 0', () => {
  console.log('🧹 Running weekly cleanup...', new Date().toISOString());
}, {
  scheduled: false,
  timezone: "Europe/Dublin"
});

// Start all jobs
dailyJob.start();
hourlyJob.start();
weeklyJob.start();

console.log('✅ All cron jobs started successfully');

// Test job every 10 seconds for demo
const testJob = cron.schedule('*/10 * * * * *', () => {
  console.log('🧪 Test scrape simulation...', new Date().toISOString());
}, {
  scheduled: false
});

testJob.start();
console.log('🧪 Test job started (every 10 seconds)');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, stopping all jobs...');
  dailyJob.stop();
  hourlyJob.stop();
  weeklyJob.stop();
  testJob.stop();
  console.log('👋 Goodbye!');
  process.exit(0);
});

console.log('\n📊 System running. Press Ctrl+C to stop.');
console.log('🌐 API endpoints available:');
console.log('  - GET /api/scraping/status');
console.log('  - POST /api/scraping/trigger/full');
console.log('  - POST /api/scraping/trigger/quick');
