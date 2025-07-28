# Render Database Setup Guide

This guide explains how to configure your database connection for Render deployment using individual environment variables instead of a single DATABASE_URL.

## Problem

Render sometimes has issues connecting to Supabase using the standard `DATABASE_URL` format. This alternative approach uses individual database parameters which can be more reliable.

## Solution

Your application now supports both connection methods:
1. **Individual Parameters** (recommended for Render)
2. **DATABASE_URL** (fallback method)

## Environment Variables for Render

Set these environment variables in your Render service:

### Required Variables

```bash
DB_HOST=aws-0-eu-west-1.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.thoghjwipjpkxcfkkcbx
DB_PASSWORD=your_actual_supabase_password
DB_SSLMODE=require
```

### Optional Variables

```bash
FLASK_CONFIG=production
SECRET_KEY=your_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_key_here
```

## How It Works

The application will:

1. **First**: Try to connect using individual parameters (`DB_HOST`, `DB_PORT`, etc.)
2. **Fallback**: If individual parameters are not available, use `DATABASE_URL`
3. **Final Fallback**: Use SQLite for development

## Testing Your Connection

### Local Testing

1. Set the environment variables in your local `.env` file:
   ```bash
   DB_HOST=aws-0-eu-west-1.pooler.supabase.com
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres.thoghjwipjpkxcfkkcbx
   DB_PASSWORD=your_actual_password
   DB_SSLMODE=require
   ```

2. Run the comprehensive test:
   ```bash
   cd backend
   python test_db_connection_comprehensive.py
   ```

3. Run the simple test:
   ```bash
   cd backend
   python test_postgres_connection_env.py
   ```

### Expected Output

If everything is working correctly, you should see:
```
✅ Individual parameters connection successful!
✅ DATABASE_URL connection successful!
✅ Connection with built URL successful!
🎉 ALL TESTS PASSED! Your database connection is working correctly.
```

## Render Deployment Steps

1. **Go to your Render service dashboard**

2. **Navigate to Environment Variables**

3. **Add the following variables:**
   - `DB_HOST`: `aws-0-eu-west-1.pooler.supabase.com`
   - `DB_PORT`: `5432`
   - `DB_NAME`: `postgres`
   - `DB_USER`: `postgres.thoghjwipjpkxcfkkcbx`
   - `DB_PASSWORD`: `[your actual Supabase password]`
   - `DB_SSLMODE`: `require`
   - `FLASK_CONFIG`: `production`

4. **Deploy your service**

5. **Check the logs** to ensure the connection is successful

## Troubleshooting

### Connection Fails

1. **Verify your Supabase credentials**:
   - Check your Supabase project settings
   - Ensure the password is correct
   - Verify the host URL is correct

2. **Check SSL requirements**:
   - Supabase requires SSL connections
   - Ensure `DB_SSLMODE=require` is set

3. **Test locally first**:
   - Run the test scripts locally with the same credentials
   - If local tests fail, the credentials are incorrect

### Environment Variables Not Loading

1. **Check variable names**:
   - Ensure exact spelling: `DB_HOST`, `DB_PORT`, etc.
   - No extra spaces or characters

2. **Restart your Render service**:
   - After adding environment variables, restart the service

3. **Check Render logs**:
   - Look for connection error messages
   - Verify which connection method is being attempted

## Code Changes Made

### 1. Updated `backend/config.py`

Added a `build_database_url()` function that:
- Checks for individual database parameters
- Builds a PostgreSQL URL if all parameters are available
- Falls back to `DATABASE_URL` if individual parameters are missing

### 2. Updated `ProductionConfig`

Modified the production configuration to use the new function:
```python
SQLALCHEMY_DATABASE_URI = build_database_url() or 'sqlite:///bandvenuereview.db'
```

### 3. Created Test Scripts

- `test_postgres_connection_env.py`: Simple test with individual parameters
- `test_db_connection_comprehensive.py`: Complete test suite for all connection methods

## Benefits of This Approach

1. **More Reliable**: Individual parameters often work better with Render
2. **Flexible**: Supports both connection methods
3. **Debuggable**: Easy to test and troubleshoot
4. **Backward Compatible**: Existing `DATABASE_URL` still works

## Security Notes

- Never commit actual passwords to version control
- Use Render's environment variable system for sensitive data
- The test scripts hide passwords in output for security

## Support

If you continue to have connection issues:

1. Run the comprehensive test locally
2. Check Render service logs
3. Verify all environment variables are set correctly
4. Ensure your Supabase instance allows connections from Render's IP ranges
