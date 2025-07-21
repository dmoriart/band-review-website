# Supabase Database Setup Guide

## Overview
This guide will help you connect your BandVenueReview.ie Flask backend to your Supabase PostgreSQL database.

## Prerequisites
✅ You have created a Supabase project: `https://thoghjwipjpkxcfkkcbx.supabase.co`  
✅ You have executed the `database_schema.sql` script in Supabase  
✅ You have your Supabase database password  

## Step 1: Update Environment Variables

1. **Edit the backend `.env` file:**
   ```bash
   cd backend
   nano .env  # or use your preferred editor
   ```

2. **Replace `[YOUR_PASSWORD]` with your actual Supabase password:**
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.thoghjwipjpkxcfkkcbx.supabase.co:5432/postgres
   ```

## Step 2: Test the Connection

Run the connection test script:
```bash
cd backend
python test_db_connection.py
```

If successful, you should see:
```
✅ Connected successfully!
📋 Found tables: bands, genres, reviews, users, venues
🏛️  Found 5 venues in database
```

## Step 3: Verify with Flask App

Test the Flask app connection:
```bash
python verify_supabase.py
```

This will show you what data is currently in your database.

## Step 4: Start the Backend Server

```bash
python app.py
```

The server should start on `http://localhost:5001` and connect to your Supabase database.

## Step 5: Test API Endpoints

Test the health endpoint:
```bash
curl http://localhost:5001/api/health
```

Test the venues endpoint:
```bash
curl http://localhost:5001/api/venues
```

## What's Changed

### Models Updated for PostgreSQL:
- ✅ UUID columns now use proper PostgreSQL UUID type
- ✅ Timestamps use timezone-aware datetime
- ✅ Numeric fields use proper PostgreSQL types
- ✅ JSON fields compatible with PostgreSQL JSONB

### App Configuration:
- ✅ Custom UUID JSON encoder added
- ✅ Database URL configured for Supabase
- ✅ CORS updated to include Netlify frontend

### Database Schema:
- ✅ Uses your existing Supabase tables
- ✅ Includes all sample venues from Ireland
- ✅ Ready for production use

## Troubleshooting

### Connection Issues:
1. **Wrong Password**: Make sure you're using the correct database password
2. **Supabase Inactive**: Check your Supabase project is active
3. **Network Issues**: Verify your internet connection
4. **Tables Missing**: Ensure you ran the `database_schema.sql` script

### Common Errors:
- `psycopg2.OperationalError`: Usually a password or connection issue
- `relation does not exist`: Tables weren't created - run the schema script
- `SSL required`: Supabase requires SSL (already configured)

## Next Steps

1. ✅ **Backend Connected**: Your Flask API is now using Supabase
2. 🚀 **Deploy Backend**: Deploy to Render.com (use `render.yaml` config)
3. 🔗 **Update Frontend**: Update `REACT_APP_API_URL` in Netlify
4. 🎉 **Go Live**: Your full-stack app will be production-ready!

## Production Deployment

For production, your Flask app will automatically use the same DATABASE_URL environment variable on Render.com. Just add your Supabase connection string to the Render environment variables.

---

**Need Help?** Check the connection test outputs for specific error messages and solutions.
