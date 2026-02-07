// ============================================
// FIREBASE CONFIGURATION - SIMPLIFIED PROD
// ============================================

const admin = require('firebase-admin');
const logger = require('../utils/logger');

let db = null;
let initialized = false;

// Helper to fix PEM keys
const fixPrivateKey = (key) => {
  if (!key) return null;
  let fixed = key.trim();

  // Remove wrapping quotes if they exist
  if ((fixed.startsWith('"') && fixed.endsWith('"')) || (fixed.startsWith("'") && fixed.endsWith("'"))) {
    fixed = fixed.substring(1, fixed.length - 1);
  }

  // Handle escaped newlines (e.g. from Render UI)
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

    // 1. Try Individual Fields (Production Standard)
    const projectId = process.env.FIRESTORE_PROJECT_ID;
    const clientEmail = process.env.FIRESTORE_CLIENT_EMAIL;
    const privateKey = process.env.FIRESTORE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      credential = admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: fixPrivateKey(privateKey)
      });
      logger.info('✅ Loaded credentials from individual FIRESTORE_* variables');
    }

    // 2. Fallback to local file (Development)
    if (!credential) {
      try {
        const serviceAccount = require('../../serviceAccountKey.json');
        credential = admin.credential.cert(serviceAccount);
        logger.info('✅ Loaded credentials from serviceAccountKey.json');
      } catch (err) {
        throw new Error('Missing Firebase Credentials. Set FIRESTORE_PROJECT_ID, FIRESTORE_CLIENT_EMAIL, and FIRESTORE_PRIVATE_KEY.');
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