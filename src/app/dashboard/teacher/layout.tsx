
'use client';

import React from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type UserProfile = {
  role: 'tutor' | 'student' | 'admin';
}

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileQuery);
  
  React.useEffect(() => {
    if (!isUserLoading && !user) {
        router.replace('/login');
    }
  }, [isUserLoading, user, router]);

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-5 w-96 mt-2" />
            </div>
        </div>
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-72" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-40 w-full" />
            </CardContent>
        </Card>
      </div>
    );
  }

  if (userProfile?.role !== 'tutor') {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <CardTitle className="mt-4">Access Denied</CardTitle>
                <CardDescription>
                You do not have the required permissions to view this page. This area is for tutors only.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Button asChild>
                    <Link href="/dashboard">Return to Dashboard</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return <div className="space-y-6">{children}</div>;
}
