'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useEffect } from 'react';
import { School } from 'lucide-react';

interface UserProfile {
    role: 'teacher';
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

        if (userProfile) {
            if (userProfile.role !== 'teacher') {
                router.replace('/dashboard');
                return;
            }
            router.replace('/dashboard/teacher/coaching');
        }
    }, [user, userProfile, isUserLoading, profileLoading, router]);

    // Show a loading screen while we determine where to redirect.
    return (
        <div className="flex h-screen items-center justify-center flex-col gap-4">
            <School className="h-12 w-12 animate-pulse text-primary" />
            <p className="text-muted-foreground">Preparing your dashboard...</p>
        </div>
    );
}
