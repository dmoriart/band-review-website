# Sanity Token Setup Guide for Photo Upload Feature

## Overview
The studio photo upload feature requires a Sanity write token to be configured as an environment variable. This guide will help you set it up.

## Step 1: Get Your Sanity Write Token

1. **Go to Sanity Management Console**
   - Visit: https://www.sanity.io/manage
   - Sign in to your account

2. **Select Your Project**
   - Click on your "Band Venue Review" project (Project ID: sy7ko2cx)

3. **Navigate to API Settings**
   - In the left sidebar, click on "API"
   - Click on "Tokens" tab

4. **Create a New Token**
   - Click "Add API token"
   - **Name**: `Photo Upload Token`
   - **Permissions**: Select **"Write"** (this is crucial for uploads)
   - **Dataset**: `production`
   - Click "Save"

5. **Copy the Token**
   - ⚠️ **IMPORTANT**: Copy the token immediately - it won't be shown again
   - Save it securely (you'll need it for the next step)

## Step 2: Configure Netlify Environment Variable

1. **Go to Netlify Dashboard**
   - Visit: https://app.netlify.com/
   - Sign in and select your "bandvenuereview" site

2. **Navigate to Environment Variables**
   - Go to "Site settings"
   - Click on "Environment variables" in the left sidebar

3. **Add the Sanity Token**
   - Click "Add a variable"
   - **Key**: `REACT_APP_SANITY_TOKEN`
   - **Value**: [Paste your Sanity write token here]
   - **Scopes**: Select "All scopes" or "Production"
   - Click "Create variable"

## Step 3: Redeploy Your Site

1. **Trigger a New Deployment**
   - Go to "Deploys" tab in Netlify
   - Click "Trigger deploy" → "Deploy site"
   - OR push any small change to your GitHub repo to trigger auto-deploy

2. **Wait for Deployment**
   - Wait for the deployment to complete (usually 2-3 minutes)
   - Check that the build succeeds

## Step 4: Test Photo Upload

1. **Visit Your Site**
   - Go to https://bandvenuereview.netlify.app/
   - Navigate to any studio page (Studios section)

2. **Test Upload**
   - Sign in with Firebase authentication
   - Scroll to the "📸 Add Photos" section
   - Try uploading a test image
   - You should see "Photo uploaded successfully!" message

## Troubleshooting

### If you still get "Photo upload is currently unavailable"
- **Check Environment Variable**: Ensure `REACT_APP_SANITY_TOKEN` is set in Netlify
- **Verify Token Permissions**: Make sure the token has "Write" permissions
- **Check Token Format**: Token should start with `sk` (e.g., `skXXXXXXXX...`)
- **Redeploy**: Make sure you redeployed after adding the environment variable

### If you get "Permission denied" error
- **Token Expired**: Create a new token in Sanity dashboard
- **Wrong Permissions**: Ensure token has "Write" permissions, not just "Read"
- **Dataset Mismatch**: Verify token is for "production" dataset

### If upload fails with network error
- **File Size**: Ensure image is under 10MB
- **File Format**: Use JPG, PNG, or GIF formats only
- **Internet Connection**: Check your connection stability

## Security Notes

- ✅ **Environment Variable**: Token is stored securely as environment variable
- ✅ **Client-Side**: Token is only used for authenticated users
- ✅ **Scoped Access**: Token only has write access to assets, not full admin
- ⚠️ **Keep Secret**: Never commit the token to your code repository

## Expected Behavior After Setup

1. **Signed-in users** will see the photo upload component
2. **Upload button** will be enabled and functional
3. **Success message** will appear after successful upload
4. **Photos** will be stored in Sanity assets with user metadata
5. **Studio owners** can then add uploaded photos to their gallery via CMS

## Support

If you continue to have issues after following this guide:
1. Check the browser console for detailed error messages
2. Verify the token is correctly set in Netlify environment variables
3. Ensure the token has write permissions in Sanity dashboard
4. Try creating a fresh token if the current one doesn't work

The photo upload feature will be fully functional once the `REACT_APP_SANITY_TOKEN` environment variable is properly configured!
