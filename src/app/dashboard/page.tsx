'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';

export default function DashboardRedirector() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<{role: string}>(userProfileRef);

  useEffect(() => {
    if (isUserLoading || isProfileLoading) {
      return; // Wait for user and profile to load
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (userProfile) {
      if (userProfile.role === 'tutor') {
        router.replace('/dashboard/teacher');
      } else if (userProfile.role === 'student') {
        router.replace('/dashboard/student');
      } else {
        // Fallback for other roles or if role is not defined
        // For now, just stay on a loading page or redirect to a generic page
        console.error("Unknown or missing user role:", userProfile.role);
      }
    }
    // If userProfile is loading, the effect will re-run when it's available.
  }, [user, isUserLoading, userProfile, isProfileLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Loading your dashboard...</p>
    </div>
  );
}
