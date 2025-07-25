#!/usr/bin/env python3
"""
Mark the original 5 detailed studios as featured in Sanity CMS
"""

import requests
import json

def mark_original_studios_as_featured():
    """Mark the first 5 detailed studios as featured"""
    
    # The original 5 studios with detailed information
    featured_studio_names = [
        "Windmill Lane Studios",
        "Temple Lane Studios", 
        "Grouse Lodge Studios",
        "Sun Studios Dublin",
        "Sonic Studios Cork"
    ]
    
    # Sanity project details
    project_id = "sy7ko2cx"
    dataset = "production"
    
    print("🌟 Marking original studios as featured...")
    
    for studio_name in featured_studio_names:
        try:
            # Query for the studio by name
            query = f'*[_type == "soundStudio" && name == "{studio_name}"][0]'
            query_url = f"https://{project_id}.api.sanity.io/v2021-10-21/data/query/{dataset}"
            
            response = requests.get(query_url, params={"query": query}, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                studio = data.get("result")
                
                if studio:
                    studio_id = studio.get("_id")
                    print(f"✅ Found: {studio_name} (ID: {studio_id})")
                    
                    # Note: Direct mutation would require authentication
                    # Instead, we'll create a script to update via Sanity CLI
                    
                else:
                    print(f"❌ Not found: {studio_name}")
            else:
                print(f"❌ Error querying {studio_name}: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error processing {studio_name}: {e}")
    
    # Create mutation script for Sanity CLI
    create_feature_update_script(featured_studio_names)

def create_feature_update_script(featured_names):
    """Create a script to update featured status via Sanity CLI"""
    
    script_content = """// Mark original detailed studios as featured
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
"""
    
    with open('mark-featured-studios.js', 'w') as f:
        f.write(script_content)
    
    print(f"\n📁 Created: mark-featured-studios.js")
    print(f"🚀 To run: npx sanity exec mark-featured-studios.js --with-user-token")

if __name__ == "__main__":
    mark_original_studios_as_featured()
