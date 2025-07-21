# 🚀 Netlify Deployment Guide for BandVenueReview.ie

## Quick Deploy

### Option 1: One-Click Deploy (Recommended)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/dmoriart/band-review-website)

### Option 2: Manual Deployment

1. **Connect Repository**
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click "New site from Git"
   - Choose GitHub and select your repository
   - Select the `main` branch

2. **Build Settings**
   ```
   Base directory: (leave empty or use "/")
   Build command: cd frontend && npm ci && npm run build
   Publish directory: frontend/build
   ```

3. **Environment Variables**
   Add these in Netlify Dashboard → Site settings → Environment variables:
   ```
   REACT_APP_API_URL=https://your-backend-app.onrender.com/api
   REACT_APP_SITE_NAME=BandVenueReview.ie
   ```

## Configuration Files

The repository includes:
- ✅ `netlify.toml` - Netlify configuration
- ✅ `build-frontend.sh` - Build script
- ✅ `frontend/.env.example` - Environment template

## Domain Setup

### Custom Domain (Optional)
1. Purchase domain (e.g., `bandvenuereview.ie`)
2. In Netlify Dashboard → Domain settings
3. Add custom domain
4. Configure DNS records:
   ```
   Type: CNAME
   Name: www
   Value: your-site-name.netlify.app
   
   Type: A
   Name: @
   Value: 75.2.60.5 (Netlify's load balancer)
   ```

## SSL Certificate
- ✅ Automatically provided by Netlify
- ✅ Let's Encrypt certificate
- ✅ HTTPS redirect configured

## Performance Optimizations

The `netlify.toml` includes:
- ✅ SPA redirects (all routes → index.html)
- ✅ Security headers
- ✅ Static asset caching
- ✅ Build optimization

## Testing Deployment

1. **Local Build Test**
   ```bash
   ./build-frontend.sh
   ```

2. **Serve Build Locally**
   ```bash
   cd frontend
   npx serve -s build
   ```

3. **Access**: http://localhost:3000

## Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Verify all dependencies install: `cd frontend && npm install`
- Check build logs in Netlify dashboard

### API Connection Issues
- Verify `REACT_APP_API_URL` environment variable
- Ensure backend is deployed and accessible
- Check CORS settings in Flask backend

### Routing Issues
- SPA redirects should handle React Router
- Check `netlify.toml` redirect rules

## Monitoring

### Analytics (Optional)
Add to environment variables:
```
REACT_APP_GA_TRACKING_ID=GA_MEASUREMENT_ID
```

### Error Tracking
Consider adding:
- Sentry for error tracking
- Netlify Analytics for performance monitoring

## Deploy Status

After successful deployment:
- ✅ Site accessible at: `https://your-site-name.netlify.app`
- ✅ Custom domain (if configured): `https://bandvenuereview.ie`
- ✅ HTTPS enabled with auto-renewal
- ✅ CDN enabled globally
- ✅ Automatic deploys on git push
