'use client';

import { FormEvent, useState } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, serverTimestamp, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface Enrollment {
    id: string;
    classTitle: string;
    teacherName: string;
    status: 'pending' | 'approved' | 'denied';
}

export default function StudentDashboard() {
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();
    
    const [classCode, setClassCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
    }, [firestore, user]);

    const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

    const handleJoinClass = async (e: FormEvent) => {
        e.preventDefault();
        if (!classCode.trim() || !user || !userProfile || !firestore) {
            setError("Please enter a class code.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const classesRef = collection(firestore, 'classes');
            const q = query(classesRef, where("classCode", "==", classCode.trim().toUpperCase()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError("Invalid class code. Please check and try again.");
                setIsSubmitting(false);
                return;
            }

            const classDoc = querySnapshot.docs[0];
            const classData = classDoc.data();

            if (classData.teacherId === user.uid) {
                setError("You cannot enroll in your own class.");
                setIsSubmitting(false);
                return;
            }

            const enrollmentData = {
                studentId: user.uid,
                studentName: userProfile.name,
                classId: classDoc.id,
                teacherId: classData.teacherId,
                classTitle: classData.title,
                classSubject: classData.subject,
                teacherName: classData.teacherName,
                status: 'pending',
                createdAt: serverTimestamp(),
            };
            
            const enrollmentsColRef = collection(firestore, 'enrollments');
            await addDocumentNonBlocking(enrollmentsColRef, enrollmentData);
            
            setSuccessMessage(`Enrollment request sent for "${classData.title}"!`);
            setClassCode('');

        } catch (err) {
            console.error(err);
            setError("An error occurred while sending the request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

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
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Join a New Class</CardTitle>
                            <CardDescription>Enter the unique code provided by your teacher.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleJoinClass} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="class-code">Class Code</Label>
                                    <Input
                                        id="class-code"
                                        placeholder="e.g., AB12CD"
                                        value={classCode}
                                        onChange={(e) => setClassCode(e.target.value)}
                                        required
                                        className="uppercase"
                                    />
                                </div>
                                {error && <p className="text-sm text-destructive">{error}</p>}
                                {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting ? 'Sending Request...' : 'Send Enrollment Request'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>My Classes</CardTitle>
                        <CardDescription>Here are the classes you are enrolled in or have requested to join.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {enrollmentsLoading && <p>Loading your classes...</p>}
                        {enrollments && enrollments.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2">
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
                            !enrollmentsLoading && <p className="text-center text-muted-foreground py-8">You haven't joined any classes yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
