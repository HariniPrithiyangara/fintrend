// ============================================
// FIREBASE CLIENT CONFIGURATION
// NO HARDCODING - All from environment
// ============================================

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate required config
const requiredConfigs = ['apiKey', 'projectId', 'appId'];
const missingConfigs = requiredConfigs.filter(key => !firebaseConfig[key]);

if (missingConfigs.length > 0) {
  console.error('❌ Missing Firebase configuration:', missingConfigs);
  console.error('Please add these to your .env file:');
  missingConfigs.forEach(key => {
    console.error(`VITE_FIREBASE_${key.toUpperCase()}`);
  });
  throw new Error(`Missing Firebase configuration: ${missingConfigs.join(', ')}`);
}

// Initialize Firebase  
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

console.log('✅ Firebase initialized successfully');

// Export for AuthContext
export { app, analytics, firebaseConfig };
