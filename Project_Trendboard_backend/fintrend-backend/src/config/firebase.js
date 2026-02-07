// ============================================
// FIREBASE CONFIGURATION - ROBUST PRO VERSION
// ============================================

const admin = require('firebase-admin');
const logger = require('../utils/logger');

let db = null;
let initialized = false;

// Helper to fix PEM keys from any source
const fixPrivateKey = (key) => {
  if (!key) return null;
  let fixed = key.trim();

  // Remove wrapping quotes
  if ((fixed.startsWith('"') && fixed.endsWith('"')) || (fixed.startsWith("'") && fixed.endsWith("'"))) {
    fixed = fixed.substring(1, fixed.length - 1);
  }

  // Handle escaped newlines
  fixed = fixed.replace(/\\n/g, '\n');

  // Ensure header/footer
  if (!fixed.includes('-----BEGIN PRIVATE KEY-----')) {
    fixed = `-----BEGIN PRIVATE KEY-----\n${fixed}`;
  }
  if (!fixed.includes('-----END PRIVATE KEY-----')) {
    fixed = `${fixed}\n-----END PRIVATE KEY-----`;
  }
  return fixed;
};

const initializeFirebase = () => {
  if (initialized) return db;

  try {
    let credential = null;
    const saVar = process.env.FIREBASE_SERVICE_ACCOUNT;

    // 1. Try FIREBASE_SERVICE_ACCOUNT (JSON or Base64)
    if (saVar) {
      try {
        let jsonStr = saVar.trim();
        // Check if it's Base64 (doesn't start with {)
        if (!jsonStr.startsWith('{')) {
          logger.info('📦 Detecting Base64 Service Account...');
          jsonStr = Buffer.from(jsonStr, 'base64').toString('utf8');
        }

        const sa = JSON.parse(jsonStr);
        if (sa.private_key) sa.private_key = fixPrivateKey(sa.private_key);
        credential = admin.credential.cert(sa);
        logger.info('✅ Loaded credentials from FIREBASE_SERVICE_ACCOUNT');
      } catch (e) {
        logger.error(`❌ FIREBASE_SERVICE_ACCOUNT Error: ${e.message}`);
      }
    }

    // 2. Try Individual Fields (Standard Fallback)
    if (!credential) {
      const projectId = process.env.FIRESTORE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIRESTORE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIRESTORE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;

      if (projectId && clientEmail && privateKey) {
        credential = admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: fixPrivateKey(privateKey)
        });
        logger.info('✅ Loaded credentials from individual FIRESTORE_* variables');
      }
    }

    // 3. Fallback to local file
    if (!credential) {
      try {
        const serviceAccount = require('../../serviceAccountKey.json');
        credential = admin.credential.cert(serviceAccount);
        logger.info('✅ Loaded credentials from serviceAccountKey.json');
      } catch (err) {
        throw new Error('Missing Firebase Credentials. Set FIREBASE_SERVICE_ACCOUNT or individual fields.');
      }
    }

    if (!admin.apps.length) {
      admin.initializeApp({ credential });
    }

    db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true, merge: true });
    initialized = true;
    logger.info('🔥 Firebase initialized successfully');
    return db;
  } catch (error) {
    logger.error('❌ Firebase initialization failed:', error.message);
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  getFirestore: () => (db || initializeFirebase()),
  testConnection: async () => {
    try {
      const database = db || initializeFirebase();
      await database.collection(process.env.FIRESTORE_COLLECTION || 'articles').limit(1).get();
      return true;
    } catch (e) {
      logger.error('❌ Firestore connection failed:', e.message);
      return false;
    }
  },
  shutdown: async () => {
    if (initialized) await Promise.all(admin.apps.map(app => app.delete()));
  },
  admin
};