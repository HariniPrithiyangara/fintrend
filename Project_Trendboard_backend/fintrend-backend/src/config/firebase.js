// ============================================
// FIREBASE CONFIGURATION - BASE64 & ENV
// ============================================

require('dotenv').config();
const admin = require('firebase-admin');
const logger = require('../utils/logger');

let db = null;
let initialized = false;

const fixPrivateKey = (key) => {
  if (!key) return null;
  let fixed = key.trim();
  if ((fixed.startsWith('"') && fixed.endsWith('"')) || (fixed.startsWith("'") && fixed.endsWith("'"))) {
    fixed = fixed.substring(1, fixed.length - 1);
  }
  fixed = fixed.replace(/\\n/g, '\n');
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
    let credential;

    // 1. Check for Base64 Encoded JSON (Most robust for Render)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      try {
        const jsonStr = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(jsonStr);
        credential = admin.credential.cert(serviceAccount);
        logger.info('✅ Initialized using FIREBASE_SERVICE_ACCOUNT_BASE64');
      } catch (e) {
        logger.warn('⚠️ Failed to decode FIREBASE_SERVICE_ACCOUNT_BASE64: ' + e.message);
      }
    }

    // 2. Check for Raw JSON String (FIREBASE_SERVICE_ACCOUNT)
    if (!credential && process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        let jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT;
        // Handle potential extra quotes added by some env parsers
        if (typeof jsonStr === 'string' && jsonStr.startsWith("'") && jsonStr.endsWith("'")) {
          jsonStr = jsonStr.slice(1, -1);
        }
        const serviceAccount = JSON.parse(jsonStr);
        credential = admin.credential.cert(serviceAccount);
        logger.info('✅ Initialized using FIREBASE_SERVICE_ACCOUNT (Raw JSON)');
      } catch (e) {
        logger.warn('⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT: ' + e.message);
      }
    }

    // 2. Fallback to Individual Env Vars
    if (!credential) {
      const projectId = process.env.FIRESTORE_PROJECT_ID;
      const clientEmail = process.env.FIRESTORE_CLIENT_EMAIL;
      const privateKey = process.env.FIRESTORE_PRIVATE_KEY;

      if (projectId && clientEmail && privateKey) {
        credential = admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: fixPrivateKey(privateKey)
        });
        logger.info('✅ Initialized using individual FIRESTORE_* variables');
      }
    }

    if (!credential) {
      throw new Error('❌ Missing Firebase Credentials. Please set FIREBASE_SERVICE_ACCOUNT_BASE64 or FIRESTORE_* variables.');
    }

    if (!admin.apps.length) {
      admin.initializeApp({ credential });
    }

    db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true, merge: true });
    initialized = true;
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
      logger.error('❌ Firestore connection failed DETAILS:', e);
      return false;
    }
  },
  shutdown: async () => {
    if (initialized) await Promise.all(admin.apps.map(app => app.delete()));
  },
  admin
};