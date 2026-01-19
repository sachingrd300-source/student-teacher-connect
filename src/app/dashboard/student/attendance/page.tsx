'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { ClipboardCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Enrollment = { id: string; classId: string; status: 'approved' | 'pending' | 'denied'; };
type ClassInfo = { title: string; };
type AttendanceRecordMap = { [studentId: string]: boolean; };
type AttendanceDoc = { id: string; records: AttendanceRecordMap; date: string; };

type AggregatedAttendance = {
    classId: string;
    classTitle: string;
    present: number;
    total: number;
    percentage: number;
    history: { date: string; isPresent: boolean }[];
};

export default function StudentAttendancePage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const [attendanceData, setAttendanceData] = useState<AggregatedAttendance[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const enrollmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid), where('status', '==', 'approved'));
    }, [firestore, user]);

    const { data: enrollments, isLoading: isLoadingEnrollments } = useCollection<Enrollment>(enrollmentsQuery);

    useEffect(() => {
        if (isLoadingEnrollments) {
            setIsLoading(true);
            return;
        }
        if (!enrollments || !firestore || !user) {
            setIsLoading(false);
            return;
        }

        const fetchAttendanceData = async () => {
            setIsLoading(true);
            if (enrollments.length === 0) {
                setAttendanceData([]);
                setIsLoading(false);
                return;
            }

            try {
                const aggregatedData: AggregatedAttendance[] = [];

                for (const enrollment of enrollments) {
                    const classId = enrollment.classId;

                    // 1. Get Class Title
                    const classDocRef = doc(firestore, 'classes', classId);
                    const classDocSnap = await getDoc(classDocRef);
                    const classTitle = classDocSnap.exists() ? (classDocSnap.data() as ClassInfo).title : 'Unknown Class';

                    // 2. Get Attendance Records for this class
                    const attendanceQuery = query(collection(firestore, 'attendance'), where('classId', '==', classId));
                    const attendanceSnap = await getDocs(attendanceQuery);
                    
                    const records = attendanceSnap.docs.map(d => d.data() as AttendanceDoc);
                    
                    let presentCount = 0;
                    const history: { date: string; isPresent: boolean }[] = [];

                    records.forEach(record => {
                        if (record.records.hasOwnProperty(user.uid)) {
                            const isPresent = record.records[user.uid];
                            if (isPresent) {
                                presentCount++;
                            }
                            history.push({ date: record.date, isPresent });
                        }
    
                    });
                    
                    const total = history.length;
                    const percentage = total > 0 ? (presentCount / total) * 100 : 0;
                    
                    history.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    aggregatedData.push({
                        classId,
                        classTitle,
                        present: presentCount,
                        total,
                        percentage,
                        history,
                    });
                }
                
                setAttendanceData(aggregatedData);

            } catch (e) {
                console.error("Error fetching attendance data:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAttendanceData();

    }, [enrollments, isLoadingEnrollments, firestore, user]);
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    <ClipboardCheck className="h-8 w-8"/>
                    My Attendance
                </h1>
                <p className="text-muted-foreground">Your attendance summary across all your classes.</p>
            </div>
            
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            )}

            {!isLoading && attendanceData.length === 0 && (
                <Card className="text-center py-16">
                     <CardHeader>
                        <CardTitle>No Attendance Data</CardTitle>
                        <CardDescription>No attendance has been recorded for your classes yet.</CardDescription>
                     </CardHeader>
                </Card>
            )}
            
            {!isLoading && attendanceData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {attendanceData.map(data => (
                        <Dialog key={data.classId}>
                            <Card className="flex flex-col shadow-soft-shadow">
                                <CardHeader>
                                    <CardTitle>{data.classTitle}</CardTitle>
                                    <CardDescription>Overall attendance summary</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <div className="flex justify-between items-baseline">
                                        <p className="text-sm font-medium">Total Attendance</p>
                                        <p className="text-2xl font-bold">{data.percentage.toFixed(0)}%</p>
                                    </div>
                                    <Progress value={data.percentage} />
                                    <p className="text-sm text-muted-foreground text-center">
                                        Present for <span className="font-bold text-foreground">{data.present}</span> out of <span className="font-bold text-foreground">{data.total}</span> classes.
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full" disabled={data.total === 0}>
                                            View Detailed History
                                        </Button>
                                    </DialogTrigger>
                                </CardFooter>
                            </Card>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Attendance History: {data.classTitle}</DialogTitle>
                                </DialogHeader>
                                <div className="max-h-[60vh] overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.history.length > 0 ? data.history.map(rec => (
                                                <TableRow key={rec.date}>
                                                    <TableCell>{format(new Date(rec.date), "PPP")}</TableCell>
                                                    <TableCell className="text-right">
                                                        {rec.isPresent ? (
                                                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">Present</Badge>
                                                        ) : (
                                                            <Badge variant="destructive">Absent</Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow><TableCell colSpan={2} className="text-center">No records found.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </DialogContent>
                        </Dialog>
                    ))}
                </div>
            )}
        </div>
    );
}
