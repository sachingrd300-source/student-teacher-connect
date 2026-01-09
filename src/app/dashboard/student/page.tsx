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
import { ArrowRight, BookOpenCheck, CalendarDays, BarChart3, User, Clock } from 'lucide-react';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  useDoc,
} from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query, where, orderBy, limit, doc } from 'firebase/firestore';

type Enrollment = {
  id: string;
  teacherId: string;
  studentId: string;
  status: 'pending' | 'approved' | 'denied';
};

type TeacherProfile = {
    id: string;
    name: string;
    avatarUrl?: string;
    subjects?: string[];
};

type StudyMaterial = { id: string; title: string; subject: string; type: string; };
type ClassSchedule = { id: string; topic: string; date: { toDate: () => Date }; time: string; };
type Performance = { id: string; testName: string; marks: number; maxMarks: number; };

function TeacherUpdateCard({ teacherId }: { teacherId: string }) {
    const firestore = useFirestore();
    
    const teacherQuery = useMemoFirebase(() => firestore ? doc(firestore, 'users', teacherId) : null, [firestore, teacherId]);
    const { data: teacher, isLoading: isLoadingTeacher } = useDoc<TeacherProfile>(teacherQuery);
    
    const materialQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'studyMaterials'), where('teacherId', '==', teacherId), orderBy('createdAt', 'desc'), limit(1)) : null, [firestore, teacherId]);
    const { data: materials } = useCollection<StudyMaterial>(materialQuery);
    const latestMaterial = materials?.[0];

    const scheduleQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'classSchedules'), where('teacherId', '==', teacherId), where('date', '>=', new Date()), orderBy('date', 'asc'), limit(1)) : null, [firestore, teacherId]);
    const { data: schedules } = useCollection<ClassSchedule>(scheduleQuery);
    const upcomingClass = schedules?.[0];
    
    const performanceQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'performances'), where('teacherId', '==', teacherId), orderBy('date', 'desc'), limit(1)) : null, [firestore, teacherId]);
    const { data: performances } = useCollection<Performance>(performanceQuery);
    const recentScore = performances?.[0];

    if(isLoadingTeacher) {
        return <Skeleton className="h-64 w-full" />
    }
    
    if(!teacher) {
        return null; // Or some error state
    }

    return (
        <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                    <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-2xl font-headline">{teacher.name}</CardTitle>
                    {teacher.subjects && (
                      <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{teacher.subjects?.join(', ')}</Badge>
                      </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-3">
               <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-muted-foreground"><BookOpenCheck className="h-5 w-5" />Latest Material</h4>
                    {latestMaterial ? (
                        <div className="p-3 rounded-md bg-muted/50">
                          <p className="font-medium truncate">{latestMaterial.title}</p>
                          <p className="text-sm text-muted-foreground">{latestMaterial.subject} - {latestMaterial.type}</p>
                        </div>
                    ) : <p className="text-sm text-muted-foreground">No new materials.</p>}
               </div>
               <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-5 w-5" />Upcoming Class</h4>
                     {upcomingClass ? (
                        <div className="p-3 rounded-md bg-muted/50">
                          <p className="font-medium truncate">{upcomingClass.topic}</p>
                          <p className="text-sm text-muted-foreground">{upcomingClass.date.toDate().toLocaleDateString()} at {upcomingClass.time}</p>
                        </div>
                    ) : <p className="text-sm text-muted-foreground">No classes scheduled.</p>}
               </div>
               <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-muted-foreground"><BarChart3 className="h-5 w-5" />Recent Score</h4>
                     {recentScore ? (
                        <div className="p-3 rounded-md bg-muted/50">
                          <p className="font-medium truncate">{recentScore.testName}</p>
                          <p className="text-sm text-muted-foreground">Score: <span className="font-bold">{recentScore.marks}/{recentScore.maxMarks}</span></p>
                        </div>
                    ) : <p className="text-sm text-muted-foreground">No recent scores.</p>}
               </div>
            </CardContent>
            <CardFooter>
                <Button asChild className="w-full sm:w-auto ml-auto">
                    <Link href={`/dashboard/student/teacher/${teacherId}`}>View All Updates <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardFooter>
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
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
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
                 <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">My Teachers</h2>
                </div>
            )}
           
            <div className="grid gap-6 lg:grid-cols-1">
                {approvedEnrollments.map(enrollment => (
                    <TeacherUpdateCard key={enrollment.id} teacherId={enrollment.teacherId} />
                ))}
            </div>

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

    