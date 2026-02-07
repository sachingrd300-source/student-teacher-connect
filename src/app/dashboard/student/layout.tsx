'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

import { DashboardHeader } from '@/components/dashboard-header';
import { School } from 'lucide-react';
import { SupportButton } from '@/components/SupportButton';

interface UserProfile {
  name: string;
  role?: 'student' | 'teacher' | 'admin' | 'parent';
  coins?: number;
  streak?: number;
}

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (isUserLoading || profileLoading) return;
    if (!user) {
        router.replace('/login');
        return;
    }
    if (userProfile && userProfile.role !== 'student') {
        router.replace('/dashboard');
    }
  }, [user, userProfile, isUserLoading, profileLoading, router]);

  if (isUserLoading || profileLoading || !userProfile) {
    return (
        <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
            <School className="h-16 w-16 animate-pulse text-primary" />
            <p className="text-muted-foreground">Loading Student Portal...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader userProfile={userProfile} />
      <div className="flex flex-1">
        <main className="flex-1 p-4 md:p-8 bg-background">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <SupportButton />
    </div>
  );
}
