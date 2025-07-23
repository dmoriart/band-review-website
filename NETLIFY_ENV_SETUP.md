# Netlify Environment Variables Required for Production

## Navigate to: https://app.netlify.com/sites/bandvenuereview/settings/deploys#environment-variables

Set these environment variables in your Netlify dashboard:

### Sanity CMS Configuration
REACT_APP_SANITY_PROJECT_ID=sy7ko2cx
REACT_APP_SANITY_DATASET=production
REACT_APP_SANITY_USE_CDN=false

### Other Required Variables (from your .env.local)
REACT_APP_API_URL=https://band-review-website.onrender.com/api
REACT_APP_SITE_NAME=BandVenueReview.ie
REACT_APP_SITE_DESCRIPTION=Ireland's platform for bands to review live music venues

## Important Notes:
1. After adding these variables, trigger a new deployment
2. Make sure REACT_APP_SANITY_USE_CDN is set to "false" (not "true") to avoid caching issues
3. All REACT_APP_* variables must be set in Netlify for them to be available in production builds

## To trigger a new deployment:
1. Go to https://app.netlify.com/sites/bandvenuereview/deploys
2. Click "Trigger deploy" → "Deploy site"
3. Or push a small change to your GitHub repo to trigger auto-deployment
