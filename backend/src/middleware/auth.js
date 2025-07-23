const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let app;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    // Use service account file
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else if (process.env.FIREBASE_PROJECT_ID) {
    // Use environment variables
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
  } else {
    console.warn('⚠️ Firebase Admin SDK not configured - authentication will not work');
  }
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed:', error.message);
}

/**
 * Middleware to verify Firebase Auth token
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Missing or invalid authorization header' 
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No token provided' 
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      emailVerified: decodedToken.email_verified,
      provider: decodedToken.firebase?.sign_in_provider
    };

    // Log successful authentication
    console.log(`✅ Authenticated user: ${req.user.email} (${req.user.uid})`);
    
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        error: 'Token expired', 
        message: 'Your session has expired. Please sign in again.' 
      });
    } else if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ 
        error: 'Token revoked', 
        message: 'Your session has been revoked. Please sign in again.' 
      });
    } else if (error.code === 'auth/argument-error') {
      return res.status(400).json({ 
        error: 'Invalid token', 
        message: 'The provided token is malformed.' 
      });
    }

    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid authentication token' 
    });
  }
};

/**
 * Optional authentication - adds user info if token provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without user info
    return next();
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      emailVerified: decodedToken.email_verified,
      provider: decodedToken.firebase?.sign_in_provider
    };
  } catch (error) {
    // Token invalid, but continue without user info
    console.warn('⚠️ Optional auth failed:', error.message);
  }
  
  next();
};

module.exports = {
  verifyFirebaseToken,
  optionalAuth
};
