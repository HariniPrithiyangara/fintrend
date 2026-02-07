// ============================================
// AUTH CONTEXT - FIREBASE AUTHENTICATION
// NO HARDCODING
// ============================================

import React, { createContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { app } from '../config/firebase';

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => false,
  signup: async () => false,
  loginWithGoogle: async () => false,
  logout: async () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Save user to localStorage
        try {
          localStorage.setItem('user', JSON.stringify({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL
          }));
        } catch (error) {
          console.error('Error saving user:', error);
        }
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Get user-friendly error message
   */
  const getErrorMessage = (code) => {
    const errorMap = {
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'This account has been disabled',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'Email already in use',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/network-request-failed': 'Network error. Check your connection.',
      'auth/too-many-requests': 'Too many attempts. Try again later.',
      'auth/operation-not-allowed': 'Operation not allowed',
      'auth/popup-closed-by-user': 'Sign-in cancelled',
      'auth/popup-blocked': 'Popup blocked. Allow popups for this site.',
      'auth/cancelled-popup-request': 'Sign-in cancelled',
      'auth/account-exists-with-different-credential': 'Account exists with different sign-in method'
    };
    return errorMap[code] || 'Authentication failed. Please try again.';
  };

  /**
   * Handle authentication errors
   */
  const handleError = (error) => {
    const message = getErrorMessage(error?.code || error?.message);
    toast.error(message);
    console.error('Auth error:', error);
  };

  /**
   * Login with email and password
   */
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast.success(`Welcome back, ${result.user.email}!`);
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  /**
   * Sign up with email and password
   */
  const signup = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      toast.success(`Account created successfully!`);
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  /**
   * Login with Google
   */
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const displayName = result.user.displayName || result.user.email;
      toast.success(`Welcome, ${displayName}!`);
      return true;
    } catch (error) {
      // Handle specific popup errors gracefully
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup blocked. Allow popups for this site.');
      } else {
        handleError(error);
      }
      return false;
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;