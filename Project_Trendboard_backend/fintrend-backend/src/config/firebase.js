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
    logger.debug('Firebase already initialized');
    return db;
  }

  try {
    let credential;
    
    // Check for environment variables first
    const projectId = process.env.FIRESTORE_PROJECT_ID;
    const privateKey = process.env.FIRESTORE_PRIVATE_KEY;
    const clientEmail = process.env.FIRESTORE_CLIENT_EMAIL;

    if (projectId && privateKey && clientEmail) {
      const processedKey = privateKey.replace(/\\n/g, '\n');
      credential = admin.credential.cert({
        projectId,
        privateKey: processedKey,
        clientEmail
      });
    } else {
      // Fallback to serviceAccountKey.json
      try {
        const serviceAccount = require('../../serviceAccountKey.json');
        credential = admin.credential.cert(serviceAccount);
        logger.info('🔑 Loaded credentials from serviceAccountKey.json');
      } catch (err) {
        throw new Error('Firebase credentials missing: Set environment variables or provide serviceAccountKey.json');
      }
    }

    if (!admin.apps.length) {
      admin.initializeApp({ credential });
    }

    db = admin.firestore();
    db.settings({
      ignoreUndefinedProperties: true,
      merge: true
    });

    initialized = true;
    logger.info('✅ Firebase initialized successfully');
    return db;
  } catch (error) {
    logger.error('❌ Firebase initialization failed:', error);
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
    logger.error('❌ Firestore connection failed:', error);
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
    logger.error('❌ Firebase shutdown error:', error);
  }
};

module.exports = {
  initializeFirebase,
  getFirestore,
  testConnection,
  shutdown,
  admin
};