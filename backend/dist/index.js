"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const logger_1 = __importDefault(require("./utils/logger"));
const gigScrapingScheduler_1 = require("./services/gigScrapingScheduler");
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
const scheduler = new gigScrapingScheduler_1.GigScrapingScheduler();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'band-review-backend'
    });
});
app.get('/api/scraping/status', (req, res) => {
    try {
        const status = scheduler.getJobStatus();
        res.json({ jobs: status });
    }
    catch (error) {
        logger_1.default.error('Error getting scraping status:', error);
        res.status(500).json({ error: 'Failed to get scraping status' });
    }
});
app.post('/api/scraping/trigger/full', async (req, res) => {
    try {
        logger_1.default.info('Manual full scrape triggered via API');
        scheduler.triggerFullScrape();
        res.json({ message: 'Full scrape triggered successfully' });
    }
    catch (error) {
        logger_1.default.error('Error triggering full scrape:', error);
        res.status(500).json({ error: 'Failed to trigger full scrape' });
    }
});
app.post('/api/scraping/trigger/quick', async (req, res) => {
    try {
        logger_1.default.info('Manual quick scrape triggered via API');
        scheduler.triggerQuickScrape();
        res.json({ message: 'Quick scrape triggered successfully' });
    }
    catch (error) {
        logger_1.default.error('Error triggering quick scrape:', error);
        res.status(500).json({ error: 'Failed to trigger quick scrape' });
    }
});
scheduler.startScheduledJobs();
logger_1.default.info('Gig scraping scheduler started');
process.on('SIGINT', () => {
    logger_1.default.info('Received SIGINT, shutting down gracefully...');
    scheduler.stopScheduledJobs();
    process.exit(0);
});
process.on('SIGTERM', () => {
    logger_1.default.info('Received SIGTERM, shutting down gracefully...');
    scheduler.stopScheduledJobs();
    process.exit(0);
});
app.listen(port, () => {
    logger_1.default.info(`Backend server running on port ${port}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map