"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GigScrapingScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = __importDefault(require("../utils/logger"));
const gigScrapingService_1 = require("../services/gigScrapingService");
class GigScrapingScheduler {
    constructor() {
        this.jobs = new Map();
        this.scrapingService = new gigScrapingService_1.GigScrapingService();
    }
    startScheduledJobs() {
        logger_1.default.info('Starting gig scraping scheduler...');
        this.scheduleJob('daily-full-scrape', '0 2 * * *', async () => {
            logger_1.default.info('Starting daily full scrape...');
            await this.runFullScrape();
        });
        this.scheduleJob('hourly-scrape', '0 9-23 * * *', async () => {
            logger_1.default.info('Starting hourly scrape...');
            await this.runQuickScrape();
        });
        this.scheduleJob('weekly-cleanup', '0 3 * * 0', async () => {
            logger_1.default.info('Starting weekly cleanup...');
            await this.runCleanup();
        });
        logger_1.default.info('All scheduled jobs started successfully');
    }
    stopScheduledJobs() {
        logger_1.default.info('Stopping all scheduled jobs...');
        this.jobs.forEach((job, name) => {
            job.stop();
            logger_1.default.info(`Stopped job: ${name}`);
        });
        this.jobs.clear();
        logger_1.default.info('All scheduled jobs stopped');
    }
    scheduleJob(name, schedule, task) {
        const job = node_cron_1.default.schedule(schedule, async () => {
            try {
                logger_1.default.info(`Starting scheduled job: ${name}`);
                const startTime = Date.now();
                await task();
                const duration = Date.now() - startTime;
                logger_1.default.info(`Completed scheduled job: ${name} in ${duration}ms`);
            }
            catch (error) {
                logger_1.default.error(`Error in scheduled job ${name}:`, error);
            }
        }, {
            scheduled: false,
            timezone: "Europe/Dublin"
        });
        this.jobs.set(name, job);
        job.start();
        logger_1.default.info(`Scheduled job started: ${name} with schedule: ${schedule}`);
    }
    async runFullScrape() {
        try {
            const results = await this.scrapingService.scrapeAllSources();
            const totalScraped = results.reduce((sum, result) => sum + result.gigsScraped, 0);
            const totalAdded = results.reduce((sum, result) => sum + result.gigsAdded, 0);
            const totalErrors = results.reduce((sum, result) => sum + result.errors.length, 0);
            logger_1.default.info(`Full scrape completed: ${totalScraped} gigs scraped, ${totalAdded} new gigs added, ${totalErrors} errors`);
            results.forEach((result) => {
                logger_1.default.info(`${result.source}: ${result.gigsScraped} scraped, ${result.gigsAdded} added, ${result.gigsDuplicated} duplicates`);
                if (result.errors.length > 0) {
                    logger_1.default.warn(`${result.source} errors:`, result.errors);
                }
            });
        }
        catch (error) {
            logger_1.default.error('Failed to complete full scrape:', error);
        }
    }
    async runQuickScrape() {
        try {
            const results = await this.scrapingService.scrapeBandsintown();
            logger_1.default.info(`Quick scrape completed: ${results.gigsScraped} gigs from Bandsintown, ${results.gigsAdded} new gigs added`);
            if (results.errors.length > 0) {
                logger_1.default.warn('Quick scrape errors:', results.errors);
            }
        }
        catch (error) {
            logger_1.default.error('Failed to complete quick scrape:', error);
        }
    }
    async runCleanup() {
        try {
            logger_1.default.info('Starting cleanup tasks...');
            logger_1.default.info('Cleanup tasks completed');
        }
        catch (error) {
            logger_1.default.error('Failed to complete cleanup tasks:', error);
        }
    }
    getJobStatus() {
        const status = [];
        this.jobs.forEach((job, name) => {
            status.push({
                name,
                isRunning: true
            });
        });
        return status;
    }
    async triggerFullScrape() {
        logger_1.default.info('Manually triggering full scrape...');
        await this.runFullScrape();
    }
    async triggerQuickScrape() {
        logger_1.default.info('Manually triggering quick scrape...');
        await this.runQuickScrape();
    }
}
exports.GigScrapingScheduler = GigScrapingScheduler;
//# sourceMappingURL=gigScrapingScheduler.js.map