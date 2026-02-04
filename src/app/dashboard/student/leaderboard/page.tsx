'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LeaderboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/student');
  }, [router]);
  
  return (
    <div className="flex h-full flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting...</p>
    </div>
  );
}
