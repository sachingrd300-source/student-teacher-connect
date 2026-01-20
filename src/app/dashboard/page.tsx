
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

type UserProfile = {
  role: 'tutor' | 'student' | 'admin';
}

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileQuery);

  useEffect(() => {
    if (isUserLoading || isProfileLoading) {
      // Still loading, do nothing yet.
      return;
    }
    
    if (!user) {
        // Not logged in, redirect to landing page.
        // In the future, this could be a login page.
        router.push('/');
        return;
    }

    if (userProfile?.role === 'admin') {
      router.push('/dashboard/admin');
    } else if (userProfile?.role === 'tutor') {
      router.push('/dashboard/teacher');
    } else {
      // Default to student dashboard if role is 'student' or not found.
      router.push('/dashboard/student');
    }

  }, [router, user, userProfile, isUserLoading, isProfileLoading]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
            <Skeleton className="h-12 w-12 rounded-full animate-spin" />
        </div>
        <h1 className="text-2xl font-bold">Checking your role...</h1>
        <p className="text-muted-foreground">Please wait while we take you to your dashboard.</p>
      </div>
    </div>
  );
}
