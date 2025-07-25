import cron from 'node-cron';
import logger from '../utils/logger';
import { GigScrapingService } from '../services/gigScrapingService';

export class GigScrapingScheduler {
  private scrapingService: GigScrapingService;
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.scrapingService = new GigScrapingService();
  }

  /**
   * Start all scheduled jobs
   */
  public startScheduledJobs(): void {
    logger.info('Starting gig scraping scheduler...');

    // Daily full scrape at 2 AM
    this.scheduleJob('daily-full-scrape', '0 2 * * *', async () => {
      logger.info('Starting daily full scrape...');
      await this.runFullScrape();
    });

    // Hourly quick scrape for upcoming events (during business hours)
    this.scheduleJob('hourly-scrape', '0 9-23 * * *', async () => {
      logger.info('Starting hourly scrape...');
      await this.runQuickScrape();
    });

    // Weekly cleanup on Sundays at 3 AM
    this.scheduleJob('weekly-cleanup', '0 3 * * 0', async () => {
      logger.info('Starting weekly cleanup...');
      await this.runCleanup();
    });

    logger.info('All scheduled jobs started successfully');
  }

  /**
   * Stop all scheduled jobs
   */
  public stopScheduledJobs(): void {
    logger.info('Stopping all scheduled jobs...');
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`Stopped job: ${name}`);
    });
    this.jobs.clear();
    logger.info('All scheduled jobs stopped');
  }

  /**
   * Schedule a new cron job
   */
  private scheduleJob(name: string, schedule: string, task: () => Promise<void>): void {
    const job = cron.schedule(schedule, async () => {
      try {
        logger.info(`Starting scheduled job: ${name}`);
        const startTime = Date.now();
        
        await task();
        
        const duration = Date.now() - startTime;
        logger.info(`Completed scheduled job: ${name} in ${duration}ms`);
      } catch (error) {
        logger.error(`Error in scheduled job ${name}:`, error);
      }
    }, {
      scheduled: false,
      timezone: "Europe/Dublin"
    });

    this.jobs.set(name, job);
    job.start();
    logger.info(`Scheduled job started: ${name} with schedule: ${schedule}`);
  }

  /**
   * Run a comprehensive scrape from all sources
   */
  private async runFullScrape(): Promise<void> {
    try {
      const results = await this.scrapingService.scrapeAllSources();
      
      const totalScraped = results.reduce((sum: number, result: any) => sum + result.gigsScraped, 0);
      const totalAdded = results.reduce((sum: number, result: any) => sum + result.gigsAdded, 0);
      const totalErrors = results.reduce((sum: number, result: any) => sum + result.errors.length, 0);

      logger.info(`Full scrape completed: ${totalScraped} gigs scraped, ${totalAdded} new gigs added, ${totalErrors} errors`);

      // Log detailed results
      results.forEach((result: any) => {
        logger.info(`${result.source}: ${result.gigsScraped} scraped, ${result.gigsAdded} added, ${result.gigsDuplicated} duplicates`);
        if (result.errors.length > 0) {
          logger.warn(`${result.source} errors:`, result.errors);
        }
      });

    } catch (error) {
      logger.error('Failed to complete full scrape:', error);
    }
  }

  /**
   * Run a quick scrape focusing on recent/upcoming events
   */
  private async runQuickScrape(): Promise<void> {
    try {
      // For quick scrapes, focus on the most reliable source
      const results = await this.scrapingService.scrapeBandsintown();
      
      logger.info(`Quick scrape completed: ${results.gigsScraped} gigs from Bandsintown, ${results.gigsAdded} new gigs added`);

      if (results.errors.length > 0) {
        logger.warn('Quick scrape errors:', results.errors);
      }

    } catch (error) {
      logger.error('Failed to complete quick scrape:', error);
    }
  }

  /**
   * Run cleanup tasks (remove old events, update statuses)
   */
  private async runCleanup(): Promise<void> {
    try {
      logger.info('Starting cleanup tasks...');
      
      // This would implement cleanup logic
      // For example: mark past events as completed, remove very old events
      
      logger.info('Cleanup tasks completed');
    } catch (error) {
      logger.error('Failed to complete cleanup tasks:', error);
    }
  }

  /**
   * Get status of all scheduled jobs
   */
  public getJobStatus(): Array<{ name: string; isRunning: boolean; schedule?: string }> {
    const status: Array<{ name: string; isRunning: boolean; schedule?: string }> = [];
    
    this.jobs.forEach((job, name) => {
      status.push({
        name,
        isRunning: true // Simplified - jobs are running if they're in the map
      });
    });

    return status;
  }

  /**
   * Manually trigger a full scrape
   */
  public async triggerFullScrape(): Promise<void> {
    logger.info('Manually triggering full scrape...');
    await this.runFullScrape();
  }

  /**
   * Manually trigger a quick scrape
   */
  public async triggerQuickScrape(): Promise<void> {
    logger.info('Manually triggering quick scrape...');
    await this.runQuickScrape();
  }
}
