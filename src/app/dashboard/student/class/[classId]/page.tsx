'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  useUser,
  useFirestore,
  useDoc,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { doc, collection, query, where, orderBy, Timestamp } from 'firebase/firestore';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

import { FileText, AlertTriangle, BookOpenCheck, Calendar, Users, Video, MapPin, Download } from 'lucide-react';
import Link from 'next/link';

/* =======================
   TYPES
======================= */

type ClassInfo = {
  subject: string;
  classLevel: string;
  teacherId: string;
  title: string;
};

type TeacherInfo = {
  name: string;
};

type StudyMaterial = {
  id: string;
  title: string;
  type: string;
  createdAt: { toDate: () => Date };
  fileUrl: string;
};

type Schedule = {
    id: string;
    topic: string;
    date: Timestamp;
    time: string;
    type: 'Online' | 'Offline';
    locationOrLink: string;
};

type Enrollment = {
    id: string;
    status: 'approved' | 'pending' | 'denied';
    studentName: string;
};

/* =======================
   ICONS
======================= */

const materialIcons: Record<string, JSX.Element> = {
  Notes: <FileText className="h-5 w-5 text-blue-500" />,
  DPP: <FileText className="h-5 w-5 text-orange-500" />,
  'Question Bank': <FileText className="h-5 w-5 text-indigo-500" />,
  Homework: <FileText className="h-5 w-5 text-yellow-500" />,
  'Test Paper': <FileText className="h-5 w-5 text-purple-500" />,
  Solution: <FileText className="h-5 w-5 text-green-500" />,
};

/* =======================
   LOADING SKELETON
======================= */

function ClassRoomSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-5 w-1/3" />

      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-72" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

/* =======================
   MAIN PAGE
======================= */

export default function ClassRoomPage() {
  const params = useParams();
  const classId = params.classId as string;

  const { user } = useUser();
  const firestore = useFirestore();

  /* ---------- CLASS ---------- */
  const classRef = useMemoFirebase(() => {
    if (!firestore || !classId) return null;
    return doc(firestore, 'classes', classId);
  }, [firestore, classId]);

  const { data: classInfo, isLoading: loadingClass } =
    useDoc<ClassInfo>(classRef);

  /* ---------- TEACHER ---------- */
  const teacherRef = useMemoFirebase(() => {
    if (!firestore || !classInfo) return null;
    return doc(firestore, 'users', classInfo.teacherId);
  }, [firestore, classInfo]);

  const { data: teacherInfo, isLoading: loadingTeacher } =
    useDoc<TeacherInfo>(teacherRef);

  /* ---------- ENROLLMENT (ACCESS CHECK) ---------- */
   const enrollmentRef = useMemoFirebase(() => {
    if (!firestore || !user || !classId) return null;
    const enrollmentId = `${user.uid}_${classId}`;
    return doc(firestore, 'enrollments', enrollmentId);
  }, [firestore, user, classId]);

  const { data: enrollment, isLoading: loadingEnrollment } = useDoc<{status: 'approved' | 'pending' | 'denied'}>(enrollmentRef);

  const isEnrolled = enrollment?.status === 'approved';

  /* ---------- DATA (ONLY IF ENROLLED) ---------- */
  const materialsQuery = useMemoFirebase(() => {
    if (!firestore || !classId || !isEnrolled) return null;
    return query(
      collection(firestore, 'studyMaterials'),
      where('classId', '==', classId),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, classId, isEnrolled]);
  const { data: materials, isLoading: loadingMaterials } = useCollection<StudyMaterial>(materialsQuery);

  const schedulesQuery = useMemoFirebase(() => {
      if (!firestore || !classId || !isEnrolled) return null;
      return query(
          collection(firestore, 'classSchedules'),
          where('classId', '==', classId),
          where('date', '>=', new Date()),
          orderBy('date', 'asc')
      );
  }, [firestore, classId, isEnrolled]);
  const { data: schedules, isLoading: loadingSchedules } = useCollection<Schedule>(schedulesQuery);

  const classmatesQuery = useMemoFirebase(() => {
      if (!firestore || !classId || !isEnrolled) return null;
      return query(
          collection(firestore, 'enrollments'),
          where('classId', '==', classId),
          where('status', '==', 'approved')
      );
  }, [firestore, classId, isEnrolled]);
  const { data: classmates, isLoading: loadingClassmates } = useCollection<Enrollment>(classmatesQuery);


  /* ---------- GLOBAL LOADING ---------- */
  const isLoading =
    loadingClass ||
    loadingTeacher ||
    loadingEnrollment ||
    (isEnrolled && (loadingMaterials || loadingSchedules || loadingClassmates));

  if (isLoading) {
    return <ClassRoomSkeleton />;
  }

  /* ---------- ACCESS DENIED ---------- */
  if (!isEnrolled) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <AlertTriangle className="w-16 h-16 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You are not enrolled in this class or your request is not approved.
        </p>
        <Button asChild>
          <Link href="/dashboard/student">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (!classInfo) {
    return <p>Class not found</p>;
  }

  /* =======================
     UI
  ======================= */

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          {classInfo.title}
        </h1>
        <p className="text-muted-foreground">
          Tutor: {teacherInfo?.name || '—'}
        </p>
      </div>

       <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="materials"><BookOpenCheck className="w-4 h-4 mr-2"/>Materials</TabsTrigger>
          <TabsTrigger value="schedule"><Calendar className="w-4 h-4 mr-2"/>Schedule</TabsTrigger>
          <TabsTrigger value="students"><Users className="w-4 h-4 mr-2"/>Students</TabsTrigger>
        </TabsList>
        <TabsContent value="materials">
            <Card>
                <CardHeader>
                <CardTitle>Class Materials</CardTitle>
                <CardDescription>All resources shared by your teacher for this class.</CardDescription>
                </CardHeader>

                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">Type</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>

                    <TableBody>
                    {materials?.map((material) => (
                        <TableRow key={material.id}>
                        <TableCell>
                            {materialIcons[material.type] || <FileText className="h-5 w-5" />}
                        </TableCell>
                        <TableCell className="font-medium">{material.title}</TableCell>
                        <TableCell>{material.createdAt.toDate().toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                            <Button asChild variant="outline" size="sm">
                                <Link href={material.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                </Link>
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                {materials?.length === 0 && (
                    <p className="text-center text-muted-foreground py-10">No materials uploaded yet.</p>
                )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="schedule">
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Class Schedule</CardTitle>
                    <CardDescription>Your schedule for this specific class.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {schedules && schedules.length > 0 ? schedules.map(schedule => (
                         <Card key={schedule.id} className="shadow-soft-shadow bg-muted/50">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-muted-foreground">{format(schedule.date.toDate(), 'EEEE, PPP')}</p>
                                        <CardTitle className="text-xl">{schedule.topic}</CardTitle>
                                    </div>
                                    <Badge variant="secondary">{schedule.time}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    {schedule.type === 'Online' ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                                    <span className="truncate">{schedule.locationOrLink}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )) : (
                        <p className="text-center text-muted-foreground py-10">No upcoming classes scheduled for this batch.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="students">
             <Card>
                <CardHeader>
                    <CardTitle>Classmates</CardTitle>
                    <CardDescription>Students enrolled in this batch.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {classmates && classmates.length > 0 ? classmates.map(student => (
                        <div key={student.id} className="flex flex-col items-center text-center gap-2">
                            <Avatar>
                                <AvatarFallback>{student.studentName?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-medium leading-none truncate w-full">{student.studentName}</p>
                        </div>
                    )) : (
                         <p className="text-center text-muted-foreground py-10 col-span-full">You're the first one here!</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
