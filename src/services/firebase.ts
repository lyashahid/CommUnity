// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  onAuthStateChanged as fbOnAuthStateChanged,
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
  User,
  setPersistence as fbSetPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc as fbDeleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp as fbServerTimestamp,
  Timestamp,
  onSnapshot as fbOnSnapshot,
  increment,
  arrayUnion
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

// --- Firebase config ---
const firebaseConfig = {
  apiKey: "AIzaSyAjlnDLtTM6h733f2iAZEXWV91opwgbaFs",
  authDomain: "communityapp-ea78a.firebaseapp.com",
  projectId: "communityapp-ea78a",
  storageBucket: "communityapp-ea78a.firebasestorage.app",
  messagingSenderId: "1064584257319",
  appId: "1:1064584257319:web:4e899130e885ac83f89302",
  measurementId: "G-PSGLFE6HME"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth and Firestore instances with proper React Native persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
const db = getFirestore(app);
const storage = getStorage(app);

// --- Auth methods ---
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return fbOnAuthStateChanged(auth, callback);
};

export const signInWithEmailAndPassword = async (email: string, password: string) => {
  try {
    return await fbSignInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error('Login error:', error);
    let errorMessage = 'Failed to sign in';
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        errorMessage = 'Invalid email or password';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Please try again later.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address';
        break;
    }
    throw new Error(errorMessage);
  }
};

export const createUserWithEmailAndPassword = async (email: string | undefined | null, password: string, displayName?: string) => {
  // Check if email is provided and is a string
  if (typeof email !== 'string' || !email) {
    const error = new Error('Please enter a valid email address');
    error.name = 'auth/invalid-email';
    throw error;
  }
  
  // Ensure email is properly formatted and trimmed
  const trimmedEmail = email.trim();
  console.log('Attempting to create user with email:', trimmedEmail);
  
  // Validate email format before making the request
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    const error = new Error('Please enter a valid email address');
    error.name = 'auth/invalid-email';
    throw error;
  }
  
  try {
    const userCredential = await fbCreateUserWithEmailAndPassword(auth, trimmedEmail, password);
    console.log('User created successfully:', userCredential.user.uid);
    
    // Update the user's profile with display name if provided
    if (displayName && displayName.trim()) {
      await fbUpdateProfile(userCredential.user, {
        displayName: displayName.trim()
      });
      console.log('User display name updated:', displayName.trim());
    }
    
    return userCredential;
  } catch (error: any) {
    console.error('Signup error details:', {
      code: error.code,
      message: error.message,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
    
    let errorMessage = 'Failed to create account. Please try again.';
    
    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection';
          break;
      }
    }
    
    const errorToThrow = new Error(errorMessage);
    errorToThrow.name = error.code || 'AuthError';
    throw errorToThrow;
  }
};

export const signOut = () => fbSignOut(auth);

export const updateUserProfile = async (
  user: User,
  { displayName, photoURL }: { displayName?: string | null; photoURL?: string | null }
) => {
  try {
    await fbUpdateProfile(user, {
      displayName: displayName?.trim() || undefined,
      photoURL: photoURL || undefined,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error('Failed to update profile. Please try again.');
  }
};

// --- Firestore helper methods ---
export const serverTimestamp = fbServerTimestamp;

// Export Firestore functions directly
export { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc,
  addDoc,
  fbDeleteDoc as deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  fbOnSnapshot as onSnapshot,
  increment,
  arrayUnion
};

// Export Storage functions directly
export {
  getStorage,
  storageRef as ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
};

// Export collection references
export const postsCol = collection(db, 'posts');

// Export instances
export { auth, db, storage };