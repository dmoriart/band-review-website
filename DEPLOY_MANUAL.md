# BandVenueReview.ie - Manual Render.com Deployment (No Payment Required)

## Step-by-Step Manual Deployment

### 1. Create Web Service Only (No Database)

1. **Go to [render.com](https://render.com)**
2. **Sign up/Login** with GitHub
3. **Click "New +" → "Web Service"** (NOT Blueprint)
4. **Connect GitHub Repository**: `dmoriart/band-review-website`

### 2. Configure Web Service

**Basic Settings:**
- **Name**: `bandvenuereview-api`
- **Region**: Oregon (US West) 
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Python 3`

**Build & Deploy:**
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python app_production.py`

**Alternative Start Command (if issues):**
- `python init_db.py && gunicorn -c gunicorn.conf.py app_production:app`

### 3. Environment Variables

Add these in the "Environment" tab:

```
FLASK_ENV=production
FLASK_DEBUG=false
SECRET_KEY=your-super-secret-key-at-least-32-chars-long
JWT_SECRET_KEY=another-secret-key-for-jwt-tokens
DATABASE_URL=postgresql://postgres:fewzuj-ninsyw-suRza5@thoghjwipjpkxcfkkcbx.supabase.co:5432/postgres
CORS_ORIGINS=https://bandvenuereview.netlify.app,https://*.netlify.app
```

### 4. Database: Use Existing Supabase

**Option A: Reactivate Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Check if your project is paused
3. Reactivate it (should be free)
4. Use the connection string above

**Option B: Use SQLite (Temporary)**
```
DATABASE_URL=sqlite:///bandvenuereview.db
```

### 5. Deploy

1. Click "Create Web Service"
2. Wait 3-5 minutes for build
3. Your app will be at: `https://bandvenuereview-api.onrender.com`

## Why This Avoids Payment

- **No Blueprint** = No automatic database creation
- **Use existing Supabase** = No new database needed
- **Free web service** = No payment required
- **Free tier limits**: App sleeps after 15 min inactivity

## Test Deployment

Once deployed, test with:
```bash
curl https://your-app-name.onrender.com/api/health
```

Expected response:
```json
{
  "service": "BandVenueReview.ie API",
  "status": "healthy",
  "version": "1.0.0"
}
```
