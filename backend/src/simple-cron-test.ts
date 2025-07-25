import cron from 'node-cron';

console.log('Starting simple cron test...');

// Test cron job every minute
const job = cron.schedule('* * * * *', () => {
  console.log('Cron job executed at:', new Date().toISOString());
}, {
  scheduled: false
});

job.start();
console.log('Cron job started');

// Keep the process alive
setInterval(() => {
  // Keep alive
}, 60000);
