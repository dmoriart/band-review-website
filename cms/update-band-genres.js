const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'sy7ko2cx',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2022-06-01',
});

async function updateBandGenres() {
  try {
    console.log('🎸 Updating Stick N Poke band with genres...');
    
    const bandId = '4407c6f7-ac9f-469a-8f53-8687ad0a06f6';
    
    // Update the band to include some genres
    const result = await client
      .patch(bandId)
      .set({
        genres: [
          { _type: 'reference', _ref: 'genre-indie-rock' },
          { _type: 'reference', _ref: 'genre-alternative-rock' }
        ]
      })
      .commit();
    
    console.log('✅ Updated band with genres:', result.name);
    
    // Verify the update
    const updatedBand = await client.fetch(
      '*[_type == "band" && _id == $id][0] { name, "genres": genres[]->{ name, slug, color } }',
      { id: bandId }
    );
    
    console.log('🎵 Band genres:', updatedBand.genres);
    
  } catch (error) {
    console.error('❌ Failed to update band:', error);
  }
}

updateBandGenres();
