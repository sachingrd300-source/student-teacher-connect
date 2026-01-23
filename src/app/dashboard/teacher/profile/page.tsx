'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { UserCircle, Mail, Phone, Badge } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-header';

interface UserProfile {
    name: string;
    email: string;
    role: 'tutor' | 'student';
    mobileNumber?: string;
}

export default function TeacherProfilePage() {
    const { user, isUserLoading: isAuthLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        if (isAuthLoading || isProfileLoading) {
            return;
        }
        if (!user) {
            router.replace('/login');
            return;
        }
        if (userProfile && userProfile.role !== 'tutor') {
            router.replace('/dashboard/student');
        }
    }, [user, isAuthLoading, userProfile, isProfileLoading, router]);

    if (isAuthLoading || isProfileLoading || !userProfile) {
        return (
            <div className="flex flex-col min-h-screen">
                <DashboardHeader userName="Loading..." userRole="tutor" />
                <div className="flex-1 flex items-center justify-center">
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

     if (userProfile.role !== 'tutor') {
        return (
            <div className="flex flex-col min-h-screen">
                 <DashboardHeader userName={userProfile.name} userRole="student" />
                <div className="flex-1 flex items-center justify-center">
                    <p>Unauthorized. Redirecting...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile.name} userRole="tutor" />
            <main className="flex-1">
                 <div className="container mx-auto p-4 md:p-8">
                    <h1 className="text-3xl font-bold mb-6">My Profile</h1>
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <UserCircle className="h-8 w-8 text-primary" />
                                {userProfile.name}
                            </CardTitle>
                            <CardDescription>
                                Your personal details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{userProfile.email}</p>
                                </div>
                            </div>
                            {userProfile.mobileNumber && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Mobile Number</p>
                                        <p className="font-medium">{userProfile.mobileNumber}</p>
                                    </div>
                                </div>
                            )}
                             <div className="flex items-center gap-3">
                                <Badge className="h-5 w-5 text-muted-foreground" />
                                <div>
                                     <p className="text-sm text-muted-foreground">Role</p>
                                    <p className="font-medium capitalize">{userProfile.role}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
