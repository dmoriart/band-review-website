const fs = require('fs');

// Read the genre.json file
const genres = JSON.parse(fs.readFileSync('./genre.json', 'utf8'));

// Transform to NDJSON format for Sanity import
const ndjsonGenres = genres.map(genre => ({
  _type: 'genre',
  _id: `genre-${genre.slug}`,
  name: genre.name,
  slug: {
    _type: 'slug',
    current: genre.slug
  },
  description: genre.description,
  color: {
    _type: 'color',
    hex: genre.color
  }
}));

// Create parent relationships in a second pass
const genresWithParents = ndjsonGenres.map(genre => {
  const originalGenre = genres.find(g => g.slug === genre.slug.current);
  if (originalGenre.parentGenre) {
    genre.parentGenre = {
      _type: 'reference',
      _ref: `genre-${originalGenre.parentGenre.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '')}`
    };
  }
  return genre;
});

// Write as NDJSON (newline-delimited JSON)
const ndjsonOutput = genresWithParents.map(genre => JSON.stringify(genre)).join('\n');
fs.writeFileSync('./genres-import.ndjson', ndjsonOutput);

console.log('✅ Created genres-import.ndjson file');
console.log('📤 Run: npx sanity dataset import genres-import.ndjson production --replace');
