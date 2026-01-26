
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, Timestamp, getDocs } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { BarChartHorizontal, CheckCircle, Percent, ClipboardCheck, CalendarCheck, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Enrollment {
    id: string;
    classId: string;
}

interface TestResult {
    id: string;
    testTitle: string;
    testSubject: string;
    marksObtained: number;
    totalMarks: number;
    submittedAt: Timestamp;
}

interface Attendance {
    id:string;
    date: string;
    classId: string;
    records: {
        [studentId: string]: boolean;
    }
}

const StatCard = ({ title, value, icon, description }: { title: string, value: string, icon: React.ReactNode, description: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);


export default function StudentPerformancePage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile } = useDoc(userProfileRef);

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid), where('status', '==', 'approved'));
    }, [firestore, user]);
    const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

    const enrolledClassIds = useMemo(() => enrollments?.map(e => e.classId) || [], [enrollments]);

    const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
    const [attendanceLoading, setAttendanceLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !enrolledClassIds || enrolledClassIds.length === 0) {
            setAttendanceRecords([]);
            setAttendanceLoading(false);
            return;
        }

        const fetchAttendance = async () => {
            setAttendanceLoading(true);
            const allRecords: Attendance[] = [];
            try {
                for (const classId of enrolledClassIds) {
                    const q = query(collection(firestore, 'attendance'), where('classId', '==', classId));
                    const querySnapshot = await getDocs(q);
                    querySnapshot.forEach((doc) => {
                        allRecords.push({ id: doc.id, ...doc.data() } as Attendance);
                    });
                }
                setAttendanceRecords(allRecords);
            } catch (err) {
                console.error("Error fetching attendance records:", err);
            } finally {
                setAttendanceLoading(false);
            }
        };

        fetchAttendance();
    }, [firestore, enrolledClassIds]);

    const resultsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'testResults'), where('studentId', '==', user.uid));
    }, [firestore, user]);
    const { data: testResults, isLoading: resultsLoading } = useCollection<TestResult>(resultsQuery);

    const isLoading = enrollmentsLoading || attendanceLoading || resultsLoading;

    const performanceStats = useMemo(() => {
        if (!user || !attendanceRecords || !testResults) {
            return {
                attendancePercentage: 0,
                averageTestScore: 0,
                recentResults: [],
                recentAttendance: []
            };
        }

        // Attendance Calculation
        let present = 0;
        let totalLectures = 0;
        const attendanceDetails: {date: string, status: 'Present' | 'Absent'}[] = [];
        attendanceRecords.forEach(record => {
            if (record.records.hasOwnProperty(user.uid)) {
                totalLectures++;
                if (record.records[user.uid]) {
                    present++;
                    attendanceDetails.push({date: record.date, status: 'Present'});
                } else {
                     attendanceDetails.push({date: record.date, status: 'Absent'});
                }
            }
        });
        const attendancePercentage = totalLectures > 0 ? Math.round((present / totalLectures) * 100) : 0;
        const recentAttendance = attendanceDetails.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);


        // Test Score Calculation
        let totalMarksObtained = 0;
        let totalMaxMarks = 0;
        testResults.forEach(result => {
            totalMarksObtained += result.marksObtained;
            totalMaxMarks += result.totalMarks;
        });
        const averageTestScore = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0;
        const recentResults = [...testResults].sort((a,b) => b.submittedAt.seconds - a.submittedAt.seconds).slice(0, 5);

        return {
            attendancePercentage,
            averageTestScore,
            recentResults,
            recentAttendance
        };
    }, [user, attendanceRecords, testResults]);
    
    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="student" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                     <div className="flex items-center gap-4 mb-6">
                        <BarChartHorizontal className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">My Performance</h1>
                    </div>
                    {isLoading ? <p>Analyzing your performance...</p> : (
                        <div className="space-y-8">
                            <div className="grid gap-4 md:grid-cols-2">
                                <StatCard
                                    title="Overall Attendance"
                                    value={`${performanceStats.attendancePercentage}%`}
                                    description="Percentage of classes you have attended."
                                    icon={<CalendarCheck className="h-4 w-4 text-muted-foreground" />}
                                />
                                <StatCard
                                    title="Average Test Score"
                                    value={`${performanceStats.averageTestScore}%`}
                                    description="Your average score across all submitted tests."
                                    icon={<Percent className="h-4 w-4 text-muted-foreground" />}
                                />
                            </div>

                             <Card>
                                <CardHeader>
                                    <CardTitle>Recent Test Results</CardTitle>
                                    <CardDescription>A summary of your last 5 test submissions.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {performanceStats.recentResults.length > 0 ? (
                                        <div className="border rounded-lg">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted">
                                                    <tr className="border-b">
                                                        <th className="p-3 text-left font-medium">Test Title</th>
                                                        <th className="p-3 text-center font-medium">Score</th>
                                                        <th className="p-3 text-center font-medium hidden sm:table-cell">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {performanceStats.recentResults.map(result => (
                                                        <tr key={result.id} className="border-b last:border-0">
                                                            <td className="p-3 font-semibold">{result.testTitle}</td>
                                                            <td className="p-3 text-center font-bold">{result.marksObtained} / {result.totalMarks}</td>
                                                            <td className="p-3 text-center hidden sm:table-cell">{new Date(result.submittedAt.seconds * 1000).toLocaleDateString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-4">No test results found.</p>
                                    )}
                                </CardContent>
                                <CardFooter className="justify-end">
                                    <Link href="/dashboard/student/results"><Button variant="outline">View All Results</Button></Link>
                                </CardFooter>
                            </Card>

                             <Card>
                                <CardHeader>
                                    <CardTitle>Recent Attendance</CardTitle>
                                    <CardDescription>Your attendance record for the last 5 lectures.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {performanceStats.recentAttendance.length > 0 ? (
                                        <div className="space-y-3">
                                            {performanceStats.recentAttendance.map((record, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                                                    <span className="font-medium">{new Date(record.date).toLocaleDateString()}</span>
                                                    <div className={`flex items-center gap-2 text-sm font-semibold ${record.status === 'Present' ? 'text-success' : 'text-destructive'}`}>
                                                        {record.status === 'Present' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                        {record.status}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-4">No attendance has been recorded yet.</p>
                                    )}
                                </CardContent>
                                <CardFooter className="justify-end">
                                    <Link href="/dashboard/student/attendance"><Button variant="outline">View All Attendance</Button></Link>
                                </CardFooter>
                            </Card>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
