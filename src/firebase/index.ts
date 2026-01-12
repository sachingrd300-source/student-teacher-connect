
'use client';

import { auth, firestore } from './firebase';
import { useUser } from './auth';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { useMemo } from 'react';

// A simple wrapper around React's useMemo to make it more explicit for Firebase queries.
// This helps prevent re-renders by ensuring the query object is stable.
const useMemoFirebase = <T>(factory: () => T | null, deps: React.DependencyList): T | null => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(factory, deps);
}

const useFirestore = () => firestore;
const useAuth = () => auth;

export {
    auth,
    firestore,
    useAuth,
    useFirestore,
    useUser,
    useCollection,
    useDoc,
    useMemoFirebase,
};

    