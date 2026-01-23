
'use client';

import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';

interface Enrollment {
    id: string;
    classTitle: string;
    classSubject: string;
    teacherName: string;
    status: 'pending' | 'approved' | 'denied';
}

export default function StudentDashboard() {
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();
    const router = useRouter();
    
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<{role: string, name: string}>(userProfileRef);

    useEffect(() => {
        if (isAuthLoading || isProfileLoading) {
            return;
        }
        if (!user) {
            router.replace('/login');
            return;
        }
        if (userProfile && userProfile.role !== 'student') {
            router.replace('/dashboard/teacher');
        }
    }, [user, isAuthLoading, userProfile, isProfileLoading, router]);

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user || !userProfile || userProfile.role !== 'student') return null;
        return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
    }, [firestore, user, userProfile]);

    const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

    if (isAuthLoading || isProfileLoading || !userProfile) {
        return (
            <div className="flex flex-col min-h-screen">
                <DashboardHeader userName="Loading..." userRole="student" />
                <div className="flex-1 flex items-center justify-center">
                    <p>Loading student dashboard...</p>
                </div>
            </div>
        );
    }

    if (userProfile.role !== 'student') {
        return (
            <div className="flex flex-col min-h-screen">
                <DashboardHeader userName={userProfile.name} userRole="tutor" />
                <div className="flex-1 flex items-center justify-center">
                    <p>Unauthorized. Redirecting...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile.name} userRole="student" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                    <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>
                    <Card>
                        <CardHeader>
                            <CardTitle>My Classes</CardTitle>
                            <CardDescription>Here are the classes you are enrolled in.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {enrollmentsLoading && <p>Loading your classes...</p>}
                            {enrollments && enrollments.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {enrollments.map((enrollment) => (
                                        <Card key={enrollment.id}>
                                            <CardHeader>
                                                <CardTitle className="text-lg">{enrollment.classTitle}</CardTitle>
                                                <CardDescription>Taught by {enrollment.teacherName}</CardDescription>
                                            </CardHeader>
                                            <CardFooter>
                                                <div className={`text-xs font-semibold capitalize px-2 py-1 rounded-full ${
                                                    enrollment.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    enrollment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {enrollment.status}
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                !enrollmentsLoading && <p className="text-center text-muted-foreground py-8">You haven't been enrolled in any classes yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
