
'use client';

import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
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
import { studentData } from '@/lib/data'; // Placeholder for name/avatar
import { CheckCircle, XCircle, BookOpen, BarChart3, CalendarCheck2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Mock types for now, will be replaced with real types from backend.json
type AttendanceRecord = { id: string; date: any; presentStudentIds: string[], absentStudentIds: string[] };
type TestResult = { id: string; date: any; marks: number; maxMarks: number; studentId: string, subject: string, testName: string };


export default function LearningPassportPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Memoized query for student's attendance
  const attendanceQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'attendances'),
      // This is not efficient, but works for a demo.
      // A better solution would be to have a subcollection for each student's attendance.
      // or an array of student UIDs on the attendance doc. We will check both present and absent arrays.
      orderBy('date', 'desc')
    );
  }, [firestore]);

  // Memoized query for student's test results
  const testResultsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'test_results'),
      where('studentId', '==', user.uid),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: rawAttendanceRecords, isLoading: isLoadingAttendance } = useCollection<AttendanceRecord>(attendanceQuery);
  const { data: testResults, isLoading: isLoadingTests } = useCollection<TestResult>(testResultsQuery);
  
  const studentAttendance = useMemo(() => {
    if (!user || !rawAttendanceRecords) return [];
    return rawAttendanceRecords
      .map(rec => {
        const isPresent = rec.presentStudentIds?.includes(user.uid);
        const isAbsent = rec.absentStudentIds?.includes(user.uid);
        if (isPresent) return { id: rec.id, date: rec.date, status: 'Present' };
        if (isAbsent) return { id: rec.id, date: rec.date, status: 'Absent' };
        return null;
      })
      .filter(Boolean) as { id: string; date: any; status: 'Present' | 'Absent' }[];
  }, [user, rawAttendanceRecords]);
  
  
  // Combine and sort all activities for a timeline view
  const timeline = useMemo(() => {
    if (!studentAttendance || !testResults) return [];
    
    const attendanceEvents = studentAttendance.map(a => ({ 
        type: 'attendance' as const, 
        timestamp: a.date?.toDate() || new Date(), 
        data: a 
    }));
    
    const testEvents = (testResults || []).map(t => ({ 
        type: 'test' as const, 
        timestamp: t.date?.toDate() || new Date(), 
        data: t
    }));

    return [...attendanceEvents, ...testEvents].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [studentAttendance, testResults]);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">My Learning Passport</h1>
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
            {isLoadingAttendance && <p>Loading attendance...</p>}
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
                    <TableCell className="font-medium">{record.date?.toDate().toLocaleDateString()}</TableCell>
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
             {studentAttendance?.length === 0 && !isLoadingAttendance && <p className="text-center text-muted-foreground py-4">No attendance records found.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Test Result History</CardTitle>
            <CardDescription>A log of all your test scores.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTests && <p>Loading test results...</p>}
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
            {testResults?.length === 0 && !isLoadingTests && <p className="text-center text-muted-foreground py-4">No test results found.</p>}
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
                {(isLoadingAttendance || isLoadingTests) && <p>Loading timeline...</p>}
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
                {timeline.length === 0 && !isLoadingAttendance && !isLoadingTests && <p className="text-center text-muted-foreground py-4">No activities found in your timeline.</p>}
            </div>
        </CardContent>
       </Card>
    </div>
  );
}
