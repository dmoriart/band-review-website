// Force deploy script to update Sanity Studio with latest schema
import { execSync } from 'child_process';

console.log('🚀 Force deploying Sanity Studio with updated schema...');

try {
  // Clear any cached builds
  console.log('🧹 Clearing build cache...');
  execSync('rm -rf .sanity', { cwd: process.cwd() });
  
  // Force rebuild and deploy
  console.log('📦 Building and deploying studio...');
  execSync('npx sanity deploy --no-minify', { 
    cwd: process.cwd(),
    stdio: 'inherit'
  });
  
  console.log('✅ Studio deployed successfully!');
  console.log('🎯 Visit https://band-venue-review.sanity.studio/ to see Sound Studios section');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  
  // Fallback: try to start local dev server
  console.log('🔄 Trying alternative approach - starting local dev server...');
  try {
    execSync('npx sanity dev --port 3333', { 
      cwd: process.cwd(),
      stdio: 'inherit'
    });
  } catch (devError) {
    console.error('❌ Dev server also failed:', devError.message);
    console.log('📋 Manual steps needed:');
    console.log('1. cd cms');
    console.log('2. rm -rf .sanity');
    console.log('3. npx sanity deploy');
  }
}
