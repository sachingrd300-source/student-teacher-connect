'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';

interface UserProfile {
    name: string;
    role: 'student' | 'teacher';
}

export default function TeacherDashboardPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        if (isUserLoading || profileLoading) return;
        if (!user) {
            router.replace('/login');
            return;
        }
        if (userProfile && userProfile.role !== 'teacher') {
            // If a non-teacher tries to access, redirect them to the main dashboard router.
            router.replace('/dashboard');
        }
    }, [user, userProfile, isUserLoading, profileLoading, router]);


    if (isUserLoading || profileLoading || !userProfile) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userName={userProfile?.name} />
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <h1 className="text-4xl font-bold font-serif">Welcome, Teacher!</h1>
                <p className="mt-4 text-lg text-muted-foreground">This is your teacher dashboard.</p>
            </div>
        </div>
    );
}
