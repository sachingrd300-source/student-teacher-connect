'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DeprecatedPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/signup');
    }, [router]);

    return <div className="flex h-screen w-full items-center justify-center">Redirecting...</div>;
}
