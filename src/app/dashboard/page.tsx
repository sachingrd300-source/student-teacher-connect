
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { doc } from 'firebase/firestore';

type UserProfile = {
  role: 'teacher' | 'student';
}

export default function DashboardRedirectPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const userProfileQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileQuery);
  
  useEffect(() => {
    const isLoading = isUserLoading || isProfileLoading;
    
    if (!isLoading && user && userProfile) {
      if (userProfile.role === 'teacher') {
        router.push('/dashboard/teacher');
      } else if (userProfile.role === 'student') {
        router.push('/dashboard/student');
      } else {
        // Fallback or error for unknown role
        router.push('/login');
      }
    } else if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Redirecting...</h1>
        <p className="text-muted-foreground">Please wait while we take you to your dashboard.</p>
        <div className="flex justify-center">
            <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}
