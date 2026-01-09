
'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ConnectTeacherForm } from '@/components/connect-teacher-form';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, User as UserIcon } from 'lucide-react';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  useDoc,
} from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query, where, doc } from 'firebase/firestore';
import Link from 'next/link';

type Enrollment = {
  id: string;
  classId: string;
  status: 'pending' | 'approved' | 'denied';
};

type ClassInfo = {
    id: string;
    subject: string;
    classLevel: string;
    teacherId: string;
}

type TeacherProfile = {
  name: string;
  avatarUrl?: string;
};


function ApprovedClassCard({ enrollment }: { enrollment: Enrollment }) {
  const firestore = useFirestore();

  const classQuery = useMemoFirebase(() => firestore ? doc(firestore, 'classes', enrollment.classId) : null, [firestore, enrollment.classId]);
  const { data: classInfo, isLoading: isLoadingClass } = useDoc<ClassInfo>(classQuery);

  const teacherQuery = useMemoFirebase(() => {
    if (!firestore || !classInfo?.teacherId) return null;
    return doc(firestore, 'users', classInfo.teacherId);
  }, [firestore, classInfo]);

  const { data: teacher, isLoading: isLoadingTeacher } = useDoc<TeacherProfile>(teacherQuery);

  if (isLoadingClass || isLoadingTeacher) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (!teacher || !classInfo) {
    return null;
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
            <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl font-headline">
              {classInfo.subject} - {classInfo.classLevel}
            </CardTitle>
            <CardDescription>
              Taught by {teacher.name} | Status: <span className="text-primary font-semibold">Enrolled</span>
            </CardDescription>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/student/teacher/${classInfo.teacherId}`}>
            View Updates <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
    </Card>
  );
}

export default function StudentDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'enrollments'),
      where('studentId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: enrollments, isLoading: isLoadingEnrollments } =
    useCollection<Enrollment>(enrollmentsQuery);

  const approvedEnrollments = useMemo(
    () => enrollments?.filter((e) => e.status === 'approved') || [],
    [enrollments]
  );
  const pendingEnrollments = useMemo(
    () => enrollments?.filter((e) => e.status === 'pending') || [],
    [enrollments]
  );

  if (isUserLoading || isLoadingEnrollments) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          {user ? `Welcome back, ${user.displayName || 'Student'}!` : 'Student Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {approvedEnrollments.length > 0
            ? 'View updates from your joined classes or join a new one.'
            : 'Join a class to get started.'}
        </p>
      </div>

      {user && (
        <div className="space-y-6">
          
          {pendingEnrollments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>
                  Your request to join these classes is awaiting teacher approval.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {pendingEnrollments.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                    >
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">
                        Request sent for Class ID: ...{p.classId.slice(-6)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card id="connect">
            <CardHeader>
              <CardTitle className="text-lg">
                Join a New Class
              </CardTitle>
              <CardDescription className="text-sm">
                Enter a teacher's unique class code to send a join request.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectTeacherForm onConnectionSuccess={() => {}} />
            </CardContent>
          </Card>
        </div>
      )}

      {!user && (
        <Card className="text-center">
          <CardHeader>
            <UserIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle>Log In to View Your Dashboard</CardTitle>
            <CardDescription>
              To join classes and see your personalized content, please
              log in or create an account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">Log In / Sign Up</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
