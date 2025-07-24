const fs = require('fs');

// Read the bands-import.json file (updated structure)
const bands = JSON.parse(fs.readFileSync('./bands-import.json', 'utf8'));

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

  // Clean up social links - only include non-empty values
  const socialLinks = {
    _type: 'socialLinks'
  };
  
  if (band.socialMediaLinks.website && band.socialMediaLinks.website.trim()) {
    socialLinks.website = band.socialMediaLinks.website;
  }
  if (band.socialMediaLinks.facebook && band.socialMediaLinks.facebook.trim()) {
    socialLinks.facebook = band.socialMediaLinks.facebook;
  }
  if (band.socialMediaLinks.instagram && band.socialMediaLinks.instagram.trim()) {
    socialLinks.instagram = band.socialMediaLinks.instagram;
  }
  if (band.socialMediaLinks.youtube && band.socialMediaLinks.youtube.trim()) {
    socialLinks.youtube = band.socialMediaLinks.youtube;
  }
  if (band.socialMediaLinks.spotify && band.socialMediaLinks.spotify.trim()) {
    socialLinks.spotify = band.socialMediaLinks.spotify;
  }
  if (band.socialMediaLinks.twitter && band.socialMediaLinks.twitter.trim()) {
    socialLinks.twitter = band.socialMediaLinks.twitter;
  }
  if (band.socialMediaLinks.soundcloud && band.socialMediaLinks.soundcloud.trim()) {
    socialLinks.soundcloud = band.socialMediaLinks.soundcloud;
  }
  if (band.socialMediaLinks.bandcamp && band.socialMediaLinks.bandcamp.trim()) {
    socialLinks.bandcamp = band.socialMediaLinks.bandcamp;
  }

  const bandDocument = {
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
    socialLinks: socialLinks,
    verified: false,
    featured: index < 3, // Mark first 3 bands as featured
    gallery: [],
    members: []
  };

  // Only add image fields if they have actual values (not null or undefined)
  // This prevents Sanity validation errors for required image types
  
  return bandDocument;
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

console.log('\n📤 To import: npx sanity dataset import bands-import.ndjson production --replace');
console.log('⚠️  Note: This will replace any existing band documents with matching IDs');
console.log('🧹 Image fields (profileImage, bannerImage) are now properly omitted to prevent validation errors');
