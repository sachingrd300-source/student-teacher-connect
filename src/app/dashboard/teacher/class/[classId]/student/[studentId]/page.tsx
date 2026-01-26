
'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, Timestamp } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { UserCircle, Mail, Phone, CalendarCheck, CheckCircle as CheckIcon, XCircle, Wand2, BarChartHorizontal, FileText, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { analyzeStudentPerformance } from '@/ai/flows/student-performance-analyzer';

// --- Data Interfaces ---
interface UserProfile {
    name: string;
    email: string;
    mobileNumber?: string;
}

interface TestResult {
    id: string;
    testTitle: string;
    marksObtained: number;
    totalMarks: number;
    submittedAt: Timestamp;
}

interface Attendance {
    id: string; // composite key: {classId}_{date}
    date: string;
    records: {
        [studentId: string]: boolean;
    }
}

export default function StudentDetailPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const params = useParams();
    const classId = params.classId as string;
    const studentId = params.studentId as string;

    const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
    const [aiInsight, setAiInsight] = useState<string | null>(null);

    // --- Data Fetching ---
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: teacherProfile } = useDoc(userProfileRef);

    const classRef = useMemoFirebase(() => {
        if (!firestore || !classId) return null;
        return doc(firestore, 'classes', classId);
    }, [firestore, classId]);
    const { data: classData } = useDoc(classRef);

    const studentProfileRef = useMemoFirebase(() => {
        if (!firestore || !studentId) return null;
        return doc(firestore, 'users', studentId);
    }, [firestore, studentId]);
    const { data: studentProfile, isLoading: studentLoading } = useDoc<UserProfile>(studentProfileRef);
    
    const studentTestResultsQuery = useMemoFirebase(() => {
        if (!firestore || !studentId || !classId) return null;
        return query(collection(firestore, 'testResults'), where('studentId', '==', studentId), where('classId', '==', classId));
    }, [firestore, studentId, classId]);
    const { data: studentTestResults, isLoading: resultsLoading } = useCollection<TestResult>(studentTestResultsQuery);
    
    const attendanceQuery = useMemoFirebase(() => {
        if (!firestore || !classId) return null;
        return query(collection(firestore, 'attendance'), where('classId', '==', classId));
    }, [firestore, classId]);
    const { data: allAttendanceRecords, isLoading: attendanceLoading } = useCollection<Attendance>(attendanceQuery);

    // --- Data Computation ---
    const studentAttendance = useMemo(() => {
        if (!allAttendanceRecords) return { present: 0, absent: 0, total: 0, details: [] };
        let present = 0;
        let absent = 0;
        const details: { date: string, status: 'Present' | 'Absent' }[] = [];

        allAttendanceRecords.forEach(record => {
            if (record.records.hasOwnProperty(studentId)) {
                if (record.records[studentId]) {
                    present++;
                    details.push({ date: record.date, status: 'Present' });
                } else {
                    absent++;
                    details.push({ date: record.date, status: 'Absent' });
                }
            }
        });
        details.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const total = present + absent;
        return { present, absent, total, percentage: total > 0 ? Math.round((present/total)*100) : 0, details };

    }, [allAttendanceRecords, studentId]);
    
    const sortedTestResults = useMemo(() => {
        if (!studentTestResults) return [];
        return [...studentTestResults].sort((a,b) => b.submittedAt.seconds - a.submittedAt.seconds);
    }, [studentTestResults]);

    const isLoading = studentLoading || resultsLoading || attendanceLoading;

    // --- AI Insight ---
    const handleGetInsight = async () => {
        if (!studentProfile || !classData) return;
        setIsGeneratingInsight(true);
        setAiInsight(null);
        try {
            const result = await analyzeStudentPerformance({
                studentName: studentProfile.name,
                className: classData.title,
                attendance: {
                    present: studentAttendance.present,
                    total: studentAttendance.total
                },
                testResults: sortedTestResults.map(r => ({
                    testTitle: r.testTitle,
                    marksObtained: r.marksObtained,
                    totalMarks: r.totalMarks
                }))
            });
            setAiInsight(result.analysis);
        } catch (error) {
            console.error("Failed to get AI insight:", error);
            alert("An error occurred while generating the AI insight. Please try again.");
        } finally {
            setIsGeneratingInsight(false);
        }
    };
    
    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={teacherProfile?.name} userRole="tutor" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                     <div className="mb-6">
                        <Link href={`/dashboard/teacher/class/${classId}`} className="text-sm text-primary hover:underline mb-2 inline-block">
                            &larr; Back to Class Management
                        </Link>
                        <div className="flex items-center gap-4">
                            <UserCircle className="h-10 w-10 text-primary" />
                            <div>
                                <h1 className="text-3xl font-bold">{studentProfile?.name || 'Loading...'}</h1>
                                <p className="text-muted-foreground">Student in {classData?.title}</p>
                            </div>
                        </div>
                    </div>
                    {isLoading ? <p>Loading student data...</p> : 
                    !studentProfile ? <p>Student not found.</p> :
                    (
                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Left Column */}
                            <div className="lg:col-span-1 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Student Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 text-sm">
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span>{studentProfile.email}</span>
                                        </div>
                                         <div className="flex items-center gap-3">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span>{studentProfile.mobileNumber || 'Not provided'}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader>
                                        <CardTitle>AI Performance Insight</CardTitle>
                                        <CardDescription>Get an AI-generated summary of this student's performance.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="w-full" onClick={handleGetInsight} disabled={isGeneratingInsight}>
                                            <Wand2 className="mr-2 h-4 w-4"/>
                                            {isGeneratingInsight ? 'Analyzing...' : 'Generate Insight'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column */}
                            <div className="lg:col-span-2 space-y-6">
                               <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-3">
                                            <CalendarCheck className="h-5 w-5"/>
                                            Attendance
                                        </CardTitle>
                                         <CardDescription>
                                            Overall attendance for this class is <span className="font-bold text-primary">{studentAttendance.percentage}%</span>
                                            ({studentAttendance.present} out of {studentAttendance.total} lectures).
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {studentAttendance.details.length > 0 ? (
                                            <div className="border rounded-lg max-h-48 overflow-y-auto">
                                                {studentAttendance.details.map((record, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 border-b last:border-0">
                                                        <span className="font-medium text-sm">{new Date(record.date).toLocaleDateString()}</span>
                                                        <div className={`flex items-center gap-2 text-sm font-semibold ${record.status === 'Present' ? 'text-success' : 'text-destructive'}`}>
                                                            {record.status === 'Present' ? <CheckIcon className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                            {record.status}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center text-muted-foreground py-4">No attendance recorded yet.</p>
                                        )}
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-3">
                                            <ClipboardCheck className="h-5 w-5"/>
                                            Test Results
                                        </CardTitle>
                                         <CardDescription>Scores from all tests submitted in this class.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {sortedTestResults.length > 0 ? (
                                            <div className="border rounded-lg">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted">
                                                        <tr className="border-b">
                                                            <th className="p-3 text-left font-medium">Test Title</th>
                                                            <th className="p-3 text-center font-medium">Score</th>
                                                            <th className="p-3 text-center font-medium">Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sortedTestResults.map(result => (
                                                            <tr key={result.id} className="border-b last:border-0">
                                                                <td className="p-3 font-semibold">{result.testTitle}</td>
                                                                <td className="p-3 text-center font-bold">{result.marksObtained} / {result.totalMarks}</td>
                                                                <td className="p-3 text-center text-muted-foreground text-xs">{new Date(result.submittedAt.seconds*1000).toLocaleDateString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-center text-muted-foreground py-4">No tests submitted for this class yet.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </main>

             <Dialog open={!!aiInsight} onOpenChange={(isOpen) => !isOpen && setAiInsight(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>AI Performance Insight for {studentProfile?.name}</DialogTitle>
                        <DialogDescription>
                            This analysis is generated by AI based on the student's attendance and test results for this class.
                        </DialogDescription>
                    </DialogHeader>
                    <div 
                        className="prose prose-sm dark:prose-invert max-w-none py-4 max-h-[60vh] overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: aiInsight?.replace(/\n/g, '<br />') || '' }}
                    />
                    <DialogFooter>
                        <Button type="button" onClick={() => setAiInsight(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
