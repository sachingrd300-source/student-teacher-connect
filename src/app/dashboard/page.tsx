'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { Loader2, School } from 'lucide-react';

interface UserProfile {
    name: string;
    role: 'student' | 'teacher' | 'admin' | 'parent';
    coins?: number;
    streak?: number;
    lastLoginDate?: string; // YYYY-MM-DD
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

        if (userProfile && firestore) {
            // --- Daily Login & Streak Logic ---
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

            if (userProfile.role === 'student' && userProfile.lastLoginDate !== todayStr) {
                const updates: { [key: string]: any } = {
                    lastLoginDate: todayStr,
                };

                const lastLoginDate = userProfile.lastLoginDate;
                const currentCoins = userProfile.coins || 0;
                const currentStreak = userProfile.streak || 0;
                
                let newCoins = currentCoins + 5; // Grant daily login coins
                let newStreak = currentStreak;

                if (lastLoginDate) {
                    const lastLogin = new Date(lastLoginDate);
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);

                    if (lastLogin.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
                        // It's a consecutive day login
                        newStreak = currentStreak + 1;
                    } else {
                        // Streak is broken
                        newStreak = 1;
                    }
                } else {
                    // First login ever (or first since this feature was added)
                    newStreak = 1;
                }

                // Check for 7-day streak bonus
                if (newStreak > 0 && (newStreak % 7) === 0) {
                    newCoins += 50; // 7-day streak bonus
                }

                updates.coins = newCoins;
                updates.streak = newStreak;
                
                // Non-blocking update
                updateDoc(doc(firestore, 'users', user.uid), updates).catch(err => console.error("Failed to update user stats", err));
            }
            // --- End of Logic ---


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
    }, [user, userProfile, isUserLoading, profileLoading, router, firestore]);


    // Show a loading screen while we determine where to redirect.
    return (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
            <School className="h-12 w-12 animate-pulse text-primary" />
            <p className="text-muted-foreground">Redirecting to your dashboard... 🚀</p>
        </div>
    );
}
