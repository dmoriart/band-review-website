import { getCliClient } from 'sanity/cli'

const client = getCliClient()

console.log('Checking project API configuration...')

// Test public access by creating a client without authentication
import { createClient } from '@sanity/client'

const publicClient = createClient({
  projectId: 'sy7ko2cx',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2022-06-01',
  withCredentials: false,
  // No token - testing public access
})

console.log('Testing public API access (no auth)...')
publicClient.fetch('*[_type == "band"][0...2]{ _id, name }')
  .then(result => {
    console.log('✅ Public access works! Found', result.length, 'bands:')
    console.log(result)
  })
  .catch(error => {
    console.error('❌ Public access failed:', error.message)
    console.error('This means the project requires authentication for API queries.')
  })
