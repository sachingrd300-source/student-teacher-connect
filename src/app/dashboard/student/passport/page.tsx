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
import { CheckCircle, XCircle, BarChart3, CalendarCheck2, BookCopy } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

type AttendanceRecord = { id: string; date: { toDate: () => Date }; isPresent: boolean };
type TestResult = { id: string; date: { toDate: () => Date }; marks: number; maxMarks: number; subject: string, testName: string };

export default function LearningPassportPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const attendanceQuery = useMemoFirebase(() => firestore && user ? query(collection(firestore, 'attendances'), where('studentId', '==', user.uid), orderBy('date', 'desc')) : null, [firestore, user]);
  const { data: studentAttendance, isLoading: isLoadingAttendance } = useCollection<AttendanceRecord>(attendanceQuery);

  const performanceQuery = useMemoFirebase(() => firestore && user ? query(collection(firestore, 'performances'), where('studentId', '==', user.uid), orderBy('date', 'desc')) : null, [firestore, user]);
  const { data: testResults, isLoading: isLoadingPerformance } = useCollection<TestResult>(performanceQuery);
  
  const isLoading = isLoadingAttendance || isLoadingPerformance;

  // Combine and sort all activities for a timeline view
  const timeline = useMemo(() => {
    if (!studentAttendance || !testResults) return [];
    
    const attendanceEvents = studentAttendance.map(a => ({ 
        type: 'attendance' as const, 
        timestamp: a.date.toDate(), 
        data: a 
    }));
    
    const testEvents = testResults.map(t => ({ 
        type: 'test' as const, 
        timestamp: t.date.toDate(),
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
            <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'Student'} />
            <AvatarFallback>{user?.displayName?.charAt(0) || 'S'}</AvatarFallback>
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
                    <TableCell className="font-medium">{record.date.toDate().toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={record.isPresent ? 'default' : 'destructive'}>
                        {record.isPresent ? <CheckCircle className="h-4 w-4 mr-2"/> : <XCircle className="h-4 w-4 mr-2"/>}
                        {record.isPresent ? 'Present' : 'Absent'}
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
                                    Attendance marked as <span className={cn('font-semibold', item.data.isPresent ? 'text-primary' : 'text-destructive')}>{item.data.isPresent ? 'Present' : 'Absent'}</span>.
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
