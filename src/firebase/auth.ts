
'use client';

import * as React from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
  type UserCredential,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { auth } from './firebase';

const googleProvider = new GoogleAuthProvider();

export const loginWithEmail = (email: string, password: string): Promise<UserCredential> =>
  signInWithEmailAndPassword(auth, email, password);

export const signupWithEmail = (email: string, password: string): Promise<UserCredential> =>
  createUserWithEmailAndPassword(auth, email, password);

export const loginWithGoogle = (): Promise<UserCredential> =>
  signInWithPopup(auth, googleProvider);

export const logout = (): Promise<void> => signOut(auth);

export function useUser() {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, isLoading };
}

// Phone Auth Functions
export const setupRecaptcha = (containerId: string) => {
    if (typeof window === 'undefined') {
        throw new Error("reCAPTCHA must be run in a browser environment");
    }

    const recaptchaContainer = document.getElementById(containerId);
    if (!recaptchaContainer) {
        throw new Error(`Element with id '${containerId}' not found.`);
    }

    // Clear any previous verifier
    if ((window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier.clear();
      // Ensure the container is empty
      while (recaptchaContainer.firstChild) {
          recaptchaContainer.removeChild(recaptchaContainer.firstChild);
      }
    }
    
    const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          console.log("reCAPTCHA solved");
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
          console.log("reCAPTCHA expired");
        }
    });

    (window as any).recaptchaVerifier = recaptchaVerifier;
    return recaptchaVerifier;
};


export const sendOtp = (phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
    return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
};


// Re-exporting auth for convenience if needed elsewhere, though direct use is discouraged.
export { auth };
