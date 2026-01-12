'use client';
import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

/**
 * A client component that listens for globally emitted 'permission-error' events.
 * When an event is caught, it throws the error. Next.js's error boundary
 * will catch this and display the error overlay in development.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: Error) => {
      // Throwing the error here will propagate it to the nearest Next.js Error Boundary.
      // In development, this will be the development error overlay.
      // In production, it will be the nearest error.js file.
      throw error;
    };

    errorEmitter.on('permission-error', handleError);

    // Clean up the listener when the component unmounts.
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []); // Empty dependency array ensures this effect runs only once.

  // This component does not render anything itself.
  return null;
}
