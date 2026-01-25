
'use client';

import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { BookUser, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Enrollment {
    id: string;
    classTitle: string;
    classSubject: string;
    teacherName: string;
    status: 'pending' | 'approved' | 'denied';
}

interface TutorProfile {
    id: string;
    name: string;
    subjects?: string[];
    address?: string;
    coachingName?: string;
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

    const isStudent = userProfile?.role === 'student';

    useEffect(() => {
        if (isAuthLoading || isProfileLoading) {
            return;
        }
        if (!user) {
            router.replace('/login');
            return;
        }
        if (userProfile && !isStudent) {
            router.replace('/dashboard/teacher');
        }
    }, [user, isAuthLoading, userProfile, isProfileLoading, isStudent, router]);

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!isStudent || !firestore || !user) return null;
        return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
    }, [firestore, user, isStudent]);

    const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

    const tutorsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'users'), where('role', '==', 'tutor'));
    }, [firestore, user]);

    const { data: tutors, isLoading: tutorsLoading } = useCollection<TutorProfile>(tutorsQuery);


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

    if (!isStudent) {
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
            <main className="flex-1 animate-fade-in-down">
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
                                                    enrollment.status === 'approved' ? 'bg-success/10 text-success' :
                                                    enrollment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-destructive/10 text-destructive'
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

                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Find a Teacher</CardTitle>
                            <CardDescription>Browse available tutors on the platform.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tutorsLoading && <p>Loading tutors...</p>}
                            {tutors && tutors.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {tutors.map((tutor) => (
                                        <Card key={tutor.id} className="flex flex-col">
                                            <CardHeader className="flex-1">
                                                <CardTitle>{tutor.name}</CardTitle>
                                                {tutor.coachingName && <CardDescription>{tutor.coachingName}</CardDescription>}
                                            </CardHeader>
                                            <CardContent className="space-y-3 text-sm flex-1">
                                                {tutor.subjects && tutor.subjects.length > 0 && (
                                                    <div className="flex items-start gap-2">
                                                        <BookUser className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                                        <span>{tutor.subjects.join(', ')}</span>
                                                    </div>
                                                )}
                                                {tutor.address && (
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                                        <span>{tutor.address}</span>
                                                    </div>
                                                )}
                                            </CardContent>
                                            <CardFooter>
                                               <Button className="w-full" variant="secondary" disabled>View Profile</Button> 
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                !tutorsLoading && <p className="text-center text-muted-foreground py-8">No tutors are currently listed.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
