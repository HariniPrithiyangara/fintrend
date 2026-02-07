// ============================================
// AUTHENTICATION MIDDLEWARE
// Firebase Admin SDK Token Verification
// ============================================

const { getFirestore } = require('../config/firebase');
const logger = require('../utils/logger');

/**
 * Verify Firebase ID token and attach user to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access token required',
          code: 'NO_TOKEN'
        }
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify ID token using Firebase Admin SDK
    const admin = require('firebase-admin');
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture
    };

    // Optional: Check if user exists in Firestore
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      // Create user profile if doesn't exist
      await db.collection('users').doc(decodedToken.uid).set({
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email,
        photoURL: decodedToken.picture || '',
        emailVerified: decodedToken.email_verified,
        createdAt: new Date(),
        lastLogin: new Date()
      });
    } else {
      // Update last login
      await db.collection('users').doc(decodedToken.uid).update({
        lastLogin: new Date()
      });
    }

    logger.debug(`Authenticated user: ${req.user.email}`);
    next();

  } catch (error) {
    logger.error('Authentication error:', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        }
      });
    }

    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token revoked',
          code: 'TOKEN_REVOKED'
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      }
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without auth
    }

    const token = authHeader.split(' ')[1];
    const admin = require('firebase-admin');
    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture
    };

    next();

  } catch (error) {
    // Continue without auth for optional routes
    logger.debug('Optional auth failed, continuing:', error.message);
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};
