const fs = require('fs');

// Read the bands.json file
const bands = JSON.parse(fs.readFileSync('./bands.json', 'utf8'));

// Genre slug mappings to match our imported genres
const genreSlugMap = {
  'punk': 'punk',
  'alt-rock': 'alternative-rock',
  'acoustic': 'acoustic',
  'folk': 'folk',
  'rock': 'rock',
  'traditional-irish': 'traditional-irish',
  'pop': 'pop',
  'electronic': 'electronic',
  'indie-rock': 'indie-rock',
  'alternative-rock': 'alternative-rock',
  'experimental': 'experimental',
  'hip-hop': 'hip-hop',
  'rap': 'rap'
};

console.log(`🎵 Processing ${bands.length} bands for import...`);

// Transform the band data to Sanity document format
const bandDocuments = bands.map((band, index) => {
  // Map genre slugs to references
  const genreReferences = band.genres.map(genreSlug => {
    const mappedSlug = genreSlugMap[genreSlug] || genreSlug;
    return {
      _type: 'reference',
      _ref: `genre-${mappedSlug}`
    };
  });

  return {
    _type: 'band',
    _id: `band-${band.slug}`,
    name: band.bandName,
    slug: {
      _type: 'slug',
      current: band.slug
    },
    bio: band.biography,
    genres: genreReferences,
    locationText: band.location,
    formedYear: band.yearFormed,
    socialLinks: {
      _type: 'socialLinks',
      website: band.socialMediaLinks.website || null,
      facebook: band.socialMediaLinks.facebook || null,
      instagram: band.socialMediaLinks.instagram || null,
      youtube: band.socialMediaLinks.youtube || null,
      spotify: null,
      bandcamp: band.socialMediaLinks.website && band.socialMediaLinks.website.includes('bandcamp') ? band.socialMediaLinks.website : null
    },
    verified: false,
    featured: index < 3, // Mark first 3 bands as featured
    profileImage: null,
    bannerImage: null,
    gallery: [],
    members: []
  };
});

// Write as NDJSON (newline-delimited JSON)
const ndjsonOutput = bandDocuments.map(band => JSON.stringify(band)).join('\n');
fs.writeFileSync('./bands-import.ndjson', ndjsonOutput);

console.log('✅ Created bands-import.ndjson file');
console.log(`📊 Generated ${bandDocuments.length} band documents`);
console.log('\n🎸 Bands to import:');
bands.forEach((band, index) => {
  const featuredText = index < 3 ? ' (featured)' : '';
  console.log(`  • ${band.bandName} - ${band.genres.join(', ')}${featuredText}`);
});

console.log('\n📤 Run: npx sanity dataset import bands-import.ndjson production --replace');
console.log('⚠️  Note: This will replace any existing band documents with matching IDs');
