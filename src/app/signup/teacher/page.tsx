'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RedirectToSignup() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/signup');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Redirecting...</p>
        </div>
    </div>
  );
}
