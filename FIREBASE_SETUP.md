# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for the Band Venue Review website.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or use existing project "project-767641273466"
3. Enable Google Analytics (optional)
4. Wait for project creation

## Step 2: Enable Authentication Methods

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable the following providers:
   - **Email/Password**: Click on it, toggle Enable, Save
   - **Google**: Click on it, toggle Enable, add your email as authorized domain, Save

## Step 3: Add Web App to Firebase

1. In Firebase Console, go to **Project Overview**
2. Click the **Web** icon (`</>`) to add a web app
3. Register app with nickname: "BandVenueReview Website"
4. Copy the Firebase configuration object

## Step 4: Configure Authorized Domains

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add these domains:
   - `localhost` (for development)
   - `bandvenuereview.netlify.app` (for production)
   - Your custom domain if you have one

## Step 5: Update Environment Variables

### For Local Development:
Update `/frontend/.env.local` with your Firebase config values:

```bash
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=project-767641273466.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=project-767641273466
REACT_APP_FIREBASE_STORAGE_BUCKET=project-767641273466.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=767641273466
REACT_APP_FIREBASE_APP_ID=your_app_id_here
```

### For Production (Netlify):
1. Go to Netlify dashboard → Your site → Site settings → Environment variables
2. Add these variables:
   - `REACT_APP_FIREBASE_API_KEY`: Your API key
   - `REACT_APP_FIREBASE_AUTH_DOMAIN`: project-767641273466.firebaseapp.com
   - `REACT_APP_FIREBASE_PROJECT_ID`: project-767641273466
   - `REACT_APP_FIREBASE_STORAGE_BUCKET`: project-767641273466.appspot.com
   - `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`: 767641273466
   - `REACT_APP_FIREBASE_APP_ID`: Your app ID

## Step 6: Test the Integration

1. Start the development server: `npm start`
2. Click the "Sign In" button
3. Test both email/password and Google authentication
4. Verify that the "Contact Info" section shows when logged in
5. Test sign out functionality

## Security Best Practices

1. **Firebase Security Rules**: Set up Firestore security rules if you plan to use the database
2. **API Key Restrictions**: In Google Cloud Console, restrict your Firebase API key to your domains
3. **User Data**: Only store necessary user information
4. **HTTPS**: Ensure your site uses HTTPS in production (Netlify provides this automatically)

## Troubleshooting

### Common Issues:

1. **"Firebase API key is invalid"**
   - Check that all environment variables are set correctly
   - Ensure the API key hasn't been restricted too much in Google Cloud Console

2. **"auth/unauthorized-domain"**
   - Add your domain to authorized domains in Firebase Console
   - Make sure the domain matches exactly (no trailing slashes)

3. **Google Sign-In not working**
   - Verify Google provider is enabled in Firebase Console
   - Check that authorized domains include your site

4. **Environment variables not loading**
   - Ensure variables start with `REACT_APP_`
   - Restart development server after changing .env files
   - For Netlify, redeploy after adding environment variables

5. **Netlify build failing due to warnings**
   - The build is configured to set `CI=false` to prevent treating warnings as errors
   - If you still see issues, check the netlify.toml file has: `command = "export CI=false && npm ci && npm run build"`

6. **Netlify build failing with "exit code 2"**
   - This typically indicates a compilation or dependency issue
   - The Firebase integration is designed to handle missing environment variables gracefully
   - Build should succeed even without Firebase environment variables configured
   - The build uses cross-env and dedicated CI=false handling for maximum compatibility
   - Firebase initialization is skipped during build time to prevent connection issues
   - If build still fails, check for TypeScript compilation errors in the logs

7. **Deprecation warnings during build**
   - npm warn deprecated messages are normal and don't prevent successful builds
   - These are from react-scripts dependencies and are cosmetic
   - Running `npm audit fix --force` may break the build, so avoid unless necessary

8. **Build improvements implemented**
   - Uses cross-env for reliable environment variable handling across platforms
   - Dedicated build:netlify script ensures CI=false is properly set
   - Firebase initialization is skipped during build time to prevent network issues
   - Multiple layers of defensive error handling for missing Firebase configuration

## Features Implemented

✅ **Email/Password Authentication**
- User registration with email and password
- User sign-in with email and password
- Form validation and error handling

✅ **Google Authentication**
- One-click Google sign-in
- Automatic profile information import

✅ **Authentication State Management**
- React Context for global auth state
- Persistent user sessions
- Loading states during auth operations

✅ **UI Integration**
- Modal-based authentication interface
- Navigation updates based on auth state
- Protected content (booking information requires login)
- User profile display when authenticated

✅ **Security**
- Firebase security rules (server-side)
- Environment variable configuration
- Authorized domain restrictions

## Next Steps

Consider implementing:
- User profile management
- Password reset functionality
- Email verification
- User roles (bands vs venue owners)
- Integration with your backend API for user-specific data
