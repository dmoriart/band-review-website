# Frontend Deployment Guide

## Netlify Deployment Steps

### Quick Fix - Redeploy with Production API

Your backend is working perfectly at: `https://band-review-website.onrender.com/api`

**Option 1: Use Default Production URL (Recommended)**
The App.tsx now defaults to the production API. Simply redeploy:

1. Go to [netlify.com](https://netlify.com) → Your site
2. Click "Deploys" 
3. Click "Trigger Deploy" → "Deploy Site"

**Option 2: Set Environment Variable (Alternative)**
1. Go to Site Settings → Environment Variables
2. Add: `REACT_APP_API_URL` = `https://band-review-website.onrender.com/api`
3. Redeploy

### Test After Deployment

Your live site should show:
- ✅ API connection status: "healthy" 
- ✅ List of Irish venues (Whelan's, Cyprus Avenue, etc.)
- ✅ No CORS errors

### Troubleshooting

If deployment fails:
1. Check build logs in Netlify
2. Ensure no syntax errors in React code
3. Verify environment variables are set correctly

### Local Development

For local development, create `.env.local`:
```
REACT_APP_API_URL=http://localhost:8000/api
```

This will override the production default when developing locally.
