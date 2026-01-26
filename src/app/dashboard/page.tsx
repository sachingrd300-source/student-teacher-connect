
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';

interface UserProfile {
    role: 'student' | 'tutor' | 'admin';
    name: string;
    status?: 'pending_verification' | 'approved' | 'denied';
}

export default function DashboardRedirectPage() {
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
            return; // Wait until user and profile data are loaded
        }
        
        if (!user) {
            router.replace('/login');
            return;
        }

        if (userProfile) {
            switch(userProfile.role) {
                case 'admin':
                    router.replace('/dashboard/admin');
                    break;
                case 'tutor':
                    if (userProfile.status === 'approved') {
                        router.replace('/dashboard/teacher');
                    } else {
                        // Redirect to a status page if not approved
                        router.replace('/dashboard/teacher/status');
                    }
                    break;
                case 'student':
                    router.replace('/dashboard/student');
                    break;
                default:
                    router.replace('/login'); // Fallback
                    break;
            }
        }
    }, [user, userProfile, isUserLoading, profileLoading, router]);


    // Render a loading state while we determine the redirect.
    return (
        <div className="flex flex-col min-h-screen">
            <DashboardHeader userName={userProfile?.name} userRole={userProfile?.role} />
            <div className="flex-1 flex items-center justify-center">
                <p>Loading your dashboard...</p>
            </div>
        </div>
    );
}
