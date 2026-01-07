
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PerformanceChart } from '@/components/performance-chart';
import {
  FileText,
  ClipboardList,
  Pencil,
  CheckCircle,
  XCircle,
  Download,
  BookOpen,
  BarChart3,
  CalendarCheck2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useMemo } from 'react';

const materialIcons: Record<string, JSX.Element> = {
  Notes: <FileText className="h-5 w-5 text-blue-500" />,
  DPP: <ClipboardList className="h-5 w-5 text-orange-500" />,
  Test: <Pencil className="h-5 w-5 text-purple-500" />,
  Solution: <CheckCircle className="h-5 w-5 text-green-500" />,
};

type UserProfile = {
  name: string;
  isApproved: boolean;
  teacherId: string | null;
  attendance?: number;
}
type StudyMaterial = { id: string; title: string; type: string; subject: string; date: any; isNew?: boolean; };
type TestResult = { id: string; testName: string; marks: number };
type AttendanceRecord = { date: any; status: 'Present' | 'Absent' };

export default function StudentDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [teacherCode, setTeacherCode] = useState('');

  const studentDocRef = useMemoFirebase(() => 
    user ? doc(firestore, 'users', user.uid) : null
  , [firestore, user]);
  const { data: student, isLoading: isLoadingStudent } = useDoc<UserProfile>(studentDocRef);

  // Fetch materials, performance, and attendance for the student
  const materialsQuery = useMemoFirebase(() => 
    student?.teacherId ? query(collection(firestore, 'study_materials'), where('teacherId', '==', student.teacherId)) : null
  , [firestore, student]);
  const { data: studyMaterials, isLoading: isLoadingMaterials } = useCollection<StudyMaterial>(materialsQuery);

  const performanceQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'test_results'), where('studentId', '==', user.uid)) : null
  , [firestore, user]);
  const { data: performanceData, isLoading: isLoadingPerformance } = useCollection<TestResult>(performanceQuery);

  const attendanceQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
        collection(firestore, 'attendances'), 
        // This is inefficient, but we'll filter on the client. 
        // For production, a dedicated student attendance sub-collection is better.
    );
  }, [firestore, user]);
  const { data: rawAttendanceRecords, isLoading: isLoadingAttendance } = useCollection<{id: string, date: any, presentStudentIds: string[], absentStudentIds: string[] }>(attendanceQuery);

  const attendanceRecords = useMemo(() => {
    if (!user || !rawAttendanceRecords) return [];
    return rawAttendanceRecords
      .map(rec => {
        const isPresent = rec.presentStudentIds?.includes(user.uid);
        const isAbsent = rec.absentStudentIds?.includes(user.uid);
        if (isPresent) return { id: rec.id, date: rec.date, status: 'Present' as const };
        if (isAbsent) return { id: rec.id, date: rec.date, status: 'Absent' as const };
        return null;
      })
      .filter(Boolean)
      .sort((a,b) => b!.date.toDate() - a!.date.toDate()) as {id: string, date: any, status: 'Present'|'Absent'}[];
  }, [user, rawAttendanceRecords]);


  const handleEnrollmentRequest = async () => {
    if (!user || !firestore || !teacherCode) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid teacher code.' });
        return;
    }
    
    const teacherDocRef = doc(firestore, 'teachers', teacherCode);
    const teacherDocSnap = await getDoc(teacherDocRef);

    if (!teacherDocSnap.exists()) {
      toast({ variant: 'destructive', title: 'Invalid Code', description: 'No teacher found with that code.' });
      return;
    }
    
    const studentUserDocRef = doc(firestore, 'users', user.uid);
    updateDocumentNonBlocking(studentUserDocRef, {
        teacherId: teacherCode,
        isApproved: false, // Teacher must approve
    });

    toast({ title: 'Request Sent!', description: "Your enrollment request has been sent to the teacher for approval."});
  }

  if (isUserLoading || isLoadingStudent) {
    return (
      <div className="flex items-center justify-center h-full">
        <Skeleton className="h-64 w-full max-w-md rounded-xl" />
      </div>
    );
  }

  if (!student?.isApproved) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Enroll with a Teacher</CardTitle>
            <CardDescription>
              {student?.teacherId ? "Your request is pending approval." : "Enter your teacher's verification code to access all features."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!student?.teacherId && (
              <div className="space-y-4">
                  <Input placeholder="Teacher Verification Code" value={teacherCode} onChange={(e) => setTeacherCode(e.target.value)} />
                  <Button className="w-full" onClick={handleEnrollmentRequest}>
                      Send Enrollment Request
                  </Button>
              </div>
            )}
          </CardContent>
           <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">You can still access free study materials while you wait for approval.</p>
           </CardFooter>
        </Card>
      </div>
    );
  }

  const chartData = performanceData?.map(p => ({ name: p.testName, score: p.marks })) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Welcome back, {student?.name}!</h1>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
            <CalendarCheck2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student?.attendance || 100}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New DPPs</CardTitle>
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{studyMaterials?.filter(m => m.type === 'DPP').length || 0}</div>
            <p className="text-xs text-muted-foreground">Ready for practice</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
            <Pencil className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Due this week</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materials"><BookOpen className="w-4 h-4 mr-2" />Study Materials</TabsTrigger>
          <TabsTrigger value="performance"><BarChart3 className="w-4 h-4 mr-2" />Performance</TabsTrigger>
          <TabsTrigger value="attendance"><CalendarCheck2 className="w-4 h-4 mr-2" />Attendance</TabsTrigger>
        </TabsList>
        <TabsContent value="materials">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Study Materials</CardTitle>
              <CardDescription>Browse and download notes, DPPs, tests, and more.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMaterials ? <Skeleton className="h-40 w-full rounded-lg" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studyMaterials?.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">{materialIcons[material.type]}</TableCell>
                        <TableCell>
                          <div className="font-medium">{material.title}</div>
                          <div className="text-sm text-muted-foreground">{material.date?.toDate().toLocaleDateString()}</div>
                        </TableCell>
                        <TableCell><Badge variant={material.isNew ? "default" : "secondary"} className={material.isNew ? "bg-accent text-accent-foreground" : ""}>{material.subject}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="performance">
           {isLoadingPerformance ? <Skeleton className="h-[350px] w-full rounded-xl" /> : <PerformanceChart data={chartData} />}
        </TabsContent>
        <TabsContent value="attendance">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Attendance Record</CardTitle>
              <CardDescription>Your attendance for the last few classes.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAttendance ? <Skeleton className="h-40 w-full rounded-lg" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords?.map((record, idx) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.date?.toDate().toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={record.status === 'Present' ? 'default' : 'destructive'} className="bg-opacity-80">
                            {record.status === 'Present' ? <CheckCircle className="h-4 w-4 mr-2"/> : <XCircle className="h-4 w-4 mr-2"/>}
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
