'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardRedirectPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      // Logic to determine user role and redirect will be based on Firestore profile
      // For now, we'll assume a simple redirect.
      // A full implementation would fetch the user's profile and redirect based on the 'role' field.
      // This is a placeholder for redirection logic.
      router.push('/dashboard/student'); // Default redirect, can be improved with role data
    } else if (!isUserLoading && !user) {
      router.push('/login');
    }
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
