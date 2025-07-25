import { GigScrapingService } from './services/gigScrapingService';
import logger from './utils/logger';

async function testScraping() {
  logger.info('Starting scraping test...');
  
  const service = new GigScrapingService();
  
  try {
    const results = await service.scrapeAllSources();
    logger.info('Scraping test completed:', results);
  } catch (error) {
    logger.error('Scraping test failed:', error);
  }
}

testScraping();
