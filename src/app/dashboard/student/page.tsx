'use client';

import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';

interface Enrollment {
    id: string;
    classTitle: string;
    teacherName: string;
    status: 'pending' | 'approved' | 'denied';
}

export default function StudentDashboard() {
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();
    
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);

    const { isLoading: isProfileLoading } = useDoc(userProfileRef);

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
    }, [firestore, user]);

    const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

    if (isAuthLoading || isProfileLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading student dashboard...</p>
            </div>
        );
    }

    return (
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
                                        <div className={`text-sm font-medium px-2 py-1 rounded-full ${
                                            enrollment.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            enrollment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            Status: {enrollment.status}
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
    );
}
