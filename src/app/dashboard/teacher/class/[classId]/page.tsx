'use client';

import { useMemo } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, Timestamp } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Check, X, Users, Clock, ArrowLeft, Phone } from 'lucide-react';
import Link from 'next/link';

interface EnrolledStudent {
    id: string; // This is the enrollment doc id
    studentId: string;
    studentName: string;
    mobileNumber: string;
    status: 'pending' | 'approved' | 'denied';
    createdAt: Timestamp;
}

const StudentRow = ({ student, onApprove, onDeny }: { student: EnrolledStudent, onApprove: (id: string) => void, onDeny: (id: string) => void}) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b last:border-0">
        <div>
            <p className="font-semibold">{student.studentName}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <Phone className="h-4 w-4"/> {student.mobileNumber || 'Not Provided'}
            </p>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0">
            <Button size="sm" variant="outline" className="bg-success/10 text-success hover:bg-success/20 hover:text-success" onClick={() => onApprove(student.id)}>
                <Check className="h-4 w-4 mr-2" />Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDeny(student.id)}>
                <X className="h-4 w-4 mr-2" />Deny
            </Button>
        </div>
    </div>
);

const ApprovedStudentRow = ({ student, classId }: { student: EnrolledStudent, classId: string }) => (
     <div className="flex items-center justify-between p-3 border-b last:border-0">
        <div>
            <p className="font-medium">{student.studentName}</p>
            <p className="text-sm text-muted-foreground">{student.mobileNumber || 'Not provided'}</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/teacher/class/${classId}/student/${student.studentId}`}>View Details</Link>
        </Button>
    </div>
);

export default function ManageClassPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const params = useParams();
    const router = useRouter();
    const classId = params.classId as string;

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile } = useDoc(userProfileRef);
    
    const classRef = useMemoFirebase(() => {
        if (!firestore || !classId) return null;
        return doc(firestore, 'classes', classId);
    }, [firestore, classId]);
    const { data: classData, isLoading: classLoading } = useDoc<{title:string, subject: string, classCode: string, teacherId: string}>(classRef);

    // Fetch enrollments for this specific class, ensuring the teacher is the owner.
    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !classId || !user) return null;
        return query(collection(firestore, 'enrollments'), where('classId', '==', classId), where('teacherId', '==', user.uid));
    }, [firestore, classId, user]);

    const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<EnrolledStudent>(enrollmentsQuery);

    const pendingStudents = useMemo(() => enrollments?.filter(s => s.status === 'pending') || [], [enrollments]);
    const approvedStudents = useMemo(() => enrollments?.filter(s => s.status === 'approved') || [], [enrollments]);

    // Security check: if the class data loads and the current user is not the teacher, redirect.
    if (!classLoading && classData && user && classData.teacherId !== user.uid) {
        router.replace('/dashboard/teacher');
        return <div className="flex h-screen items-center justify-center">Unauthorized access. Redirecting...</div>;
    }

    const handleRequest = (enrollmentId: string, newStatus: 'approved' | 'denied') => {
        if (!firestore) return;
        const enrollmentRef = doc(firestore, 'enrollments', enrollmentId);
        updateDocumentNonBlocking(enrollmentRef, { status: newStatus });
    };

    if (classLoading || enrollmentsLoading) {
        return <div className="flex h-screen items-center justify-center">Loading class details...</div>
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="tutor" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                     <div className="mb-6">
                         <Button variant="outline" size="sm" asChild>
                            <Link href="/dashboard/teacher">
                                <ArrowLeft className="h-4 w-4 mr-2"/>
                                Back to Dashboard
                            </Link>
                         </Button>
                    </div>

                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="text-2xl">{classData?.title}</CardTitle>
                            <CardDescription>{classData?.subject}</CardDescription>
                            <div className="pt-2">
                                <p className="text-sm text-muted-foreground">Share this code with your students to let them join:</p>
                                <p className="font-mono text-xl font-bold tracking-widest text-primary bg-muted p-2 rounded-md inline-block mt-1">{classData?.classCode}</p>
                            </div>
                        </CardHeader>
                        <CardFooter className="gap-4">
                            <Button asChild><Link href={`/dashboard/teacher/class/${classId}/performance`}>View Student Performance</Link></Button>
                        </CardFooter>
                    </Card>

                    <div className="grid gap-8 md:grid-cols-2">
                        <Card>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-amber-500" />
                                    Pending Requests ({pendingStudents.length})
                                </CardTitle>
                                <CardDescription>Review and approve or deny new student enrollment requests.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {pendingStudents.length > 0 ? (
                                    <div>
                                        {pendingStudents.map(student => (
                                            <StudentRow key={student.id} student={student} onApprove={() => handleRequest(student.id, 'approved')} onDeny={() => handleRequest(student.id, 'denied')} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="p-6 text-center text-muted-foreground">No pending requests.</p>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-green-600" />
                                    Enrolled Students ({approvedStudents.length})
                                </CardTitle>
                                <CardDescription>The list of all students currently in this class.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {approvedStudents.length > 0 ? (
                                    <div>
                                        {approvedStudents.map(student => <ApprovedStudentRow key={student.id} student={student} classId={classId} />)}
                                    </div>
                                ) : (
                                    <p className="p-6 text-center text-muted-foreground">No students have been approved yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
