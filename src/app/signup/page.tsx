
'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function SignUpPage() {
  useEffect(() => {
    redirect('/');
  }, []);

  return null;
}
