
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { studentData, teacherData } from '@/lib/data'; // Import both
import { CheckCircle, XCircle, BarChart3, CalendarCheck2, BookCopy } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type AttendanceRecord = { id: string; date: Date; status: 'Present' | 'Absent' };
type TestResult = { id: string; date: Date; marks: number; maxMarks: number; subject: string, testName: string };

export default function LearningPassportPage() {
  const [studentAttendance, setStudentAttendance] = useState<AttendanceRecord[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Simulate fetching data for the logged-in student from the teacher's records
    setTimeout(() => {
        setStudentAttendance(teacherData.attendanceRecords.map((att, i) => ({
            id: `att-${i}`,
            date: new Date(att.date),
            status: att.status as 'Present' | 'Absent',
        })));
        setTestResults(teacherData.performance.map((p, i) => ({
            id: `test-${i}`,
            date: new Date(new Date().setDate(new Date().getDate() - (i*7))),
            marks: p.score,
            maxMarks: 100,
            subject: 'Mathematics',
            testName: p.name,
        })));
        setIsLoading(false);
    }, 1000);
  }, []);

  // Combine and sort all activities for a timeline view
  const timeline = useMemo(() => {
    const attendanceEvents = studentAttendance.map(a => ({ 
        type: 'attendance' as const, 
        timestamp: a.date, 
        data: a 
    }));
    
    const testEvents = testResults.map(t => ({ 
        type: 'test' as const, 
        timestamp: t.date,
        data: t
    }));

    return [...attendanceEvents, ...testEvents].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [studentAttendance, testResults]);


  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-5 w-80 mt-2" />
                </div>
                <Skeleton className="h-16 w-16 rounded-full" />
            </div>
            <Separator />
             <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-72 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <BookCopy className="w-8 h-8" />
            My Learning Passport
          </h1>
          <p className="text-muted-foreground">Your complete academic journey.</p>
        </div>
         <Avatar className="h-16 w-16">
            <AvatarImage src={studentData.avatarUrl} alt={studentData.name} />
            <AvatarFallback>{studentData.name.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>
      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarCheck2 className="h-5 w-5" /> Attendance History</CardTitle>
            <CardDescription>Your complete attendance record across all classes.</CardDescription>
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
                {studentAttendance?.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.date.toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={record.status === 'Present' ? 'default' : 'destructive'}>
                        {record.status === 'Present' ? <CheckCircle className="h-4 w-4 mr-2"/> : <XCircle className="h-4 w-4 mr-2"/>}
                        {record.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {studentAttendance?.length === 0 && <p className="text-center text-muted-foreground py-4">No attendance records found.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Test Result History</CardTitle>
            <CardDescription>A log of all your test scores.</CardDescription>
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
            {testResults?.length === 0 && <p className="text-center text-muted-foreground py-4">No test results found.</p>}
          </CardContent>
        </Card>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>A chronological log of all your academic activities.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                {timeline.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                            {item.type === 'attendance' ? (
                                <CalendarCheck2 className="h-6 w-6 text-primary" />
                            ) : (
                                <BarChart3 className="h-6 w-6 text-accent" />
                            )}
                        </div>
                        <div className="flex-grow">
                            {item.type === 'attendance' && (
                                <p>
                                    Attendance marked as <span className={cn('font-semibold', item.data.status === 'Present' ? 'text-primary' : 'text-destructive')}>{item.data.status}</span>.
                                </p>
                            )}
                            {item.type === 'test' && (
                                <p>
                                    Scored <span className="font-semibold text-primary">{item.data.marks}/{item.data.maxMarks}</span> in the <span className="font-semibold">{item.data.testName}</span> for <span className="font-semibold">{item.data.subject}</span>.
                                </p>
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {item.timestamp.toLocaleDateString()}
                        </div>
                    </div>
                ))}
                {timeline.length === 0 && <p className="text-center text-muted-foreground py-4">No activities found in your timeline.</p>}
            </div>
        </CardContent>
       </Card>
    </div>
  );
}
