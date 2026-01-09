
'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { ConnectTeacherForm } from '@/components/connect-teacher-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, User, Clock, CheckCircle } from 'lucide-react';
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

type Enrollment = {
  id: string;
  teacherId: string;
  studentId: string;
  status: 'pending' | 'approved' | 'denied';
  teacherName?: string;
  teacherAvatar?: string;
};

type TeacherProfile = {
    id: string;
    name: string;
    avatarUrl?: string;
};


function ApprovedTeacherCard({ enrollment }: { enrollment: Enrollment }) {
    const firestore = useFirestore();
    const teacherQuery = useMemoFirebase(() => firestore ? doc(firestore, 'users', enrollment.teacherId) : null, [firestore, enrollment.teacherId]);
    const { data: teacher, isLoading: isLoadingTeacher } = useDoc<TeacherProfile>(teacherQuery);

    if (isLoadingTeacher) {
        return <Skeleton className="h-24 w-full" />;
    }

    if (!teacher) {
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
                        <CardTitle className="text-xl font-headline">{teacher.name}</CardTitle>
                        <CardDescription>Status: <span className="text-primary font-semibold">Connected</span></CardDescription>
                    </div>
                </div>
                 <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/student/teacher/${enrollment.teacherId}`}>View Updates <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
    return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
  }, [firestore, user]);

  const { data: enrollments, isLoading: isLoadingEnrollments } = useCollection<Enrollment>(enrollmentsQuery);

  const approvedEnrollments = useMemo(() => enrollments?.filter(e => e.status === 'approved') || [], [enrollments]);
  const pendingEnrollments = useMemo(() => enrollments?.filter(e => e.status === 'pending') || [], [enrollments]);

  const handleConnectionSuccess = () => {
    // The useCollection hook will automatically update the UI
  };

  if (isUserLoading || isLoadingEnrollments) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          {user ? `Welcome back, ${user.displayName || 'Student'}!` : 'Student Dashboard'}
        </h1>
        <p className="text-muted-foreground">
            {user && approvedEnrollments.length > 0
                ? "View updates from your connected teachers or connect with a new one."
                : "Connect with a teacher to get started."}
        </p>
      </div>

      {user && (
        <div className="space-y-6">
            {approvedEnrollments.length > 0 && (
                 <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">My Teachers</h2>
                    {approvedEnrollments.map(enrollment => (
                        <ApprovedTeacherCard key={enrollment.id} enrollment={enrollment} />
                    ))}
                </div>
            )}

            {pendingEnrollments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Connections</CardTitle>
                        <CardDescription>These teachers have not approved your connection request yet.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                           {pendingEnrollments.map(p => (
                            <li key={p.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">Request sent to Teacher ID: ...{p.teacherId.slice(-6)}</span>
                            </li>
                           ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            <Card id="connect">
                <CardHeader>
                    <CardTitle className="text-lg">Connect with a New Teacher</CardTitle>
                    <CardDescription className="text-sm">Enter a teacher's unique code to send a connection request.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ConnectTeacherForm onConnectionSuccess={handleConnectionSuccess} />
                </CardContent>
            </Card>
        </div>
      )}
      
      {!user && (
         <Card className="text-center">
            <CardHeader>
                <User className="mx-auto h-12 w-12 text-muted-foreground" />
                <CardTitle>Log In to View Your Dashboard</CardTitle>
                <CardDescription>
                    To connect with teachers and see your personalized content, please log in or create an account.
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
