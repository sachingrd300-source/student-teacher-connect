
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentSignupRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <p>Redirecting to login...</p>
    </div>
  );
}
