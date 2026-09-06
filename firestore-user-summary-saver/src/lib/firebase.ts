/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, signInAnonymously, onAuthStateChanged, User, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAvrI5xOvmmPZNsq27ciWjWBOLqnZA5bQ8",
  authDomain: "gemini-journal-prod-92c37.firebaseapp.com",
  projectId: "gemini-journal-prod-92c37",
  storageBucket: "gemini-journal-prod-92c37.firebasestorage.app",
  messagingSenderId: "379590518322",
  appId: "1:379590518322:web:2df0342be644ea78b07e2b",
  measurementId: "G-B3VNVQP927"
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore using the default database
export const db: Firestore = getFirestore(app);

// Initialize Firebase Authentication
export const auth: Auth = getAuth(app);

/**
 * Ensures an authenticated user session exists.
 * If not already signed in, signs in anonymously to establish a verified UID and tenant boundary.
 */
export async function ensureAuthenticatedUser(): Promise<User> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (user) {
          unsubscribe();
          resolve(user);
        } else {
          try {
            const userCredential = await signInAnonymously(auth);
            unsubscribe();
            resolve(userCredential.user);
          } catch (error) {
            unsubscribe();
            reject(new Error(error instanceof Error ? error.message : 'Authentication failed'));
          }
        }
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
}

export {
  signInAnonymously,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
};