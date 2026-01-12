
'use client';

import { useUser } from '@/firebase/auth';
import { firestore } from '@/firebase/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, getDoc } from 'firebase/firestore';

type UserProfile = {
  role: 'teacher' | 'student';
}

export default function DashboardRedirectPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  
  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user status is resolved
    }
    
    if (!user) {
      router.push('/');
      return;
    }

    const checkUserProfile = async () => {
      const userDocRef = doc(firestore, 'users', user.uid);
      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userProfile = userDoc.data() as UserProfile;
          if (userProfile.role === 'teacher') {
            router.push('/dashboard/teacher');
          } else if (userProfile.role === 'student') {
            router.push('/dashboard/student');
          } else {
            // Fallback for unknown role
            router.push('/login');
          }
        } else {
          // If profile doesn't exist, maybe they are mid-signup
          // Or it's an error state. Redirect to login.
          console.warn("User profile not found for logged-in user.");
          router.push('/login');
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        router.push('/login');
      }
    };
    
    checkUserProfile();

  }, [user, isUserLoading, router]);

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
