// Firebase configuration and initialization
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Check if Firebase environment variables are available
const firebaseConfigExists = !!(
  process.env.REACT_APP_FIREBASE_API_KEY &&
  process.env.REACT_APP_FIREBASE_AUTH_DOMAIN &&
  process.env.REACT_APP_FIREBASE_PROJECT_ID &&
  process.env.REACT_APP_FIREBASE_STORAGE_BUCKET &&
  process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID &&
  process.env.REACT_APP_FIREBASE_APP_ID
);

// Detect if we're in a build environment
const isBuildTime = process.env.NODE_ENV === 'production' && process.env.CI !== undefined;

// Firebase configuration - these should be set in environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || 'demo-app-id'
};

// Initialize Firebase
let app: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Firestore | null = null;

// Only initialize Firebase if we have config and we're not in build time
if (firebaseConfigExists && !isBuildTime) {
  try {
    app = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(app);
    firebaseDb = getFirestore(app);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
    // Firebase will not work, but build should succeed
  }
} else {
  console.log('Firebase initialization skipped:', { firebaseConfigExists, isBuildTime });
}

// Export Firebase instances
export const auth = firebaseAuth;
export const db = firebaseDb;

// Configure Google Auth Provider (only if auth is available)
const googleProvider = firebaseAuth ? new GoogleAuthProvider() : null;
if (googleProvider) {
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
}

// Authentication functions with error handling
export const signInWithGoogle = async () => {
  if (!firebaseAuth || !googleProvider) {
    throw new Error('Firebase authentication not configured');
  }
  return signInWithPopup(firebaseAuth, googleProvider);
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!firebaseAuth) {
    throw new Error('Firebase authentication not configured');
  }
  return signInWithEmailAndPassword(firebaseAuth, email, password);
};

export const createUserWithEmail = async (email: string, password: string) => {
  if (!firebaseAuth) {
    throw new Error('Firebase authentication not configured');
  }
  return createUserWithEmailAndPassword(firebaseAuth, email, password);
};

export const signOutUser = async () => {
  if (!firebaseAuth) {
    throw new Error('Firebase authentication not configured');
  }
  return signOut(firebaseAuth);
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!firebaseAuth) {
    // If Firebase is not configured, call callback with null user
    callback(null);
    return () => {}; // Return empty unsubscribe function
  }
  return onAuthStateChanged(firebaseAuth, callback);
};

// Export Firebase config status for components to check
export const isFirebaseConfigured = firebaseConfigExists;

export default app;
