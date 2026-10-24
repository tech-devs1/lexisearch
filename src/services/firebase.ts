import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCChyQqPzFzbSsk9dvTbeZWG2JAtWejs-U",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "glies-6c39a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "glies-6c39a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "glies-6c39a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "86214049305",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:86214049305:web:d20123d8f515a0d4577488",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-88SHGVJTTD",
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let analytics: Analytics | undefined;

export const isLocalMode = import.meta.env.VITE_ENABLE_LOCAL_MODE === 'true';

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Analytics is only supported in browser window contexts
  if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
    try {
      analytics = getAnalytics(app);
    } catch {
      // Optional analytics guard
    }
  }
} catch (error) {
  console.warn('Firebase initialization notice:', error);
}

export { app, auth, db, storage, analytics };
