
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, Timestamp, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Trash2, BarChartHorizontal, Check, X, Percent } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';


interface Class {
    id: string;
    title: string;
    subject: string;
    batchTime: string;
    classCode: string;
}

interface EnrolledStudent {
    id: string; // This is the enrollment doc id
    studentId: string; // This is the auth UID
    studentName: string;
    mobileNumber: string;
    createdAt?: Timestamp;
    paymentStatus: 'paid' | 'unpaid';
    status: 'pending' | 'approved' | 'denied';
}

interface Attendance {
    id: string;
    records: { [studentId: string]: boolean };
}

interface TestResult {
    id: string;
    studentId: string;
    marksObtained: number;
    totalMarks: number;
}

function StudentListForClass({ classId, teacherId }: { classId: string, teacherId: string }) {
    const firestore = useFirestore();

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'enrollments'), 
            where('classId', '==', classId), 
            where('teacherId', '==', teacherId),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, classId, teacherId]);

    const { data: allEnrollments, isLoading } = useCollection<EnrolledStudent>(enrollmentsQuery);
    
    // Fetch all attendance and test results for this class
    const classAttendanceQuery = useMemoFirebase(() => {
        if (!firestore || !teacherId) return null;
        return query(collection(firestore, 'attendance'), where('classId', '==', classId), where('teacherId', '==', teacherId));
    }, [firestore, classId, teacherId]);
    const { data: attendanceRecords } = useCollection<Attendance>(classAttendanceQuery);

    const classResultsQuery = useMemoFirebase(() => {
        if (!firestore || !teacherId) return null;
        return query(collection(firestore, 'testResults'), where('classId', '==', classId), where('teacherId', '==', teacherId));
    }, [firestore, classId, teacherId]);
    const { data: testResults } = useCollection<TestResult>(classResultsQuery);
    
    const pendingStudents = useMemo(() => allEnrollments?.filter(s => s.status === 'pending') || [], [allEnrollments]);
    const approvedStudents = useMemo(() => allEnrollments?.filter(s => s.status === 'approved') || [], [allEnrollments]);

    const handleRemoveStudent = (enrollmentId: string) => {
        if (!firestore) return;
        if(window.confirm("Are you sure you want to remove this student from the class? This will not delete their account.")) {
            deleteDocumentNonBlocking(doc(firestore, 'enrollments', enrollmentId));
        }
    };
    
    const handlePaymentStatusChange = (enrollmentId: string, isPaid: boolean) => {
        if (!firestore) return;
        const enrollmentRef = doc(firestore, 'enrollments', enrollmentId);
        updateDocumentNonBlocking(enrollmentRef, {
            paymentStatus: isPaid ? 'paid' : 'unpaid'
        });
    };

    const handleRequest = (enrollmentId: string, newStatus: 'approved' | 'denied') => {
        if (!firestore) return;
        const enrollmentRef = doc(firestore, 'enrollments', enrollmentId);
        updateDocumentNonBlocking(enrollmentRef, { status: newStatus });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Students</CardTitle>
                <CardDescription>Review pending requests and manage currently enrolled students.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="pending">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pending">Pending Requests ({pendingStudents.length})</TabsTrigger>
                        <TabsTrigger value="enrolled">Enrolled Students ({approvedStudents.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pending" className="mt-4">
                        {isLoading ? <p className="text-center py-4">Loading requests...</p> : 
                        pendingStudents.length === 0 ? <p className="text-center text-muted-foreground py-8">No pending enrollment requests.</p> :
                        (
                            <div className="border rounded-lg overflow-x-auto">
                                <table className="w-full text-sm min-w-[600px]">
                                    <thead className="text-left bg-muted">
                                        <tr className="border-b">
                                            <th className="p-3 font-medium">Student Name</th>
                                            <th className="p-3 font-medium">Requested On</th>
                                            <th className="p-3 font-medium text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingStudents.map(student => (
                                            <tr key={student.id} className="border-b last:border-0">
                                                <td className="p-3 whitespace-nowrap font-medium">{student.studentName}</td>
                                                <td className="p-3 text-muted-foreground">{student.createdAt ? new Date(student.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                                                <td className="p-3 text-center flex justify-center gap-2">
                                                    <Button size="sm" className="bg-success/10 text-success hover:bg-success/20 hover:text-success" onClick={() => handleRequest(student.id, 'approved')}>
                                                        <Check className="h-4 w-4 mr-2" />Approve
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleRequest(student.id, 'denied')}>
                                                        <X className="h-4 w-4 mr-2" />Deny
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="enrolled" className="mt-4">
                         {isLoading ? <p className="text-center py-4">Loading students...</p> : 
                        approvedStudents.length === 0 ? <p className="text-center text-muted-foreground py-8">No students are enrolled in this class yet.</p> :
                        (
                             <div className="border rounded-lg overflow-x-auto">
                                <table className="w-full text-sm min-w-[800px]">
                                    <thead className="text-left bg-muted">
                                        <tr className="border-b">
                                            <th className="p-3 font-medium">Student Name</th>
                                            <th className="p-3 font-medium">Attendance</th>
                                            <th className="p-3 font-medium">Avg. Score</th>
                                            <th className="p-3 font-medium">Payment Status</th>
                                            <th className="p-3 font-medium text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {approvedStudents.map(student => {
                                            const studentAttendance = useMemo(() => {
                                                if (!attendanceRecords) return { percentage: 0 };
                                                let present = 0;
                                                let totalLectures = 0;
                                                attendanceRecords.forEach(record => {
                                                    if (record.records.hasOwnProperty(student.studentId)) {
                                                        totalLectures++;
                                                        if (record.records[student.studentId]) {
                                                            present++;
                                                        }
                                                    }
                                                });
                                                return { percentage: totalLectures > 0 ? Math.round((present / totalLectures) * 100) : 0 };
                                            }, [attendanceRecords, student.studentId]);

                                            const studentTestPerf = useMemo(() => {
                                                if (!testResults) return { avgScore: 0 };
                                                const resultsForStudent = testResults.filter(r => r.studentId === student.studentId);
                                                if (resultsForStudent.length === 0) return { avgScore: 0 };
                                                const totalMarksObtained = resultsForStudent.reduce((acc, r) => acc + r.marksObtained, 0);
                                                const totalMaxMarks = resultsForStudent.reduce((acc, r) => acc + r.totalMarks, 0);
                                                return { avgScore: totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0 };
                                            }, [testResults, student.studentId]);

                                            return (
                                                <tr key={student.id} className="border-b last:border-0">
                                                    <td className="p-3 whitespace-nowrap font-medium">
                                                        <Link href={`/dashboard/teacher/class/${classId}/student/${student.studentId}`} className="hover:underline text-primary">
                                                            {student.studentName}
                                                        </Link>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-full max-w-[100px] bg-muted rounded-full h-2.5">
                                                              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${studentAttendance.percentage}%` }}></div>
                                                            </div>
                                                            <span className="font-bold text-xs w-10 text-right">{studentAttendance.percentage}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-full max-w-[100px] bg-muted rounded-full h-2.5">
                                                              <div className="bg-success h-2.5 rounded-full" style={{ width: `${studentTestPerf.avgScore}%` }}></div>
                                                            </div>
                                                            <span className="font-bold text-xs w-10 text-right">{studentTestPerf.avgScore}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <Switch 
                                                                id={`payment-${student.id}`}
                                                                checked={student.paymentStatus === 'paid'} 
                                                                onCheckedChange={(isChecked) => handlePaymentStatusChange(student.id, isChecked)} 
                                                            />
                                                            <Label htmlFor={`payment-${student.id}`} className="capitalize font-medium">{student.paymentStatus}</Label>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveStudent(student.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

export default function ClassDetailsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const classId = params.classId as string;

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<{name: string}>(userProfileRef);

    const classRef = useMemoFirebase(() => {
        if (!firestore || !classId) return null;
        return doc(firestore, 'classes', classId);
    }, [firestore, classId]);
    const { data: classData, isLoading: isClassLoading } = useDoc<Class>(classRef);
    
    if (isClassLoading || isProfileLoading) {
         return (
             <div className="flex flex-col min-h-screen">
                <DashboardHeader userName={userProfile?.name} userRole="tutor" />
                <div className="flex-1 flex items-center justify-center">
                    <p>Loading class details...</p>
                </div>
            </div>
        );
    }

    if (!classData) {
        return (
             <div className="flex flex-col min-h-screen">
                <DashboardHeader userName={userProfile?.name} userRole="tutor" />
                <div className="flex-1 flex items-center justify-center">
                    <Card>
                        <CardHeader>
                            <CardTitle>Error</CardTitle>
                            <CardDescription>Class not found.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Button asChild>
                                <Link href="/dashboard/teacher">Go Back to Dashboard</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="tutor" />
             <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <Link href="/dashboard/teacher" className="text-sm text-primary hover:underline mb-2 inline-block">
                                &larr; Back to Dashboard
                            </Link>
                            <h1 className="text-3xl font-bold">{classData.title}</h1>
                            <p className="text-muted-foreground">{classData.subject} ({classData.batchTime})</p>
                            <div className="mt-2 text-sm">
                                <p className="text-muted-foreground">Share this code with your students to let them enroll:</p>
                                <p className="font-mono text-lg font-bold text-foreground bg-muted p-2 rounded-md inline-block mt-1">{classData.classCode}</p>
                            </div>
                        </div>
                         <div>
                            <Button asChild>
                                <Link href={`/dashboard/teacher/class/${classId}/performance`}>
                                    <BarChartHorizontal className="mr-2 h-4 w-4" />
                                    View Performance
                                </Link>
                            </Button>
                        </div>
                    </div>
                    
                    {user && <StudentListForClass classId={classId} teacherId={user.uid} />}

                </div>
             </main>
        </div>
    );
}
