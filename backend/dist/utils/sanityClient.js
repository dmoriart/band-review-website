"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanityClient = void 0;
exports.createOrGetVenue = createOrGetVenue;
exports.createOrGetBand = createOrGetBand;
exports.checkGigExists = checkGigExists;
exports.uploadImageFromUrl = uploadImageFromUrl;
const client_1 = require("@sanity/client");
const logger_1 = __importDefault(require("./logger"));
exports.sanityClient = (0, client_1.createClient)({
    projectId: process.env.SANITY_PROJECT_ID || 'sy7ko2cx',
    dataset: process.env.SANITY_DATASET || 'production',
    useCdn: false,
    apiVersion: '2022-06-01',
    token: process.env.SANITY_API_TOKEN,
    timeout: 30000,
});
async function createOrGetVenue(venueData) {
    try {
        const existingVenue = await exports.sanityClient.fetch(`*[_type == "venue" && name == $name && address.city == $city][0]`, { name: venueData.name, city: venueData.city });
        if (existingVenue?._id) {
            logger_1.default.debug(`Found existing venue: ${venueData.name}`);
            return existingVenue._id;
        }
        const newVenue = await exports.sanityClient.create({
            _type: 'venue',
            name: venueData.name,
            slug: {
                _type: 'slug',
                current: venueData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            },
            address: {
                street: venueData.address,
                city: venueData.city,
                county: '',
                country: venueData.country
            },
            capacity: null,
            website: null,
            phone: null,
            amenities: [],
            accessibility: null,
            description: `Auto-generated venue from ${venueData.city}, ${venueData.country}`,
            featured: false
        });
        logger_1.default.info(`Created new venue: ${venueData.name} (${newVenue._id})`);
        return newVenue._id;
    }
    catch (error) {
        logger_1.default.error(`Error creating/getting venue ${venueData.name}:`, error);
        throw error;
    }
}
async function createOrGetBand(artistName, genres) {
    try {
        const existingBand = await exports.sanityClient.fetch(`*[_type == "band" && name == $name][0]`, { name: artistName });
        if (existingBand?._id) {
            logger_1.default.debug(`Found existing band: ${artistName}`);
            return existingBand._id;
        }
        const newBand = await exports.sanityClient.create({
            _type: 'band',
            name: artistName,
            slug: {
                _type: 'slug',
                current: artistName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            },
            bio: `Auto-generated band profile from gig scraping.`,
            locationText: 'Ireland',
            genres: [],
            formedYear: null,
            profileImage: null,
            website: null,
            socialMedia: {
                facebook: null,
                instagram: null,
                twitter: null,
                spotify: null,
                bandcamp: null
            },
            members: [],
            featured: false
        });
        logger_1.default.info(`Created new band: ${artistName} (${newBand._id})`);
        return newBand._id;
    }
    catch (error) {
        logger_1.default.error(`Error creating/getting band ${artistName}:`, error);
        throw error;
    }
}
async function checkGigExists(title, venueId, date) {
    try {
        const existingGig = await exports.sanityClient.fetch(`*[_type == "gig" && title == $title && venue._ref == $venueId && date == $date][0]`, { title, venueId, date });
        return !!existingGig;
    }
    catch (error) {
        logger_1.default.error('Error checking if gig exists:', error);
        return false;
    }
}
async function uploadImageFromUrl(imageUrl, filename) {
    try {
        if (!imageUrl || !imageUrl.startsWith('http')) {
            return null;
        }
        const response = await fetch(imageUrl);
        if (!response.ok) {
            logger_1.default.warn(`Failed to fetch image from ${imageUrl}`);
            return null;
        }
        const imageBuffer = await response.arrayBuffer();
        const uploadedImage = await exports.sanityClient.assets.upload('image', Buffer.from(imageBuffer), {
            filename: filename,
            contentType: response.headers.get('content-type') || 'image/jpeg'
        });
        return {
            _type: 'image',
            asset: {
                _type: 'reference',
                _ref: uploadedImage._id
            },
            alt: filename
        };
    }
    catch (error) {
        logger_1.default.error(`Error uploading image from ${imageUrl}:`, error);
        return null;
    }
}
//# sourceMappingURL=sanityClient.js.map