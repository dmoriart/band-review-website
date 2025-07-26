"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gigScrapingService_1 = require("./services/gigScrapingService");
const logger_1 = __importDefault(require("./utils/logger"));
async function testScraping() {
    logger_1.default.info('Starting scraping test...');
    const service = new gigScrapingService_1.GigScrapingService();
    try {
        const results = await service.scrapeAllSources();
        logger_1.default.info('Scraping test completed:', results);
    }
    catch (error) {
        logger_1.default.error('Scraping test failed:', error);
    }
}
testScraping();
//# sourceMappingURL=test-scraping.js.map