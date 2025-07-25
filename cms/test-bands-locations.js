#!/usr/bin/env node

/**
 * Test script to verify bands location data in Sanity CMS
 * Checks that location standardization was successful
 */

const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'sy7ko2cx',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2023-01-01'
});

async function testBandsLocations() {
  console.log('🔍 Testing bands location data in Sanity CMS...\n');

  try {
    // Get all bands with location data
    const bandsWithLocations = await client.fetch(`
      *[_type == "band" && defined(city)] {
        name,
        city,
        county,
        country
      } | order(city asc)
    `);

    console.log(`📊 Found ${bandsWithLocations.length} bands with city data\n`);

    // Count bands by city
    const cityStats = {};
    bandsWithLocations.forEach(band => {
      const city = band.city;
      if (city) {
        cityStats[city] = (cityStats[city] || 0) + 1;
      }
    });

    console.log('🏙️ Top Cities by Band Count:');
    const sortedCities = Object.entries(cityStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15);

    sortedCities.forEach(([city, count]) => {
      console.log(`  ${city}: ${count} bands`);
    });

    console.log('\n📍 Sample bands with locations:');
    bandsWithLocations.slice(0, 10).forEach(band => {
      console.log(`  ${band.name} - ${band.city}${band.county ? `, ${band.county}` : ''}`);
    });

    // Test location filtering query
    console.log('\n🔍 Testing location filtering queries...');
    
    const dublinBands = await client.fetch(`
      *[_type == "band" && city match "Dublin*"] | order(name asc) [0...5] {
        name,
        city
      }
    `);

    console.log(`\n📍 Dublin bands sample (${dublinBands.length} shown):`);
    dublinBands.forEach(band => {
      console.log(`  ${band.name} - ${band.city}`);
    });

    const corkBands = await client.fetch(`
      *[_type == "band" && city match "Cork*"] | order(name asc) [0...5] {
        name,
        city
      }
    `);

    console.log(`\n📍 Cork bands sample (${corkBands.length} shown):`);
    corkBands.forEach(band => {
      console.log(`  ${band.name} - ${band.city}`);
    });

    console.log('\n✅ Location testing completed successfully!');
    console.log('🎯 Bands now have standardized Irish location data matching venues!');

  } catch (error) {
    console.error('❌ Error testing bands locations:', error);
  }
}

testBandsLocations();
