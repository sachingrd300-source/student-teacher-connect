
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ShieldX, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { DashboardHeader } from '@/components/dashboard-header';

export default function TeacherStatusPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<{ name: string; role: 'tutor'; status: 'pending_verification' | 'approved' | 'denied' }>(userProfileRef);

    useEffect(() => {
        if (!isUserLoading && !isProfileLoading && userProfile) {
            if (userProfile.status === 'approved') {
                router.replace('/dashboard/teacher');
            }
        }
        if (!isUserLoading && !user) {
             router.replace('/login');
        }
    }, [isUserLoading, isProfileLoading, userProfile, router, user]);

     const handleLogout = async () => {
        if (!auth) return;
        await signOut(auth);
        router.replace('/login');
    };

    if (isUserLoading || isProfileLoading || !userProfile) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Loading your status...</p>
            </div>
        );
    }
    
    const StatusCard = () => {
        switch (userProfile.status) {
            case 'pending_verification':
                return (
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full w-fit">
                                <Clock className="h-10 w-10 text-yellow-500" />
                            </div>
                            <CardTitle className="mt-4">Account Pending Verification</CardTitle>
                            <CardDescription>
                                Your profile has been submitted for verification. You will be notified via email once the admin team has approved your account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-sm text-muted-foreground">Thank you for your patience.</p>
                        </CardContent>
                    </Card>
                );
            case 'denied':
                 return (
                    <Card className="w-full max-w-md border-destructive">
                        <CardHeader className="text-center">
                            <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
                                <ShieldX className="h-10 w-10 text-destructive" />
                            </div>
                            <CardTitle className="mt-4">Registration Denied</CardTitle>
                            <CardDescription>
                                We're sorry, but your registration could not be approved at this time. If you believe this is an error, please contact support.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                );
            default:
                return (
                     <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto bg-green-100 dark:bg-green-900/30 p-3 rounded-full w-fit">
                                <ShieldCheck className="h-10 w-10 text-success" />
                            </div>
                            <CardTitle className="mt-4">Account Approved</CardTitle>
                            <CardDescription>
                                Your account is approved. Redirecting to dashboard...
                            </CardDescription>
                        </CardHeader>
                    </Card>
                );
        }
    };
    
    return (
         <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile.name} userRole="tutor" />
            <main className="flex-1 flex flex-col items-center justify-center p-4">
               <StatusCard />
               <Button variant="outline" onClick={handleLogout} className="mt-6">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </main>
        </div>
    );
}
