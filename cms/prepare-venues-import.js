const fs = require('fs');

// Read the venues.json file
const venues = JSON.parse(fs.readFileSync('./venues.json', 'utf8'));

// Venue type mappings to match schema
const venueTypeMap = {
  'concert-hall': 'concert_hall',
  'pub-venue': 'pub', 
  'club-venue': 'club',
  'multi-room-venue': 'club',
  'theatre-venue': 'theatre'
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

  // Parse address into structured format
  const addressParts = venue.address.split(', ');
  const addressObj = {
    _type: 'address',
    street: addressParts[0] || '',
    city: addressParts[1] || '',
    county: addressParts[2] || '',
    country: 'Ireland'
  };

  // Clean up contact info - only include non-empty values
  const contact = {
    _type: 'contact'
  };
  
  if (venue.contact.phone && venue.contact.phone.trim()) {
    contact.phone = venue.contact.phone;
  }
  if (venue.contact.email && venue.contact.email.trim()) {
    contact.email = venue.contact.email;
  }
  if (venue.contact.website && venue.contact.website.trim()) {
    contact.website = venue.contact.website;
  }

  // Map facilities to match schema options
  const facilityMap = {
    'bar': 'bar',
    'merchandise-stand': 'merch_stand',
    'coat-check': 'security',
    'accessibility': 'ramp_access',
    'vip-area': 'green_room',
    'restaurant': 'food_service',
    'lighting-system': 'lighting',
    'sound-system': 'sound_system',
    'parking': 'parking'
  };
  
  const mappedFacilities = venue.facilities
    .map(facility => facilityMap[facility] || facility)
    .filter(facility => facility); // Remove any undefined values

  const venueDocument = {
    _type: 'venue',
    _id: `venue-${venue.slug}`,
    name: venue.venueName,
    slug: {
      _type: 'slug',
      current: venue.slug
    },
    description: venue.description,
    address: addressObj,
    location: {
      _type: 'geopoint',
      lat: venue.location.lat,
      lng: venue.location.lng
    },
    capacity: venue.capacity,
    venueType: venueTypeMap[venue.venueType] || 'other',
    primaryGenres: genreReferences,
    contact: contact,
    facilities: mappedFacilities,
    verified: venue.verified || false,
    claimed: false,
    featured: venue.featured || false,
    gallery: []
  };

  // Only add tech specs if we have meaningful data
  const techSpecs = {
    _type: 'techSpecs'
  };
  
  if (venue.facilities && venue.facilities.includes('lighting-system')) {
    techSpecs.lightingRig = 'Professional LED lighting system';
  }
  if (venue.facilities && venue.facilities.includes('sound-system')) {
    techSpecs.soundSystem = 'Professional PA system';
  }
  
  // Only add techSpecs if it has content beyond the _type
  if (Object.keys(techSpecs).length > 1) {
    venueDocument.techSpecs = techSpecs;
  }

  // Image fields are omitted entirely to prevent validation errors
  // heroImage and gallery are optional and should only be added when present

  return venueDocument;
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

console.log('\n📤 To import: npx sanity dataset import venues-import.ndjson production --replace');
console.log('⚠️  Note: This will replace any existing venue documents with matching IDs');
console.log('🧹 Image fields (heroImage) are properly omitted to prevent validation errors');
console.log('🏗️  Address structured into separate fields, contact info cleaned, facilities mapped to schema');
