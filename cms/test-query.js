import { getCliClient } from 'sanity/cli'

const client = getCliClient()

console.log('Testing Sanity API access...')
console.log('Project ID:', client.config().projectId)
console.log('Dataset:', client.config().dataset)

client.fetch('*[_type == "band"][0...3]{ _id, name }')
  .then(result => {
    console.log('✅ Query successful! Found', result.length, 'bands:')
    console.log(result)
  })
  .catch(error => {
    console.error('❌ Query failed:', error.message)
    console.error('Full error:', error)
  })
