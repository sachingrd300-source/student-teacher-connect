'use client';

import { useMemo, useState, useEffect } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Mail, Phone, ArrowLeft } from 'lucide-react';
import { PerformanceChart } from '@/components/performance-chart';
import { notFound, useParams } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import Link from 'next/link';

type StudentProfile = {
  id: string;
  name: string;
  email: string;
  mobileNumber?: string;
  avatarUrl?: string;
  batch?: string;
};

type AttendanceRecord = { id: string; date: { toDate: () => Date }; isPresent: boolean };
type TestResult = { id: string; date: { toDate: () => Date }; marks: number; maxMarks: number; subject: string, testName: string };

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.studentId as string;
  
  const firestore = useFirestore();

  const studentQuery = useMemoFirebase(() => firestore ? doc(firestore, 'users', studentId) : null, [firestore, studentId]);
  const { data: student, isLoading: isLoadingStudent } = useDoc<StudentProfile>(studentQuery);

  const attendanceQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'attendances'), where('studentId', '==', studentId), orderBy('date', 'desc')) : null, [firestore, studentId]);
  const { data: attendanceHistory, isLoading: isLoadingAttendance } = useCollection<AttendanceRecord>(attendanceQuery);

  const performanceQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'performances'), where('studentId', '==', studentId), orderBy('date', 'desc')) : null, [firestore, studentId]);
  const { data: testResults, isLoading: isLoadingPerformance } = useCollection<TestResult>(performanceQuery);


  const performanceChartData = useMemo(() => 
    testResults?.map(p => ({ name: p.testName, score: p.marks })) || []
  , [testResults]);
  
  const isLoading = isLoadingStudent || isLoadingAttendance || isLoadingPerformance;

  if (isLoading) {
    return <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-[300px] w-full" />
        <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    </div>;
  }

  // After loading, if no student was found, show a not found page.
  if (!student) {
    notFound();
  }

  return (
    <div className="space-y-6">
        <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard/teacher">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to My Students
            </Link>
        </Button>
       <Card className="shadow-lg">
            <CardHeader className="flex flex-col items-center text-center p-6 bg-muted/20">
                <Avatar className="h-24 w-24 mb-4 border-4 border-background">
                    <AvatarImage src={student?.avatarUrl} alt={student?.name} />
                    <AvatarFallback className="text-3xl">{student?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-4xl font-headline">{student?.name}</CardTitle>
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
                        <span>Mobile: <span className="font-medium">{student?.mobileNumber || 'Not provided'}</span></span>
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {attendanceHistory?.slice(0, 5).map((att) => (
                            <TableRow key={att!.id}>
                                <TableCell>{att!.date.toDate().toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={att.isPresent ? 'default' : 'destructive'}>
                                        {att.isPresent ? <CheckCircle className="h-4 w-4 mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                                        {att.isPresent ? 'Present' : 'Absent'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Test History</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
       </Card>

    </div>
  );
}
