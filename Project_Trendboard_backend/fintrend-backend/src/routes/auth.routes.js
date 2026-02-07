// ============================================
// AUTHENTICATION ROUTES
// ============================================

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');

/**
 * Get current user profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { getFirestore } = require('../config/firebase');
    const db = getFirestore();
    
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User profile not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        ...userDoc.data(),
        uid: req.user.uid
      }
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get profile',
        code: 'PROFILE_ERROR'
      }
    });
  }
});

/**
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { displayName, preferences } = req.body;
    const { getFirestore } = require('../config/firebase');
    const db = getFirestore();
    
    const updateData = {
      updatedAt: new Date()
    };
    
    if (displayName) {
      updateData.displayName = displayName;
    }
    
    if (preferences) {
      updateData.preferences = preferences;
    }
    
    await db.collection('users').doc(req.user.uid).update(updateData);
    
    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update profile',
        code: 'UPDATE_ERROR'
      }
    });
  }
});

/**
 * Delete user account
 */
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const admin = require('firebase-admin');
    const { getFirestore } = require('../config/firebase');
    const db = getFirestore();
    
    // Delete from Firestore
    await db.collection('users').doc(req.user.uid).delete();
    
    // Delete from Firebase Auth
    await admin.auth().deleteUser(req.user.uid);
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete account',
        code: 'DELETE_ERROR'
      }
    });
  }
});

module.exports = router;
