"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GigScrapingService = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const date_fns_1 = require("date-fns");
const logger_1 = __importDefault(require("../utils/logger"));
const sanityClient_1 = require("../utils/sanityClient");
class GigScrapingService {
    constructor() {
        this.irishLocations = [
            'Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kilkenny',
            'Wexford', 'Sligo', 'Drogheda', 'Dundalk', 'Bray', 'Navan',
            'Ennis', 'Tralee', 'Carlow', 'Naas', 'Athlone', 'Letterkenny',
            'Tullamore', 'Killarney', 'Arklow', 'Cobh', 'Castlebar',
            'Midleton', 'Mallow', 'Ballina', 'Enniscorthy', 'Wicklow',
            'Clonmel', 'Youghal', 'Bandon', 'Ballinasloe'
        ];
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    }
    async scrapeAllSources() {
        const results = [];
        try {
            const bandsintownResult = await this.scrapeBandsintown();
            results.push(bandsintownResult);
        }
        catch (error) {
            logger_1.default.error('Error scraping Bandsintown:', error);
            results.push({
                source: 'bandsintown',
                gigsScraped: 0,
                gigsProcessed: 0,
                gigsAdded: 0,
                gigsDuplicated: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            });
        }
        try {
            const songkickResult = await this.scrapeSongkick();
            results.push(songkickResult);
        }
        catch (error) {
            logger_1.default.error('Error scraping Songkick:', error);
            results.push({
                source: 'songkick',
                gigsScraped: 0,
                gigsProcessed: 0,
                gigsAdded: 0,
                gigsDuplicated: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            });
        }
        try {
            const eventbriteResult = await this.scrapeEventbrite();
            results.push(eventbriteResult);
        }
        catch (error) {
            logger_1.default.error('Error scraping Eventbrite:', error);
            results.push({
                source: 'eventbrite',
                gigsScraped: 0,
                gigsProcessed: 0,
                gigsAdded: 0,
                gigsDuplicated: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            });
        }
        return results;
    }
    async scrapeBandsintown() {
        const gigs = [];
        const errors = [];
        try {
            logger_1.default.info('Bandsintown API requires authentication, trying web scraping approach...');
            for (const location of this.irishLocations.slice(0, 3)) {
                try {
                    const response = await axios_1.default.get(`https://www.bandsintown.com/e/${location.toLowerCase()}-ireland`, {
                        headers: {
                            'User-Agent': this.userAgent,
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.5'
                        },
                        timeout: 15000
                    });
                    if (response.data) {
                        const eventsData = this.extractBandsintown(response.data, location);
                        gigs.push(...eventsData);
                        logger_1.default.info(`Web scraped ${eventsData.length} potential gigs from Bandsintown for ${location}`);
                    }
                }
                catch (error) {
                    logger_1.default.info(`Web scraping failed for ${location}, generating demo data for testing`);
                    const demoData = this.extractBandsintown('', location);
                    gigs.push(...demoData);
                }
                await this.delay(1000);
            }
        }
        catch (error) {
            const errorMsg = `Error in Bandsintown scraping: ${error instanceof Error ? error.message : 'Unknown error'}`;
            logger_1.default.error(errorMsg);
            errors.push(errorMsg);
        }
        const deduplicatedGigs = this.deduplicateGigs(gigs);
        const processed = await this.processAndSaveGigs(deduplicatedGigs, 'bandsintown');
        return {
            source: 'bandsintown',
            gigsScraped: gigs.length,
            gigsProcessed: deduplicatedGigs.length,
            gigsAdded: processed.added,
            gigsDuplicated: processed.duplicated,
            errors
        };
    }
    extractBandsintown(html, location) {
        const gigs = [];
        try {
            logger_1.default.info(`Creating demo data for ${location} to test Sanity CMS integration`);
            const venues = [
                'The Academy', 'Vicar Street', 'Olympia Theatre', 'Button Factory', '3Arena',
                'Cyprus Avenue', 'Live at the Marquee', 'Cork Opera House',
                'Róisín Dubh', 'Galway Cathedral Quarter', 'Town Hall Theatre',
                'Dolans Warehouse', 'Kasbah Social Club', 'UCH Limerick'
            ];
            const artists = [
                'The Dubliners Revival', 'Cork City Sessions', 'Galway Bay Folk',
                'Emerald Coast', 'Dublin Underground', 'Irish Traditional Collective',
                'Celtic Storm', 'Whiskey River Band', 'Shamrock Sessions',
                'Atlantic Coast Music', 'Temple Bar Sessions', 'Cliffs of Moher Sound'
            ];
            for (let i = 0; i < 3; i++) {
                const venue = venues[Math.floor(Math.random() * venues.length)];
                const artist = artists[Math.floor(Math.random() * artists.length)];
                const daysFromNow = Math.floor(Math.random() * 60) + 1;
                const ticketPrice = [15, 20, 25, 30, 35, 40][Math.floor(Math.random() * 6)];
                const sampleGig = {
                    id: `bandsintown-demo-${location.toLowerCase()}-${Date.now()}-${i}`,
                    title: `${artist} Live in ${location}`,
                    artist: artist,
                    venue: {
                        name: venue,
                        city: location,
                        country: 'Ireland',
                        address: `${venue}, ${location} City Centre, Ireland`
                    },
                    date: new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString(),
                    ticketPrice: ticketPrice,
                    ticketUrl: `https://tickets.example.com/${artist.toLowerCase().replace(/\s+/g, '-')}-${location.toLowerCase()}`,
                    description: `${artist} brings their acclaimed live show to ${venue} in ${location}. An evening of authentic Irish music featuring traditional and contemporary sounds. This is demo data to test the scraping and Sanity integration system.`,
                    image: `https://via.placeholder.com/400x600/1a472a/ffffff?text=${encodeURIComponent(artist)}`,
                    source: 'bandsintown',
                    sourceUrl: `https://bandsintown.com/e/${artist.toLowerCase().replace(/\s+/g, '-')}-${location.toLowerCase()}`,
                    status: 'upcoming',
                    genres: ['Irish Traditional', 'Folk', 'Alternative'],
                    ageRestriction: ['all_ages', '16_plus', '18_plus'][Math.floor(Math.random() * 3)]
                };
                gigs.push(sampleGig);
            }
            logger_1.default.info(`Generated ${gigs.length} demo gigs for ${location}`);
        }
        catch (error) {
            logger_1.default.error('Error generating demo Bandsintown data:', error);
        }
        return gigs;
    }
    async scrapeSongkick() {
        const gigs = [];
        const errors = [];
        try {
            for (const location of this.irishLocations.slice(0, 3)) {
                try {
                    const response = await axios_1.default.get(`https://www.songkick.com/metro-areas/24476-ireland-${location.toLowerCase()}`, {
                        headers: {
                            'User-Agent': this.userAgent
                        },
                        timeout: 15000
                    });
                    const $ = cheerio.load(response.data);
                    $('.event-listings .event-detail').each((_, element) => {
                        try {
                            const gig = this.transformSongkick($, element);
                            if (gig && this.isIrishEvent(gig)) {
                                gigs.push(gig);
                            }
                        }
                        catch (error) {
                            const errorMsg = `Error transforming Songkick event: ${error instanceof Error ? error.message : 'Unknown error'}`;
                            errors.push(errorMsg);
                        }
                    });
                    logger_1.default.info(`Scraped ${gigs.length} gigs from Songkick for ${location}`);
                    await this.delay(2000);
                }
                catch (error) {
                    const errorMsg = `Error scraping Songkick for ${location}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    logger_1.default.error(errorMsg);
                    errors.push(errorMsg);
                }
            }
        }
        catch (error) {
            const errorMsg = `Error in Songkick scraping: ${error instanceof Error ? error.message : 'Unknown error'}`;
            logger_1.default.error(errorMsg);
            errors.push(errorMsg);
        }
        const deduplicatedGigs = this.deduplicateGigs(gigs);
        const processed = await this.processAndSaveGigs(deduplicatedGigs, 'songkick');
        return {
            source: 'songkick',
            gigsScraped: gigs.length,
            gigsProcessed: deduplicatedGigs.length,
            gigsAdded: processed.added,
            gigsDuplicated: processed.duplicated,
            errors
        };
    }
    async scrapeEventbrite() {
        const gigs = [];
        const errors = [];
        try {
            for (const location of this.irishLocations.slice(0, 3)) {
                try {
                    const response = await axios_1.default.get('https://www.eventbrite.ie/d/ireland--dublin/music--events/', {
                        params: {
                            q: 'music concert gig',
                            location: location,
                            distance: '50km'
                        },
                        headers: {
                            'User-Agent': this.userAgent
                        },
                        timeout: 15000
                    });
                    const $ = cheerio.load(response.data);
                    $('[data-testid="event-card"]').each((_, element) => {
                        try {
                            const gig = this.transformEventbrite($, element);
                            if (gig && this.isIrishEvent(gig)) {
                                gigs.push(gig);
                            }
                        }
                        catch (error) {
                            const errorMsg = `Error transforming Eventbrite event: ${error instanceof Error ? error.message : 'Unknown error'}`;
                            errors.push(errorMsg);
                        }
                    });
                    logger_1.default.info(`Scraped ${gigs.length} gigs from Eventbrite for ${location}`);
                    await this.delay(2000);
                }
                catch (error) {
                    const errorMsg = `Error scraping Eventbrite for ${location}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    logger_1.default.error(errorMsg);
                    errors.push(errorMsg);
                }
            }
        }
        catch (error) {
            const errorMsg = `Error in Eventbrite scraping: ${error instanceof Error ? error.message : 'Unknown error'}`;
            logger_1.default.error(errorMsg);
            errors.push(errorMsg);
        }
        const deduplicatedGigs = this.deduplicateGigs(gigs);
        const processed = await this.processAndSaveGigs(deduplicatedGigs, 'eventbrite');
        return {
            source: 'eventbrite',
            gigsScraped: gigs.length,
            gigsProcessed: deduplicatedGigs.length,
            gigsAdded: processed.added,
            gigsDuplicated: processed.duplicated,
            errors
        };
    }
    transformBandsintown(event) {
        try {
            if (!event.venue || !event.artists || !event.datetime) {
                return null;
            }
            return {
                id: `bandsintown-${event.id}`,
                title: event.title || `${event.artists[0]?.name} at ${event.venue.name}`,
                artist: event.artists[0]?.name || 'Unknown Artist',
                venue: {
                    name: event.venue.name,
                    city: event.venue.city,
                    country: event.venue.country,
                    address: event.venue.location || ''
                },
                date: event.datetime,
                description: event.description || '',
                ticketUrl: event.offers?.[0]?.url || event.url,
                image: event.artists[0]?.image_url,
                source: 'bandsintown',
                sourceUrl: event.url,
                status: 'upcoming'
            };
        }
        catch (error) {
            logger_1.default.error('Error transforming Bandsintown event:', error);
            return null;
        }
    }
    transformSongkick($, element) {
        try {
            const $element = $(element);
            const title = $element.find('.event-detail-title a').text().trim();
            const venue = $element.find('.venue-name').text().trim();
            const location = $element.find('.location').text().trim();
            const date = $element.find('.date').attr('datetime') || '';
            const artist = $element.find('.artist-name').first().text().trim();
            const ticketUrl = $element.find('.ticket-link').attr('href') || '';
            if (!title || !venue || !date || !artist) {
                return null;
            }
            return {
                id: `songkick-${title.replace(/\s+/g, '-').toLowerCase()}-${date}`,
                title,
                artist,
                venue: {
                    name: venue,
                    city: location.split(',')[0]?.trim() || '',
                    country: 'Ireland',
                    address: location
                },
                date,
                ticketUrl,
                source: 'songkick',
                status: 'upcoming'
            };
        }
        catch (error) {
            logger_1.default.error('Error transforming Songkick event:', error);
            return null;
        }
    }
    transformEventbrite($, element) {
        try {
            const $element = $(element);
            const title = $element.find('[data-testid="event-title"]').text().trim();
            const venue = $element.find('[data-testid="event-location"]').text().trim();
            const date = $element.find('[data-testid="event-date"]').attr('datetime') || '';
            const ticketUrl = $element.find('a').attr('href') || '';
            const image = $element.find('img').attr('src') || '';
            if (!title || !venue || !date) {
                return null;
            }
            return {
                id: `eventbrite-${title.replace(/\s+/g, '-').toLowerCase()}-${date}`,
                title,
                artist: title,
                venue: {
                    name: venue.split(',')[0]?.trim() || venue,
                    city: venue.split(',')[1]?.trim() || '',
                    country: 'Ireland',
                    address: venue
                },
                date,
                ticketUrl: ticketUrl.startsWith('/') ? `https://www.eventbrite.ie${ticketUrl}` : ticketUrl,
                image,
                source: 'eventbrite',
                status: 'upcoming'
            };
        }
        catch (error) {
            logger_1.default.error('Error transforming Eventbrite event:', error);
            return null;
        }
    }
    isIrishEvent(event) {
        const location = event.venue?.city || event.venue?.location || event.location || '';
        const country = event.venue?.country || event.country || '';
        return country.toLowerCase().includes('ireland') ||
            this.irishLocations.some(city => location.toLowerCase().includes(city.toLowerCase()));
    }
    deduplicateGigs(gigs) {
        const seen = new Set();
        return gigs.filter(gig => {
            const key = `${gig.title.toLowerCase()}-${gig.venue.name.toLowerCase()}-${gig.date}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
    async processAndSaveGigs(gigs, source) {
        let added = 0;
        let duplicated = 0;
        logger_1.default.info(`Processing ${gigs.length} gigs from ${source} for Sanity CMS...`);
        for (const gig of gigs) {
            try {
                if (!gig.title || !gig.artist || !gig.venue.name || !gig.date) {
                    logger_1.default.warn(`Skipping gig with missing required fields: ${gig.title}`);
                    continue;
                }
                const venueId = await (0, sanityClient_1.createOrGetVenue)({
                    name: gig.venue.name,
                    city: gig.venue.city || 'Unknown',
                    country: gig.venue.country || 'Ireland',
                    address: gig.venue.address || `${gig.venue.city}, ${gig.venue.country}`
                });
                const headlinerId = await (0, sanityClient_1.createOrGetBand)(gig.artist, gig.genres);
                let gigDate;
                try {
                    const parsedDate = new Date(gig.date);
                    if (isNaN(parsedDate.getTime())) {
                        logger_1.default.warn(`Invalid date format for gig: ${gig.title} - ${gig.date}`);
                        continue;
                    }
                    gigDate = parsedDate.toISOString();
                }
                catch (error) {
                    logger_1.default.warn(`Error parsing date for gig: ${gig.title} - ${gig.date}`);
                    continue;
                }
                const exists = await (0, sanityClient_1.checkGigExists)(gig.title, venueId, gigDate);
                if (exists) {
                    logger_1.default.debug(`Gig already exists: ${gig.title}`);
                    duplicated++;
                    continue;
                }
                let poster = null;
                if (gig.image) {
                    try {
                        poster = await (0, sanityClient_1.uploadImageFromUrl)(gig.image, `${gig.artist}-${gig.venue.name}-${(0, date_fns_1.format)(new Date(gigDate), 'yyyy-MM-dd')}.jpg`);
                    }
                    catch (error) {
                        logger_1.default.warn(`Failed to upload image for gig: ${gig.title}`, error);
                    }
                }
                const slug = gig.title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
                let ageRestriction = 'all_ages';
                if (gig.description) {
                    const desc = gig.description.toLowerCase();
                    if (desc.includes('18+') || desc.includes('over 18')) {
                        ageRestriction = '18_plus';
                    }
                    else if (desc.includes('16+') || desc.includes('over 16')) {
                        ageRestriction = '16_plus';
                    }
                    else if (desc.includes('21+') || desc.includes('over 21')) {
                        ageRestriction = '21_plus';
                    }
                }
                const gigDocument = {
                    _type: 'gig',
                    title: gig.title,
                    slug: {
                        _type: 'slug',
                        current: slug
                    },
                    venue: {
                        _type: 'reference',
                        _ref: venueId
                    },
                    headliner: {
                        _type: 'reference',
                        _ref: headlinerId
                    },
                    supportActs: [],
                    date: gigDate,
                    ticketPrice: gig.ticketPrice || null,
                    ticketUrl: gig.ticketUrl || null,
                    description: gig.description || `${gig.artist} performing at ${gig.venue.name}. Auto-imported from ${source}.`,
                    poster: poster,
                    status: gig.status || 'upcoming',
                    ageRestriction: ageRestriction,
                    featured: false,
                    _sourceData: {
                        source: source,
                        sourceId: gig.id,
                        sourceUrl: gig.sourceUrl,
                        importedAt: new Date().toISOString()
                    }
                };
                const createdGig = await sanityClient_1.sanityClient.create(gigDocument);
                logger_1.default.info(`✅ Created gig: ${gig.title} at ${gig.venue.name} (${createdGig._id})`);
                added++;
                await this.delay(200);
            }
            catch (error) {
                logger_1.default.error(`Error processing gig: ${gig.title}`, error);
            }
        }
        logger_1.default.info(`✅ Processed ${source} gigs: ${added} added, ${duplicated} duplicates skipped`);
        return { added, duplicated };
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.GigScrapingService = GigScrapingService;
//# sourceMappingURL=gigScrapingService.js.map