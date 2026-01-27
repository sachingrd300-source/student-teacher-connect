'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useEffect } from 'react';

interface UserProfile {
    name: string;
    role: 'student' | 'teacher' | 'admin';
}

export default function DashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        if (isUserLoading || profileLoading) {
            return; // Still loading, do nothing.
        }
        
        if (!user) {
            router.replace('/login');
            return;
        }

        if (userProfile) {
            if (userProfile.role === 'teacher') {
                router.replace('/dashboard/teacher');
            } else if (userProfile.role === 'student') {
                router.replace('/dashboard/student');
            } else if (userProfile.role === 'admin') {
                router.replace('/dashboard/admin');
            }
            else {
                // Handle cases where role might not be set, maybe redirect to a role selection page or default
                // For now, we'll just log an error and they'll see the loading screen.
                console.error('User role not found or is invalid.');
                 router.replace('/login');
            }
        }
    }, [user, userProfile, isUserLoading, profileLoading, router]);


    // Show a loading screen while we determine where to redirect.
    return <div className="flex h-screen items-center justify-center">Redirecting...</div>;
}
