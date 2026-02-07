// ============================================
// FIREBASE CONFIGURATION
// NO HARDCODING - All from environment
// ============================================

const admin = require('firebase-admin');
const logger = require('../utils/logger');

let db = null;
let initialized = false;

const initializeFirebase = () => {
  if (initialized) {
    return db;
  }

  try {
    let credential = null;

    // ---------------------------------------------------------
    // OPTIMIZED FOR PRODUCTION: Multi-source Credential Loading
    // ---------------------------------------------------------

    // 1. Check for full service account JSON (Best for Render/Vercel)
    let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountJson) {
      try {
        // Remove possible wrapping quotes and trim
        serviceAccountJson = serviceAccountJson.trim();
        if (serviceAccountJson.startsWith("'") || serviceAccountJson.startsWith('"')) {
          serviceAccountJson = serviceAccountJson.substring(1, serviceAccountJson.length - 1);
        }

        const sa = JSON.parse(serviceAccountJson);
        if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
        credential = admin.credential.cert(sa);
        logger.info('🔑 Loaded credentials from FIREBASE_SERVICE_ACCOUNT JSON');
      } catch (e) {
        logger.error(`❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: ${e.message}`);
      }
    }

    // 2. Fallback to individual fields
    if (!credential) {
      const projectId = process.env.FIRESTORE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
      const privateKey = process.env.FIRESTORE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;
      const clientEmail = process.env.FIRESTORE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;

      if (projectId && privateKey && clientEmail) {
        let processedKey = privateKey.trim();
        processedKey = processedKey.replace(/\\n/g, '\n');

        if (!processedKey.includes('-----BEGIN PRIVATE KEY-----')) {
          processedKey = `-----BEGIN PRIVATE KEY-----\n${processedKey}\n-----END PRIVATE KEY-----`;
        }

        credential = admin.credential.cert({
          projectId,
          privateKey: processedKey,
          clientEmail
        });
        logger.info('🔑 Loaded credentials from individual environment variables');
      }
    }

    // 3. Last fallback: Local file (Development only)
    if (!credential) {
      try {
        const serviceAccount = require('../../serviceAccountKey.json');
        credential = admin.credential.cert(serviceAccount);
        logger.info('🏠 Loaded credentials from local serviceAccountKey.json');
      } catch (err) {
        throw new Error('❌ Missing Firebase Credentials: Set FIREBASE_SERVICE_ACCOUNT or individual fields.');
      }
    }

    if (!admin.apps.length) {
      admin.initializeApp({ credential });
    }

    db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true, merge: true });

    initialized = true;
    logger.info('✅ Firebase initialized successfully');
    return db;
  } catch (error) {
    logger.error('❌ Firebase initialization failed:', error.message);
    throw error;
  }
};

const getFirestore = () => {
  if (!db) return initializeFirebase();
  return db;
};

const testConnection = async () => {
  try {
    const db = getFirestore();
    const collection = process.env.FIRESTORE_COLLECTION || 'articles';
    await db.collection(collection).limit(1).get();
    logger.info('✅ Firestore connection verified');
    return true;
  } catch (error) {
    logger.error('❌ Firestore connection failed:', error.message);
    return false;
  }
};

const shutdown = async () => {
  try {
    if (initialized && admin.apps.length > 0) {
      await Promise.all(admin.apps.map(app => app.delete()));
      initialized = false;
      db = null;
      logger.info('✅ Firebase shutdown complete');
    }
  } catch (error) {
    logger.error('❌ Firebase shutdown error:', error.message);
  }
};

module.exports = {
  initializeFirebase,
  getFirestore,
  testConnection,
  shutdown,
  admin
};