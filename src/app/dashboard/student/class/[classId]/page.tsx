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
import { doc, collection, query, where, orderBy } from 'firebase/firestore';

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

import { FileText, AlertTriangle, BookOpenCheck } from 'lucide-react';

/* =======================
   TYPES
======================= */

type ClassInfo = {
  subject: string;
  classLevel: string;
  teacherId: string;
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
  const classRef = useMemo(() => {
    if (!firestore || !classId) return null;
    return doc(firestore, 'classes', classId);
  }, [firestore, classId]);

  const { data: classInfo, isLoading: loadingClass } =
    useDoc<ClassInfo>(classRef);

  /* ---------- TEACHER ---------- */
  const teacherRef = useMemo(() => {
    if (!firestore || !classInfo) return null;
    return doc(firestore, 'users', classInfo.teacherId);
  }, [firestore, classInfo]);

  const { data: teacherInfo, isLoading: loadingTeacher } =
    useDoc<TeacherInfo>(teacherRef);

  /* ---------- ENROLLMENT (MOST IMPORTANT) ---------- */
  const enrollmentQuery = useMemoFirebase(() => {
    if (!firestore || !user || !classId) return null;

    return query(
      collection(firestore, 'enrollments'),
      where('studentId', '==', user.uid),
      where('classId', '==', classId),
      where('status', '==', 'approved')
    );
  }, [firestore, user, classId]);

  const {
    data: enrollments,
    isLoading: loadingEnrollment,
  } = useCollection(enrollmentQuery);

  const isEnrolled = !!enrollments && enrollments.length > 0;

  /* ---------- MATERIALS (ONLY IF ENROLLED) ---------- */
  const materialsQuery = useMemo(() => {
    if (!firestore || !classId || !isEnrolled) return null;

    return query(
      collection(firestore, 'studyMaterials'),
      where('classId', '==', classId),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, classId, isEnrolled]);

  const {
    data: materials,
    isLoading: loadingMaterials,
  } = useCollection<StudyMaterial>(materialsQuery);

  /* ---------- GLOBAL LOADING ---------- */
  const isLoading =
    loadingClass ||
    loadingTeacher ||
    loadingEnrollment ||
    (isEnrolled && loadingMaterials);

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
          <a href="/dashboard/student">Go to Dashboard</a>
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
        <h1 className="text-3xl font-bold">
          {classInfo.subject} – {classInfo.classLevel}
        </h1>
        <p className="text-muted-foreground">
          Tutor: {teacherInfo?.name || '—'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6" />
            Class Materials
          </CardTitle>
          <CardDescription>
            All materials shared by your teacher for this class
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {materials?.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>
                    {materialIcons[material.type] || (
                      <FileText className="h-5 w-5" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {material.title}
                  </TableCell>
                  <TableCell>
                    {material.createdAt
                      .toDate()
                      .toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {materials?.length === 0 && (
            <p className="text-center text-muted-foreground py-10">
              No materials uploaded yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
