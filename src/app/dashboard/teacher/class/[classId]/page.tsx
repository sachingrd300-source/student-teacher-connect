'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useUser,
  useFirestore,
  useDoc,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import Link from 'next/link';

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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type ClassInfo = {
  teacherId: string;
  title: string;
};

type Enrollment = {
    id: string;
    studentName: string;
    createdAt: { toDate: () => Date };
};

function ClassroomSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-32" />
      <div>
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-1/3 mt-2" />
      </div>

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

export default function TeacherClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const { user } = useUser();
  const firestore = useFirestore();

  const classRef = useMemoFirebase(() => {
    if (!firestore || !classId) return null;
    return doc(firestore, 'classes', classId);
  }, [firestore, classId]);
  const { data: classInfo, isLoading: loadingClass } = useDoc<ClassInfo>(classRef);

  const studentsQuery = useMemoFirebase(() => {
    if (!firestore || !classId) return null;
    return query(
        collection(firestore, 'enrollments'),
        where('classId', '==', classId),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
    );
  }, [firestore, classId]);
  const { data: students, isLoading: loadingStudents } = useCollection<Enrollment>(studentsQuery);
  
  const isOwner = classInfo?.teacherId === user?.uid;
  const isLoading = loadingClass || loadingStudents;

  if (isLoading) {
    return <ClassroomSkeleton />;
  }

  if (!classInfo || !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <AlertTriangle className="w-16 h-16 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You are not the owner of this class.
        </p>
        <Button asChild>
          <Link href="/dashboard/teacher/batches">Go Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/teacher/batches">
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Back to All Batches
            </Link>
        </Button>
        
      <div>
        <h1 className="text-3xl font-bold font-headline">
          {classInfo.title}
        </h1>
        <p className="text-muted-foreground">
          Manage your students for this batch.
        </p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Enrolled Students</CardTitle>
            <CardDescription>A list of all students who are approved for this batch.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Enrollment Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students && students.length > 0 ? (
                        students.map(student => (
                            <TableRow key={student.id}>
                                <TableCell className="font-medium flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback>{student.studentName?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    {student.studentName}
                                </TableCell>
                                <TableCell>
                                    {student.createdAt.toDate().toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center">
                                No students have been approved for this batch yet.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
