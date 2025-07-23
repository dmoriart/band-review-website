const fs = require('fs');

// Read the venues.json file
const venues = JSON.parse(fs.readFileSync('./venues.json', 'utf8'));

// Venue type mappings
const venueTypeMap = {
  'concert-hall': 'concert-hall',
  'pub-venue': 'pub-venue',
  'club-venue': 'club-venue',
  'multi-room-venue': 'multi-room-venue',
  'theatre-venue': 'theatre-venue'
};

// Genre slug mappings to match our imported genres
const genreSlugMap = {
  'rock': 'rock',
  'indie-rock': 'indie-rock',
  'electronic': 'electronic',
  'pop': 'pop',
  'folk': 'folk',
  'singer-songwriter': 'singer-songwriter',
  'punk': 'punk',
  'house': 'house',
  'techno': 'techno',
  'experimental': 'experimental',
  'alternative-rock': 'alternative-rock',
  'hip-hop': 'hip-hop',
  'metal': 'metal',
  'traditional-irish': 'traditional-irish',
  'ceili': 'ceili',
  'acoustic': 'acoustic',
  'classical': 'classical'
};

console.log(`🏛️ Processing ${venues.length} venues for import...`);

// Transform the venue data to Sanity document format
const venueDocuments = venues.map((venue, index) => {
  // Map genre slugs to references for primary genres
  const genreReferences = venue.primaryGenres.map(genreSlug => {
    const mappedSlug = genreSlugMap[genreSlug] || genreSlug;
    return {
      _type: 'reference',
      _ref: `genre-${mappedSlug}`
    };
  });

  return {
    _type: 'venue',
    _id: `venue-${venue.slug}`,
    name: venue.venueName,
    slug: {
      _type: 'slug',
      current: venue.slug
    },
    description: venue.description,
    address: venue.address,
    location: {
      _type: 'geopoint',
      lat: venue.location.lat,
      lng: venue.location.lng
    },
    capacity: venue.capacity,
    type: venueTypeMap[venue.venueType] || venue.venueType,
    primaryGenres: genreReferences,
    contactInfo: {
      _type: 'contactInfo',
      phone: venue.contact.phone || null,
      email: venue.contact.email || null,
      website: venue.contact.website || null
    },
    facilities: venue.facilities || [],
    verified: venue.verified || false,
    featured: venue.featured || false,
    profileImage: null,
    heroImage: null,
    gallery: [],
    techSpecs: {
      _type: 'techSpecs',
      soundSystem: null,
      lightingSystem: venue.facilities && venue.facilities.includes('lighting-system') ? 'Professional LED system' : null,
      stageSize: null,
      loadInInfo: null
    },
    claimed: false
  };
});

// Write as NDJSON (newline-delimited JSON)
const ndjsonOutput = venueDocuments.map(venue => JSON.stringify(venue)).join('\n');
fs.writeFileSync('./venues-import.ndjson', ndjsonOutput);

console.log('✅ Created venues-import.ndjson file');
console.log(`📊 Generated ${venueDocuments.length} venue documents`);
console.log('\n🏛️ Venues to import:');
venues.forEach((venue, index) => {
  const featuredText = venue.featured ? ' (featured)' : '';
  const locationInfo = venue.address.includes('Dublin') ? 'Dublin' : 
                      venue.address.includes('Cork') ? 'Cork' :
                      venue.address.includes('Belfast') ? 'Belfast' :
                      venue.address.includes('Limerick') ? 'Limerick' :
                      venue.address.includes('Galway') ? 'Galway' :
                      venue.address.includes('Dundalk') ? 'Dundalk' :
                      venue.address.includes('Kilkenny') ? 'Kilkenny' : 'Ireland';
  console.log(`  • ${venue.venueName} (${locationInfo}) - ${venue.capacity} capacity - ${venue.primaryGenres.join(', ')}${featuredText}`);
});

console.log(`\n📍 Geographic distribution:`);
const cities = venues.reduce((acc, venue) => {
  const city = venue.address.includes('Dublin') ? 'Dublin' : 
               venue.address.includes('Cork') ? 'Cork' :
               venue.address.includes('Belfast') ? 'Belfast' :
               venue.address.includes('Limerick') ? 'Limerick' :
               venue.address.includes('Galway') ? 'Galway' :
               venue.address.includes('Dundalk') ? 'Dundalk' :
               venue.address.includes('Kilkenny') ? 'Kilkenny' : 'Other';
  acc[city] = (acc[city] || 0) + 1;
  return acc;
}, {});

Object.entries(cities).forEach(([city, count]) => {
  console.log(`  • ${city}: ${count} venues`);
});

console.log('\n📤 Run: npx sanity dataset import venues-import.ndjson production --replace');
console.log('⚠️  Note: This will replace any existing venue documents with matching IDs');
