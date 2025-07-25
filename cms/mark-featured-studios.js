// Mark original detailed studios as featured
import {getCliClient} from 'sanity/cli'

const client = getCliClient()

const featuredStudioNames = [
  "Windmill Lane Studios",
  "Temple Lane Studios", 
  "Grouse Lodge Studios",
  "Sun Studios Dublin",
  "Sonic Studios Cork"
]

async function markStudiosFeatured() {
  console.log('🌟 Marking original studios as featured...')
  
  for (const studioName of featuredStudioNames) {
    try {
      // Find the studio
      const studio = await client.fetch('*[_type == "soundStudio" && name == $name][0]', {
        name: studioName
      })
      
      if (studio) {
        // Update to featured
        await client
          .patch(studio._id)
          .set({
            featured: true,
            verified: true  // Also mark as verified since we have detailed info
          })
          .commit()
        
        console.log(`✅ Marked as featured: ${studioName}`)
      } else {
        console.log(`❌ Not found: ${studioName}`)
      }
    } catch (error) {
      console.error(`❌ Error updating ${studioName}:`, error.message)
    }
  }
  
  console.log('🎉 Featured studios update complete!')
}

markStudiosFeatured()
