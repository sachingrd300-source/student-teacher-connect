
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect everyone to the student dashboard by default
    // as there is no login to determine the role.
    router.push('/dashboard/student');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Redirecting...</h1>
        <p className="text-muted-foreground">Please wait while we take you to the dashboard.</p>
        <div className="flex justify-center">
            <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}
