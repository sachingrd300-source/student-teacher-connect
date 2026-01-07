
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
import { CheckCircle, XCircle, Mail, Phone } from 'lucide-react';
import { PerformanceChart } from '@/components/performance-chart';
import { teacherData, studentData } from '@/lib/data';
import { notFound } from 'next/navigation';

type StudentProfile = {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  avatarUrl: string;
  batch: string;
};

type AttendanceRecord = { id: string; date: Date; status: 'Present' | 'Absent' };
type TestResult = { id: string; date: Date; marks: number; maxMarks: number; subject: string, testName: string };

export default function StudentProfilePage({ params }: { params: { studentId: string } }) {
  const { studentId } = params;
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
        // Find the student from the teacher's list of enrolled students.
        const foundStudent = teacherData.enrolledStudents.find(s => s.id === studentId);
        
        if (foundStudent) {
            setStudent({
                ...foundStudent,
                email: `${foundStudent.name.split(' ')[0].toLowerCase()}@example.com`,
                mobileNumber: '123-456-7890',
                batch: 'Morning Physics', // Assuming static batch for demo
            });

            // Use generic student data for their records as a mock
            setAttendanceHistory(studentData.attendanceRecords.map((att, i) => ({
                id: `att-${i}`,
                date: new Date(new Date().setDate(new Date().getDate() - i)),
                status: att.status as 'Present' | 'Absent',
            })));

            setTestResults(studentData.performance.map((p, i) => ({
                id: `test-${i}`,
                date: new Date(new Date().setDate(new Date().getDate() - (i * 7))),
                marks: p.score,
                maxMarks: 100,
                subject: 'Mathematics',
                testName: p.name,
            })));
        } else {
            // If the student isn't found in the teacher's list, it's a 404.
            // In a real app, this check would happen before rendering.
        }
        setIsLoading(false);
    }, 1000);
  }, [studentId]);


  const performanceChartData = useMemo(() => 
    testResults?.map(p => ({ name: p.testName, score: p.marks })) || []
  , [testResults]);

  if (isLoading) {
    return <div className="space-y-6">
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
                                <TableCell>{att!.date.toLocaleDateString()}</TableCell>
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
