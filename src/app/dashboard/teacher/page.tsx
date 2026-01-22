'use client';

import { FormEvent, useState } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, serverTimestamp, doc } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { User, School } from 'lucide-react';

interface Class {
    id: string;
    title: string;
    subject: string;
    classCode: string;
}

interface EnrollmentRequest {
    id: string;
    studentName: string;
    classTitle: string;
}

export default function TeacherDashboard() {
    const firestore = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();

    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

    const classesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid));
    }, [firestore, user]);

    const { data: classes, isLoading: classesLoading } = useCollection<Class>(classesQuery);

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'enrollments'), 
            where('teacherId', '==', user.uid),
            where('status', '==', 'pending')
        );
    }, [firestore, user]);

    const { data: enrollmentRequests, isLoading: enrollmentsLoading } = useCollection<EnrollmentRequest>(enrollmentsQuery);

    const handleCreateClass = (e: FormEvent) => {
        e.preventDefault();
        if (!user || !userProfile || !firestore) return;

        setIsSubmitting(true);
        
        const newClassData = {
            teacherId: user.uid,
            teacherName: userProfile.name,
            title,
            subject,
            classCode: nanoid(6).toUpperCase(),
            createdAt: serverTimestamp(),
        };

        const classesColRef = collection(firestore, 'classes');
        addDocumentNonBlocking(classesColRef, newClassData)
          .then(() => {
              setTitle('');
              setSubject('');
          })
          .finally(() => {
              setIsSubmitting(false);
          });
    };

    const handleEnrollmentAction = (enrollmentId: string, newStatus: 'approved' | 'denied') => {
        if (!firestore) return;
        const enrollmentRef = doc(firestore, 'enrollments', enrollmentId);
        updateDocumentNonBlocking(enrollmentRef, { status: newStatus });
    };

    if (isAuthLoading || isProfileLoading) {
        return (
             <div className="flex items-center justify-center min-h-screen">
                <p>Loading teacher dashboard...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6">Teacher Dashboard</h1>
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Classes</CardTitle>
                            <CardDescription>Here are the classes you've created.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {classesLoading && <p>Loading classes...</p>}
                            {classes && classes.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {classes.map((c) => (
                                        <Card key={c.id}>
                                            <CardHeader>
                                                <CardTitle className="text-lg">{c.title}</CardTitle>
                                                <CardDescription>{c.subject}</CardDescription>
                                            </CardHeader>
                                            <CardFooter>
                                                 <div className="text-sm text-muted-foreground">Class Code: <span className="font-mono text-base font-bold text-foreground">{c.classCode}</span></div>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                !classesLoading && <p className="text-center text-muted-foreground py-8">You haven't created any classes yet.</p>
                            )}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Enrollment Requests</CardTitle>
                            <CardDescription>Students waiting for your approval.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {enrollmentsLoading && <p>Loading requests...</p>}
                            {enrollmentRequests && enrollmentRequests.length > 0 ? (
                                <div className="space-y-4">
                                    {enrollmentRequests.map((req) => (
                                        <div key={req.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                                            <div>
                                                <p className="font-semibold">{req.studentName}</p>
                                                <p className="text-sm text-muted-foreground">wants to join "{req.classTitle}"</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleEnrollmentAction(req.id, 'approved')}>Approve</Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleEnrollmentAction(req.id, 'denied')}>Deny</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                !enrollmentsLoading && <p className="text-center text-muted-foreground py-8">No pending enrollment requests.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Create a New Class</CardTitle>
                        <CardDescription>Fill in the details to create a new class batch.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateClass} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Class Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Grade 10 Physics"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    placeholder="e.g., Physics"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? 'Creating...' : 'Create Class'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
