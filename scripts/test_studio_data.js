// Test script to verify studios data is accessible from frontend
// Run this in your browser console on the Sound Studios page

async function testStudioData() {
  try {
    // Test if the studios data is loaded
    console.log('🎵 Testing Sound Studios Data...');
    
    // Check if studios are in the page
    const studioCards = document.querySelectorAll('.studio-card');
    console.log(`Found ${studioCards.length} studio cards in DOM`);
    
    // Check for specific studios
    const expectedStudios = [
      'Windmill Lane Studios',
      'Temple Lane Studios', 
      'Grouse Lodge Studios',
      'Sun Studios Dublin',
      'Sonic Studios Cork'
    ];
    
    expectedStudios.forEach(studioName => {
      const found = Array.from(document.querySelectorAll('*')).some(el => 
        el.textContent && el.textContent.includes(studioName)
      );
      console.log(`${found ? '✅' : '❌'} ${studioName}`);
    });
    
    // Check for pricing information
    const pricingElements = document.querySelectorAll('[class*="price"], [class*="rate"]');
    console.log(`Found ${pricingElements.length} pricing elements`);
    
    // Check for contact information  
    const phoneElements = document.querySelectorAll('a[href^="tel:"]');
    const emailElements = document.querySelectorAll('a[href^="mailto:"]');
    const websiteElements = document.querySelectorAll('a[href^="http"]');
    
    console.log(`Contact elements found:`);
    console.log(`📞 Phone links: ${phoneElements.length}`);
    console.log(`📧 Email links: ${emailElements.length}`);
    console.log(`🌐 Website links: ${websiteElements.length}`);
    
    // Check for amenities
    const amenityElements = document.querySelectorAll('.amenity, .equipment, [class*="feature"]');
    console.log(`🎛 Amenity elements: ${amenityElements.length}`);
    
    console.log('✅ Studio data test complete!');
    
  } catch (error) {
    console.error('❌ Error testing studio data:', error);
  }
}

// Run the test
testStudioData();
