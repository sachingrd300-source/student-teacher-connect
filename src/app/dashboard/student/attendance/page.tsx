
'use client';

import { useMemo } from 'react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, Timestamp } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { CalendarCheck, CheckCircle, XCircle } from 'lucide-react';

interface Enrollment {
    id: string;
    classId: string;
    classTitle: string;
    teacherName: string;
}

interface Attendance {
    id: string; // composite key: {classId}_{date}
    date: string;
    records: {
        [studentId: string]: boolean;
    }
}

function ClassAttendanceCard({ enrollment }: { enrollment: Enrollment }) {
    const firestore = useFirestore();
    const { user } = useUser();

    const attendanceQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'attendance'), where('classId', '==', enrollment.classId));
    }, [firestore, enrollment.classId]);

    const { data: attendanceRecords, isLoading } = useCollection<Attendance>(attendanceQuery);

    const studentAttendance = useMemo(() => {
        if (!attendanceRecords || !user) return { present: 0, absent: 0, total: 0, details: [] };
        
        let present = 0;
        let absent = 0;
        const details: {date: string, status: 'Present' | 'Absent'}[] = [];

        attendanceRecords.forEach(record => {
            if (record.records.hasOwnProperty(user.uid)) {
                if (record.records[user.uid]) {
                    present++;
                    details.push({ date: record.date, status: 'Present' });
                } else {
                    absent++;
                    details.push({ date: record.date, status: 'Absent' });
                }
            }
        });

        details.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return { present, absent, total: present + absent, details };

    }, [attendanceRecords, user]);
    
    const attendancePercentage = studentAttendance.total > 0 ? Math.round((studentAttendance.present / studentAttendance.total) * 100) : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{enrollment.classTitle}</CardTitle>
                <CardDescription>Taught by {enrollment.teacherName}</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && <p>Loading attendance...</p>}
                {!isLoading && studentAttendance.total === 0 && <p className="text-muted-foreground">No attendance has been recorded for this class yet.</p>}
                {!isLoading && studentAttendance.total > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{attendancePercentage}%</p>
                                <p className="text-sm text-muted-foreground">Overall</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{studentAttendance.present}</p>
                                <p className="text-sm text-muted-foreground">Present</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">{studentAttendance.absent}</p>
                                <p className="text-sm text-muted-foreground">Absent</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Detailed History</h4>
                            <div className="border rounded-lg max-h-48 overflow-y-auto">
                                {studentAttendance.details.map((record, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border-b last:border-0">
                                        <span className="font-medium text-sm">{new Date(record.date).toLocaleDateString()}</span>
                                        <div className={`flex items-center gap-2 text-sm font-semibold ${record.status === 'Present' ? 'text-green-600' : 'text-red-600'}`}>
                                            {record.status === 'Present' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                            {record.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}


export default function StudentAttendancePage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);
    const { data: userProfile } = useDoc(userProfileRef);

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
    }, [firestore, user]);

    const { data: enrollments, isLoading } = useCollection<Enrollment>(enrollmentsQuery);

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <DashboardHeader userName={userProfile?.name} userRole="student" />
            <main className="flex-1">
                <div className="container mx-auto p-4 md:p-8">
                     <div className="flex items-center gap-4 mb-6">
                        <CalendarCheck className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">My Attendance</h1>
                    </div>
                     {isLoading && <p>Loading your enrolled classes...</p>}
                     {enrollments && enrollments.length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                           {enrollments.map(enrollment => (
                                <ClassAttendanceCard key={enrollment.id} enrollment={enrollment} />
                           ))}
                        </div>
                     ) : (
                        !isLoading && (
                            <Card>
                                <CardContent className="p-8 text-center text-muted-foreground">
                                    You are not enrolled in any classes.
                                </CardContent>
                            </Card>
                        )
                     )}
                </div>
            </main>
        </div>
    );
}
