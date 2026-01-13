
'use client';

import { useMemo } from 'react';

import { auth, firestore, initializeFirebase } from './firebase';

import { useUser } from './auth';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';

import {
  FirebaseProvider,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
} from './provider';
import { FirebaseClientProvider } from './client-provider';


// A simple wrapper around React's useMemo to make it more explicit for Firebase queries.
// This helps prevent re-renders by ensuring the query object is stable.
const useMemoFirebase = <T>(factory: () => T | null, deps: React.DependencyList): T | null => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(factory, deps);
}

export {
    auth,
    firestore,
    initializeFirebase,
    FirebaseProvider,
    FirebaseClientProvider,
    useUser,
    useCollection,
    useDoc,
    useMemoFirebase,
    useFirebase,
    useFirebaseApp,
    useFirestore,
    useAuth,
};
