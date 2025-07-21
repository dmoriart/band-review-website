# BandVenueReview.ie Backend Deployment Guide

## Render.com Deployment

### Method 1: Using render.yaml (Recommended)

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare backend for Render.com deployment"
   git push origin main
   ```

2. **Create Render.com Account**:
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

3. **Deploy from GitHub**:
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Select the `band-review-website` repository
   - Render will automatically detect the `render.yaml` file
   - Click "Apply" to deploy

### Method 2: Manual Web Service Setup

1. **Create New Web Service**:
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect GitHub repository: `band-review-website`

2. **Configure Service**:
   - **Name**: `bandvenuereview-api`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python init_db.py && gunicorn -c gunicorn.conf.py app:app`

3. **Environment Variables**:
   Add these in Render Dashboard → Environment:
   ```
   FLASK_ENV=production
   FLASK_DEBUG=false
   SECRET_KEY=[Generate random 32-char string]
   JWT_SECRET_KEY=[Generate random 32-char string]
   DATABASE_URL=[Your PostgreSQL connection string]
   CORS_ORIGINS=https://bandvenuereview.netlify.app
   ```

### Database Setup

#### Option A: Use Render PostgreSQL (Recommended)
1. Create PostgreSQL database in Render
2. Copy the connection string to `DATABASE_URL`

#### Option B: Use Supabase
1. Reactivate your Supabase project
2. Use the connection string:
   ```
   postgresql://postgres:fewzuj-ninsyw-suRza5@thoghjwipjpkxcfkkcbx.supabase.co:5432/postgres
   ```

### Post-Deployment

1. **Get your deployment URL**: 
   - Will be something like: `https://bandvenuereview-api.onrender.com`

2. **Update Frontend**:
   - Update Netlify environment variable:
   - `REACT_APP_API_URL=https://your-app-name.onrender.com/api`

3. **Test the deployment**:
   ```bash
   curl https://your-app-name.onrender.com/api/health
   ```

### Expected Response:
```json
{
  "service": "BandVenueReview.ie API",
  "status": "healthy", 
  "version": "1.0.0"
}
```

## Troubleshooting

- **Build fails**: Check requirements.txt has all dependencies
- **Database connection fails**: Verify DATABASE_URL is correct
- **CORS errors**: Check CORS_ORIGINS includes your frontend URL
- **App won't start**: Check logs in Render dashboard

## Free Tier Limits

- Render free tier spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- 750 hours per month (about 1 month of uptime)
