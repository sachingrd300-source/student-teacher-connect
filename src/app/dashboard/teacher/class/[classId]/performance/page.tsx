
'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChartHorizontal, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { analyzeStudentPerformance } from '@/ai/flows/student-performance-analyzer';


// --- Data Interfaces ---
interface EnrolledStudent {
    id: string; // enrollment doc id
    studentId: string;
    studentName: string;
}

interface Attendance {
    id: string; // attendance doc id
    classId: string;
    records: { [studentId: string]: boolean };
}

interface Test {
    id: string; // test doc id
}

interface TestResult {
    id: string; // result doc id
    studentId: string;
    testId: string;
    testTitle: string;
    marksObtained: number;
    totalMarks: number;
}

interface StudentPerformance {
    studentId: string;
    studentName: string;
    attendance: { present: number; total: number; percentage: number };
    tests: { 
        completed: number; 
        totalAssigned: number; 
        averageScore: number;
        results: TestResult[];
    };
}

export default function PerformanceDashboardPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const params = useParams();
    const classId = params.classId as string;

    const [isGeneratingInsight, setIsGeneratingInsight] = useState<string | null>(null);
    const [aiInsight, setAiInsight] = useState<{ studentName: string, insight: string } | null>(null);


    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile } = useDoc(userProfileRef);

    const classRef = useMemoFirebase(() => {
        if (!firestore || !classId) return null;
        return doc(firestore, 'classes', classId);
    }, [firestore, classId]);
    const { data: classData } = useDoc(classRef);

    // 1. Fetch all enrollments for this class
    const enrolledStudentsQuery = useMemoFirebase(() => {
        if (!firestore || !classId) return null;
        return query(collection(firestore, 'enrollments'), where('classId', '==', classId));
    }, [firestore, classId]);
    const { data: enrolledStudents, isLoading: studentsLoading } = useCollection<EnrolledStudent>(enrolledStudentsQuery);

    // 2. Fetch all attendance records for this class
    const attendanceQuery = useMemoFirebase(() => {
        if (!firestore || !classId) return null;
        return query(collection(firestore, 'attendance'), where('classId', '==', classId));
    }, [firestore, classId]);
    const { data: attendanceRecords, isLoading: attendanceLoading } = useCollection<Attendance>(attendanceQuery);
    
    // 3. Fetch all tests assigned to this class
    const testsQuery = useMemoFirebase(() => {
        if (!firestore || !classId) return null;
        return query(collection(firestore, 'tests'), where('classId', '==', classId));
    }, [firestore, classId]);
    const { data: assignedTests, isLoading: testsLoading } = useCollection<Test>(testsQuery);

    // 4. Fetch all results related to this class
    const resultsQuery = useMemoFirebase(() => {
        if (!firestore || !classId) return null;
        return query(collection(firestore, 'testResults'), where('classId', '==', classId));
    }, [firestore, classId]);
    const { data: testResults, isLoading: resultsLoading } = useCollection<TestResult>(resultsQuery);


    // 5. Compute performance data
    const performanceData: StudentPerformance[] = useMemo(() => {
        if (!enrolledStudents || !attendanceRecords || !assignedTests || !testResults) {
            return [];
        }

        return enrolledStudents.map(student => {
            // Calculate attendance
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
            const attendancePercentage = totalLectures > 0 ? Math.round((present / totalLectures) * 100) : 0;
            
            // Calculate test scores
            const studentResults = testResults.filter(r => r.studentId === student.studentId);
            const totalMarksObtained = studentResults.reduce((acc, r) => acc + r.marksObtained, 0);
            const totalMaxMarks = studentResults.reduce((acc, r) => acc + r.totalMarks, 0);
            const averageScore = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0;
            
            return {
                studentId: student.studentId,
                studentName: student.studentName,
                attendance: {
                    present,
                    total: totalLectures,
                    percentage: attendancePercentage,
                },
                tests: {
                    completed: studentResults.length,
                    totalAssigned: assignedTests.length,
                    averageScore: averageScore,
                    results: studentResults,
                },
            };
        });

    }, [enrolledStudents, attendanceRecords, assignedTests, testResults]);
    
    const isLoading = studentsLoading || attendanceLoading || testsLoading || resultsLoading;

    const handleGetInsight = async (studentData: StudentPerformance) => {
        setIsGeneratingInsight(studentData.studentId);
        setAiInsight(null);
        try {
            const result = await analyzeStudentPerformance({
                studentName: studentData.studentName,
                className: classData?.title || 'this class',
                attendance: {
                    present: studentData.attendance.present,
                    total: studentData.attendance.total
                },
                testResults: studentData.tests.results.map(r => ({
                    testTitle: r.testTitle,
                    marksObtained: r.marksObtained,
                    totalMarks: r.totalMarks
                }))
            });
            setAiInsight({ studentName: studentData.studentName, insight: result.analysis });
        } catch (error) {
            console.error("Failed to get AI insight:", error);
            alert("An error occurred while generating the AI insight. Please try again.");
        } finally {
            setIsGeneratingInsight(null);
        }
    };


    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="tutor" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                     <div className="mb-6">
                        <Link href={`/dashboard/teacher/class/${classId}`} className="text-sm text-primary hover:underline mb-2 inline-block">
                            &larr; Back to Class Management
                        </Link>
                         <div className="flex items-center gap-4">
                            <BarChartHorizontal className="h-8 w-8 text-primary" />
                            <div>
                                <h1 className="text-3xl font-bold">Student Performance</h1>
                                <p className="text-muted-foreground">{classData?.title}</p>
                            </div>
                        </div>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Overview</CardTitle>
                            <CardDescription>A summary of attendance and test scores for all students in this class.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <p>Analyzing performance data...</p> : (
                                <div className="border rounded-lg overflow-x-auto">
                                    <table className="w-full text-sm min-w-[800px]">
                                        <thead className="text-left bg-muted">
                                            <tr className="border-b">
                                                <th className="p-3 font-medium">Student Name</th>
                                                <th className="p-3 font-medium">Attendance</th>
                                                <th className="p-3 font-medium">Average Test Score</th>
                                                <th className="p-3 font-medium text-center">Tests Completed</th>
                                                <th className="p-3 font-medium text-center">AI Insight</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {performanceData.length > 0 ? performanceData.map(data => (
                                                <tr key={data.studentId} className="border-b last:border-0">
                                                    <td className="p-3 font-semibold">{data.studentName}</td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-full max-w-[150px] bg-muted rounded-full h-2.5">
                                                              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${data.attendance.percentage}%` }}></div>
                                                            </div>
                                                            <span className="font-bold w-12 text-right">{data.attendance.percentage}%</span>
                                                        </div>
                                                    </td>
                                                     <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-full max-w-[150px] bg-muted rounded-full h-2.5">
                                                              <div className="bg-success h-2.5 rounded-full" style={{ width: `${data.tests.averageScore}%` }}></div>
                                                            </div>
                                                            <span className="font-bold w-12 text-right">{data.tests.averageScore}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center font-medium">
                                                        {data.tests.completed} / {data.tests.totalAssigned}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleGetInsight(data)}
                                                            disabled={isGeneratingInsight === data.studentId}
                                                        >
                                                            <Wand2 className="h-4 w-4 mr-2" />
                                                            {isGeneratingInsight === data.studentId ? 'Analyzing...' : 'Get Insight'}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                                        No performance data available yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Dialog open={!!aiInsight} onOpenChange={(isOpen) => !isOpen && setAiInsight(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>AI Performance Insight for {aiInsight?.studentName}</DialogTitle>
                        <DialogDescription>
                            This analysis is generated by AI based on the student's attendance and test results.
                        </DialogDescription>
                    </DialogHeader>
                    <div 
                        className="prose prose-sm dark:prose-invert max-w-none py-4 max-h-[60vh] overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: aiInsight?.insight.replace(/\n/g, '<br />') || '' }}
                    />
                    <DialogFooter>
                        <Button type="button" onClick={() => setAiInsight(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}

