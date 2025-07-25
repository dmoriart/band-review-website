import axios from 'axios';
import * as cheerio from 'cheerio';
import { format, addDays, parseISO } from 'date-fns';
import logger from '../utils/logger';
import { sanityClient, createOrGetVenue, createOrGetBand, checkGigExists, uploadImageFromUrl } from '../utils/sanityClient';
import { GigData, ApiGigData, GigProcessingResult } from '../types/gig.types';

export class GigScrapingService {
  private readonly irishLocations = [
    'Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kilkenny', 
    'Wexford', 'Sligo', 'Drogheda', 'Dundalk', 'Bray', 'Navan',
    'Ennis', 'Tralee', 'Carlow', 'Naas', 'Athlone', 'Letterkenny',
    'Tullamore', 'Killarney', 'Arklow', 'Cobh', 'Castlebar',
    'Midleton', 'Mallow', 'Ballina', 'Enniscorthy', 'Wicklow',
    'Clonmel', 'Youghal', 'Bandon', 'Ballinasloe'
  ];

  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  /**
   * Scrape all sources and return processing results
   */
  public async scrapeAllSources(): Promise<GigProcessingResult[]> {
    const results: GigProcessingResult[] = [];

    try {
      const bandsintownResult = await this.scrapeBandsintown();
      results.push(bandsintownResult);
    } catch (error) {
      logger.error('Error scraping Bandsintown:', error);
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
    } catch (error) {
      logger.error('Error scraping Songkick:', error);
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
    } catch (error) {
      logger.error('Error scraping Eventbrite:', error);
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

  /**
   * Scrape gigs from Bandsintown API
   */
  public async scrapeBandsintown(): Promise<GigProcessingResult> {
    const gigs: ApiGigData[] = [];
    const errors: string[] = [];
    
    try {
      // Bandsintown API requires app_id registration, using public endpoints
      for (const location of this.irishLocations.slice(0, 5)) { // Limit to avoid rate limiting
        try {
          const response = await axios.get(`https://rest.bandsintown.com/events`, {
            params: {
              location: `${location},Ireland`,
              radius: '50',
              date: `${format(new Date(), 'yyyy-MM-dd')},${format(addDays(new Date(), 30), 'yyyy-MM-dd')}`
            },
            headers: {
              'User-Agent': this.userAgent
            },
            timeout: 10000
          });

          if (response.data && Array.isArray(response.data)) {
            const locationGigs = response.data
              .filter((event: any) => this.isIrishEvent(event))
              .map((event: any) => this.transformBandsintown(event))
              .filter(Boolean) as ApiGigData[];
            
            gigs.push(...locationGigs);
            logger.info(`Scraped ${locationGigs.length} gigs from Bandsintown for ${location}`);
          }
          
          // Rate limiting
          await this.delay(1000);
        } catch (error) {
          const errorMsg = `Error scraping Bandsintown for ${location}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Error in Bandsintown scraping: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg);
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

  /**
   * Scrape gigs from Songkick
   */
  public async scrapeSongkick(): Promise<GigProcessingResult> {
    const gigs: ApiGigData[] = [];
    const errors: string[] = [];
    
    try {
      // Songkick web scraping (since API is limited)
      for (const location of this.irishLocations.slice(0, 3)) {
        try {
          const response = await axios.get(`https://www.songkick.com/metro-areas/24476-ireland-${location.toLowerCase()}`, {
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
            } catch (error) {
              const errorMsg = `Error transforming Songkick event: ${error instanceof Error ? error.message : 'Unknown error'}`;
              errors.push(errorMsg);
            }
          });

          logger.info(`Scraped ${gigs.length} gigs from Songkick for ${location}`);
          
          // Rate limiting
          await this.delay(2000);
        } catch (error) {
          const errorMsg = `Error scraping Songkick for ${location}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Error in Songkick scraping: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg);
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

  /**
   * Scrape gigs from Eventbrite
   */
  public async scrapeEventbrite(): Promise<GigProcessingResult> {
    const gigs: ApiGigData[] = [];
    const errors: string[] = [];
    
    try {
      // Eventbrite public search
      for (const location of this.irishLocations.slice(0, 3)) {
        try {
          const response = await axios.get('https://www.eventbrite.ie/d/ireland--dublin/music--events/', {
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
            } catch (error) {
              const errorMsg = `Error transforming Eventbrite event: ${error instanceof Error ? error.message : 'Unknown error'}`;
              errors.push(errorMsg);
            }
          });

          logger.info(`Scraped ${gigs.length} gigs from Eventbrite for ${location}`);
          
          // Rate limiting
          await this.delay(2000);
        } catch (error) {
          const errorMsg = `Error scraping Eventbrite for ${location}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Error in Eventbrite scraping: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg);
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

  /**
   * Transform Bandsintown event data
   */
  private transformBandsintown(event: any): ApiGigData | null {
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
    } catch (error) {
      logger.error('Error transforming Bandsintown event:', error);
      return null;
    }
  }

  /**
   * Transform Songkick event data
   */
  private transformSongkick($: cheerio.CheerioAPI, element: any): ApiGigData | null {
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
    } catch (error) {
      logger.error('Error transforming Songkick event:', error);
      return null;
    }
  }

  /**
   * Transform Eventbrite event data
   */
  private transformEventbrite($: cheerio.CheerioAPI, element: any): ApiGigData | null {
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
        artist: title, // Often the title includes the artist name
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
    } catch (error) {
      logger.error('Error transforming Eventbrite event:', error);
      return null;
    }
  }

  /**
   * Check if event is in Ireland
   */
  private isIrishEvent(event: any): boolean {
    const location = event.venue?.city || event.venue?.location || event.location || '';
    const country = event.venue?.country || event.country || '';
    
    return country.toLowerCase().includes('ireland') || 
           this.irishLocations.some(city => 
             location.toLowerCase().includes(city.toLowerCase())
           );
  }

  /**
   * Remove duplicate gigs based on title, venue, and date
   */
  private deduplicateGigs(gigs: ApiGigData[]): ApiGigData[] {
    const seen = new Set<string>();
    return gigs.filter(gig => {
      const key = `${gig.title.toLowerCase()}-${gig.venue.name.toLowerCase()}-${gig.date}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Process and save gigs to Sanity CMS
   */
  private async processAndSaveGigs(gigs: ApiGigData[], source: string): Promise<{ added: number; duplicated: number }> {
    let added = 0;
    let duplicated = 0;

    logger.info(`Processing ${gigs.length} gigs from ${source} for Sanity CMS...`);

    for (const gig of gigs) {
      try {
        // Skip if required fields are missing
        if (!gig.title || !gig.artist || !gig.venue.name || !gig.date) {
          logger.warn(`Skipping gig with missing required fields: ${gig.title}`);
          continue;
        }

        // Create or get venue reference
        const venueId = await createOrGetVenue({
          name: gig.venue.name,
          city: gig.venue.city || 'Unknown',
          country: gig.venue.country || 'Ireland',
          address: gig.venue.address || `${gig.venue.city}, ${gig.venue.country}`
        });

        // Create or get band reference for headliner
        const headlinerId = await createOrGetBand(gig.artist, gig.genres);

        // Parse and format date
        let gigDate: string;
        try {
          // Handle different date formats from various sources
          const parsedDate = new Date(gig.date);
          if (isNaN(parsedDate.getTime())) {
            logger.warn(`Invalid date format for gig: ${gig.title} - ${gig.date}`);
            continue;
          }
          gigDate = parsedDate.toISOString();
        } catch (error) {
          logger.warn(`Error parsing date for gig: ${gig.title} - ${gig.date}`);
          continue;
        }

        // Check if gig already exists
        const exists = await checkGigExists(gig.title, venueId, gigDate);
        if (exists) {
          logger.debug(`Gig already exists: ${gig.title}`);
          duplicated++;
          continue;
        }

        // Handle poster/image upload
        let poster = null;
        if (gig.image) {
          try {
            poster = await uploadImageFromUrl(
              gig.image,
              `${gig.artist}-${gig.venue.name}-${format(new Date(gigDate), 'yyyy-MM-dd')}.jpg`
            );
          } catch (error) {
            logger.warn(`Failed to upload image for gig: ${gig.title}`, error);
          }
        }

        // Create slug from title
        const slug = gig.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        // Determine age restriction from description or default to all ages
        let ageRestriction = 'all_ages';
        if (gig.description) {
          const desc = gig.description.toLowerCase();
          if (desc.includes('18+') || desc.includes('over 18')) {
            ageRestriction = '18_plus';
          } else if (desc.includes('16+') || desc.includes('over 16')) {
            ageRestriction = '16_plus';
          } else if (desc.includes('21+') || desc.includes('over 21')) {
            ageRestriction = '21_plus';
          }
        }

        // Create the gig document
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
          supportActs: [], // Could be enhanced to parse support acts from description
          date: gigDate,
          ticketPrice: gig.ticketPrice || null,
          ticketUrl: gig.ticketUrl || null,
          description: gig.description || `${gig.artist} performing at ${gig.venue.name}. Auto-imported from ${source}.`,
          poster: poster,
          status: gig.status || 'upcoming',
          ageRestriction: ageRestriction,
          featured: false,
          // Add metadata for tracking
          _sourceData: {
            source: source,
            sourceId: gig.id,
            sourceUrl: gig.sourceUrl,
            importedAt: new Date().toISOString()
          }
        };

        // Create the gig in Sanity
        const createdGig = await sanityClient.create(gigDocument);
        logger.info(`✅ Created gig: ${gig.title} at ${gig.venue.name} (${createdGig._id})`);
        added++;

        // Add a small delay to avoid overwhelming Sanity API
        await this.delay(200);

      } catch (error) {
        logger.error(`Error processing gig: ${gig.title}`, error);
        // Continue processing other gigs even if one fails
      }
    }

    logger.info(`✅ Processed ${source} gigs: ${added} added, ${duplicated} duplicates skipped`);
    
    return { added, duplicated };
  }

  /**
   * Add delay for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
