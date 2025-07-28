import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'sy7ko2cx',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2022-06-01',
})

async function testSoundStudio() {
  try {
    console.log('Testing soundStudio schema...')
    
    // Try to fetch soundStudio documents
    const studios = await client.fetch('*[_type == "soundStudio"]')
    console.log(`Found ${studios.length} sound studios`)
    
    if (studios.length > 0) {
      console.log('First studio:', studios[0])
    }
    
    // Try to fetch schema info
    const schema = await client.fetch('*[_type == "sanity.imageAsset"] | order(_createdAt desc) [0...5] { _id, originalFilename, _createdAt }')
    console.log('Recent assets:', schema.length)
    
  } catch (error) {
    console.error('Error testing soundStudio:', error)
  }
}

testSoundStudio()
