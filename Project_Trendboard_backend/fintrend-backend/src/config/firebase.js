// ============================================
// FIREBASE CONFIGURATION - STRICT ENV ONLY
// ============================================

require('dotenv').config(); // Ensure env vars are loaded
const admin = require('firebase-admin');
const logger = require('../utils/logger');

let db = null;
let initialized = false;

// Helper to fix PEM keys (handles newlines and quotes)
const fixPrivateKey = (key) => {
  if (!key) return null;
  let fixed = key.trim();

  // Remove wrapping quotes if they exist
  if ((fixed.startsWith('"') && fixed.endsWith('"')) || (fixed.startsWith("'") && fixed.endsWith("'"))) {
    fixed = fixed.substring(1, fixed.length - 1);
  }

  // Handle escaped newlines (common in Render/Vercel)
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
    // 1. Load variables from Environment ONLY
    const projectId = process.env.FIRESTORE_PROJECT_ID;
    const clientEmail = process.env.FIRESTORE_CLIENT_EMAIL;
    const privateKey = process.env.FIRESTORE_PRIVATE_KEY;

    // 2. Debug Logging (Privacy Safe)
    if (!projectId) logger.warn('⚠️ FIRESTORE_PROJECT_ID is missing');
    if (!clientEmail) logger.warn('⚠️ FIRESTORE_CLIENT_EMAIL is missing');
    if (!privateKey) logger.warn('⚠️ FIRESTORE_PRIVATE_KEY is missing');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing one or more required Firebase environment variables');
    }

    const credential = admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: fixPrivateKey(privateKey)
    });

    if (!admin.apps.length) {
      admin.initializeApp({ credential });
    }

    db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true, merge: true });
    initialized = true;
    logger.info(`🔥 Firebase initialized for project: ${projectId}`);
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