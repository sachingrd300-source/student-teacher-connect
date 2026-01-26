
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Percent } from 'lucide-react';

// --- Data Interfaces ---
interface Class {
    id: string;
    title: string;
    subject: string;
}

interface EnrolledStudent {
    id: string; // enrollment doc id
    studentId: string;
    studentName: string;
}

interface Attendance {
    id: string;
    classId: string;
    records: {
        [studentId: string]: boolean;
    }
}

interface StudentStat {
    studentId: string;
    studentName: string;
    present: number;
    absent: number;
    total: number;
    percentage: number;
}

interface ReportData {
    overallPercentage: number;
    studentStats: StudentStat[];
}

export default function TeacherAttendanceReportsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile } = useDoc(userProfileRef);

    const [selectedClassId, setSelectedClassId] = useState('');

    const classesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid));
    }, [firestore, user]);
    const { data: classes } = useCollection<Class>(classesQuery);

    const enrolledStudentsQuery = useMemoFirebase(() => {
        if (!firestore || !selectedClassId || !user) return null;
        return query(collection(firestore, 'enrollments'), where('classId', '==', selectedClassId), where('teacherId', '==', user.uid));
    }, [firestore, selectedClassId, user]);
    const { data: enrolledStudents, isLoading: studentsLoading } = useCollection<EnrolledStudent>(enrolledStudentsQuery);

    const attendanceQuery = useMemoFirebase(() => {
        if (!firestore || !selectedClassId) return null;
        return query(collection(firestore, 'attendance'), where('classId', '==', selectedClassId));
    }, [firestore, selectedClassId]);
    const { data: attendanceRecords, isLoading: attendanceLoading } = useCollection<Attendance>(attendanceQuery);
    
    const reportData: ReportData | null = useMemo(() => {
        if (!enrolledStudents || !attendanceRecords) return null;

        const studentStats: StudentStat[] = enrolledStudents.map(student => {
            let present = 0;
            let absent = 0;

            attendanceRecords.forEach(record => {
                if (record.records.hasOwnProperty(student.studentId)) {
                    if (record.records[student.studentId]) {
                        present++;
                    } else {
                        absent++;
                    }
                }
            });
            
            const total = present + absent;
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
            
            return {
                studentId: student.studentId,
                studentName: student.studentName,
                present,
                absent,
                total,
                percentage,
            };
        });
        
        const totalOverallPercentage = studentStats.reduce((acc, stat) => acc + stat.percentage, 0);
        const overallPercentage = studentStats.length > 0 ? Math.round(totalOverallPercentage / studentStats.length) : 0;

        return { studentStats, overallPercentage };

    }, [enrolledStudents, attendanceRecords]);


    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="tutor" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">Attendance Reports</h1>
                    </div>
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>Select a Class</CardTitle>
                            <CardDescription>Choose a class to view its detailed attendance report.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Select onValueChange={setSelectedClassId} value={selectedClassId}>
                                <SelectTrigger id="class-select" className="max-w-md">
                                    <SelectValue placeholder="Select a class..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.title} - {c.subject}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {selectedClassId && (studentsLoading || attendanceLoading) && <p>Generating report...</p>}
                    
                    {selectedClassId && !studentsLoading && !attendanceLoading && reportData && (
                        <Card>
                             <CardHeader>
                                <CardTitle>Report Summary</CardTitle>
                                <div className="flex items-baseline gap-2 pt-2">
                                    <span className="text-4xl font-bold text-primary">{reportData.overallPercentage}%</span>
                                    <span className="text-muted-foreground">Overall Class Attendance</span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="text-left bg-muted">
                                            <tr className="border-b">
                                                <th className="p-3 font-medium">Student Name</th>
                                                <th className="p-3 font-medium text-center hidden sm:table-cell">Present</th>
                                                <th className="p-3 font-medium text-center hidden sm:table-cell">Absent</th>
                                                <th className="p-3 font-medium text-center">Attendance %</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.studentStats.map(stat => (
                                                <tr key={stat.studentId} className="border-b last:border-0">
                                                    <td className="p-3 font-semibold">{stat.studentName}</td>
                                                    <td className="p-3 text-center hidden sm:table-cell text-success font-medium">{stat.present}</td>
                                                    <td className="p-3 text-center hidden sm:table-cell text-destructive font-medium">{stat.absent}</td>
                                                    <td className="p-3">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="w-full max-w-[100px] bg-muted rounded-full h-2.5">
                                                              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${stat.percentage}%` }}></div>
                                                            </div>
                                                            <span className="font-bold w-10 text-right">{stat.percentage}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {reportData.studentStats.length === 0 && <p className="text-center text-muted-foreground p-8">No students enrolled in this class to generate a report.</p>}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
