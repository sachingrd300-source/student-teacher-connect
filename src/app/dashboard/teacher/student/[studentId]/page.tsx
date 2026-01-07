
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Mail, Phone } from 'lucide-react';
import { PerformanceChart } from '@/components/performance-chart';

type StudentProfile = {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  avatarUrl: string;
  batch: string;
};

type AttendanceRecord = { id: string; date: any; presentStudentIds: string[], absentStudentIds: string[] };
type TestResult = { id: string; date: any; marks: number; maxMarks: number; subject: string, testName: string };

export default function StudentProfilePage({ params }: { params: { studentId: string } }) {
  const { studentId } = params;
  const firestore = useFirestore();

  const studentDocRef = useMemoFirebase(() => 
    studentId ? doc(firestore, 'users', studentId) : null
  , [firestore, studentId]);
  const { data: student, isLoading: isLoadingStudent } = useDoc<StudentProfile>(studentDocRef);

  // Get all attendance records where this student is present or absent
  const attendanceQuery = useMemoFirebase(() => {
    if (!studentId) return null;
    return query(collection(firestore, 'attendances'));
  }, [firestore, studentId]);
  const { data: rawAttendance, isLoading: isLoadingAttendance } = useCollection<AttendanceRecord>(attendanceQuery);
  const attendanceHistory = useMemo(() => {
    return (rawAttendance || [])
        .map(rec => {
            if (rec.presentStudentIds?.includes(studentId)) return { ...rec, status: 'Present' };
            if (rec.absentStudentIds?.includes(studentId)) return { ...rec, status: 'Absent' };
            return null;
        })
        .filter(Boolean)
        .sort((a,b) => b!.date.toDate() - a!.date.toDate());
  }, [rawAttendance, studentId]);

  const testResultsQuery = useMemoFirebase(() => {
    if (!studentId) return null;
    return query(collection(firestore, 'test_results'), where('studentId', '==', studentId));
  }, [firestore, studentId]);
  const { data: testResults, isLoading: isLoadingResults } = useCollection<TestResult>(testResultsQuery);
  const performanceChartData = useMemo(() => 
    testResults?.map(p => ({ name: p.testName, score: p.marks })) || []
  , [testResults]);

  if (isLoadingStudent) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!student) {
    return <Card><CardHeader><CardTitle>Student Not Found</CardTitle></CardHeader></Card>;
  }

  return (
    <div className="space-y-6">
       <Card className="shadow-lg">
            <CardHeader className="flex flex-col items-center text-center p-6 bg-muted/20">
                <Avatar className="h-24 w-24 mb-4 border-4 border-background">
                    <AvatarImage src={student?.avatarUrl} alt={student?.name} />
                    <AvatarFallback className="text-3xl">{student?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-3xl font-headline">{student?.name}</CardTitle>
                <CardDescription className="text-base">{student?.batch ? <Badge variant="secondary">{student.batch}</Badge> : 'No Batch Assigned'}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary">Contact Information</h3>
                     <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <span>Email: <span className="font-medium">{student?.email}</span></span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <span>Mobile: <span className="font-medium">{student?.mobileNumber}</span></span>
                    </div>
                 </div>
            </CardContent>
        </Card>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <PerformanceChart data={performanceChartData} />
        
        <Card>
            <CardHeader>
                <CardTitle>Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoadingAttendance ? <Skeleton className="h-40 w-full" /> : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendanceHistory.slice(0, 5).map((att) => (
                                <TableRow key={att!.id}>
                                    <TableCell>{att!.date.toDate().toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={att!.status === 'Present' ? 'default' : 'destructive'}>
                                            {att!.status === 'Present' ? <CheckCircle className="h-4 w-4 mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                                            {att!.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Test History</CardTitle>
        </CardHeader>
        <CardContent>
        {isLoadingResults ? <Skeleton className="h-40 w-full" /> : (
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Test Name</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {testResults?.map((result) => (
                        <TableRow key={result.id}>
                            <TableCell className="font-medium">{result.testName}</TableCell>
                            <TableCell>{result.subject}</TableCell>
                            <TableCell className="text-right font-semibold">{result.marks} / {result.maxMarks}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )}
        </CardContent>
       </Card>

    </div>
  );
}

