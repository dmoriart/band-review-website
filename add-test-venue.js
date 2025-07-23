// Quick script to add test venue data
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: 'sy7ko2cx',
  dataset: 'production',
  token: process.env.SANITY_WRITE_TOKEN, // You'll need to add this
  useCdn: false,
  apiVersion: '2022-06-01'
})

const testVenue = {
  _type: 'venue',
  name: 'The Venue Test',
  slug: {
    _type: 'slug',
    current: 'the-venue-test'
  },
  description: 'A test venue for checking the Sanity integration',
  address: {
    street: '123 Test Street',
    city: 'Dublin',
    county: 'Dublin',
    country: 'Ireland'
  },
  capacity: 150,
  venueType: 'music_venue',
  verified: false,
  claimed: false,
  featured: false
}

async function addTestVenue() {
  try {
    const result = await client.create(testVenue)
    console.log('Test venue created:', result)
  } catch (error) {
    console.error('Error creating test venue:', error)
  }
}

addTestVenue()
