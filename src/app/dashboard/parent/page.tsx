
'use client';

import { useMemo } from 'react';
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
import {
  FileText,
  ClipboardList,
  Pencil,
  CheckCircle,
  BookOpen,
  CalendarCheck2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, limit } from 'firebase/firestore';

const PerformanceChart = dynamic(
  () => import('@/components/performance-chart').then((mod) => mod.PerformanceChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[250px] w-full" />,
  }
);


const materialIcons: Record<string, JSX.Element> = {
  Notes: <FileText className="h-5 w-5 text-blue-500" />,
  DPP: <ClipboardList className="h-5 w-5 text-orange-500" />,
  Test: <Pencil className="h-5 w-5 text-purple-500" />,
  Solution: <CheckCircle className="h-5 w-5 text-green-500" />,
};

type ParentProfile = { id: string, studentId: string, userId: string };
type StudentProfile = { id: string, name: string, attendance: number, avatarUrl: string };
type StudyMaterial = { id: string, title: string, type: string, subject: string, date: any, isNew?: boolean };
type PerformanceData = { name: string; score: number };
type TestResult = { id: string; studentId: string; testName: string; subject: string; marks: number; maxMarks: number; date: any; };


export default function ParentDashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // 1. Fetch parent profile to find studentId
  const parentQuery = useMemoFirebase(() =>
    user ? query(collection(firestore, 'parents'), where('userId', '==', user.uid), limit(1)) : null
  , [firestore, user]);
  const { data: parentDocs, isLoading: isLoadingParent } = useCollection<ParentProfile>(parentQuery);
  const parentProfile = parentDocs?.[0];
  const studentId = parentProfile?.studentId;

  // 2. Fetch student's user profile using the studentId from the parent profile
  const studentDocRef = useMemoFirebase(() => 
    studentId ? doc(firestore, 'users', studentId) : null
  , [firestore, studentId]);
  const { data: student, isLoading: isLoadingStudent } = useDoc<StudentProfile>(studentDocRef);

  // 3. Fetch student's related data
  const studentMaterialsQuery = useMemoFirebase(() => 
    student?.teacherId ? query(collection(firestore, 'study_materials'), where('teacherId', '==', student.teacherId), limit(4)) : null
  , [firestore, student]);
  const { data: studyMaterials, isLoading: isLoadingMaterials } = useCollection<StudyMaterial>(studentMaterialsQuery);

  const studentPerformanceQuery = useMemoFirebase(() => 
    studentId ? query(collection(firestore, 'test_results'), where('studentId', '==', studentId)) : null
  , [firestore, studentId]);
  const { data: performanceData, isLoading: isLoadingPerformance } = useCollection<TestResult>(studentPerformanceQuery);

  const chartData = useMemo(() => 
    performanceData?.map(p => ({ name: p.testName, score: p.marks })) || []
  , [performanceData]);

  if (isLoadingParent || isLoadingStudent) {
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <Skeleton className="h-[350px] w-full rounded-xl" />
                <Skeleton className="h-[350px] w-full rounded-xl" />
            </div>
        </div>
    )
  }

  if (!student) {
    return (
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Student Not Found</CardTitle>
          <CardDescription>We couldn't find the student profile. Please ensure your parent account is correctly linked to your child's student ID.</CardDescription>
        </CardHeader>
      </Card>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold font-headline">Parent Dashboard</h1>
            <p className="text-muted-foreground">
            Viewing progress for <span className="font-semibold text-primary">{student.name}</span>.
            </p>
        </div>
        <Avatar className="h-16 w-16 border-2 border-primary/50">
            <AvatarImage src={student.avatarUrl} alt={student.name} />
            <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>
      
      <Separator />

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
            <CalendarCheck2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.attendance || 'N/A'}%</div>
            <p className="text-xs text-muted-foreground">Excellent attendance record.</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New DPPs</CardTitle>
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{studyMaterials?.filter(m => m.type === 'DPP').length || 0}</div>
            <p className="text-xs text-muted-foreground">New practice papers available.</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
            <Pencil className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Assignments to be completed.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Chart */}
        <PerformanceChart data={chartData} />

        {/* Recent Activity */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Recent Materials</CardTitle>
            <CardDescription>Latest study materials uploaded by the teacher.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMaterials ? <Skeleton className="h-40 w-full" /> :
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studyMaterials?.slice(0, 4).map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{materialIcons[material.type] || <BookOpen />}</TableCell>
                      <TableCell>
                        <div className="font-medium">{material.title}</div>
                        {material.isNew && <Badge variant="outline" className="text-accent border-accent">New</Badge>}
                      </TableCell>
                      <TableCell>{material.subject}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{material.date?.toDate().toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    