'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowRight,
  User as UserIcon,
  BookOpenCheck,
  ClipboardList,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type Enrollment = {
  id: string;
  classId: string;
  teacherId: string;
  status: 'pending' | 'approved' | 'denied';
};

type ClassInfo = {
    id: string;
    subject: string;
    classLevel: string;
    teacherId: string;
}

type TeacherInfo = {
    name: string;
}

function EnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const classQuery = useMemo(() => {
        if (!firestore) return null;
        return doc(firestore, 'classes', enrollment.classId);
    }, [firestore, enrollment.classId]);
    const {data: classInfo, isLoading: isLoadingClass} = useDoc<ClassInfo>(classQuery);

    const teacherQuery = useMemo(() => {
        if (!firestore || !classInfo) return null;
        return doc(firestore, 'users', classInfo.teacherId);
    }, [firestore, classInfo]);
    const {data: teacherInfo, isLoading: isLoadingTeacher} = useDoc<TeacherInfo>(teacherQuery);

    const statusIcons = {
        pending: <Clock className="h-5 w-5 text-yellow-500" />,
        approved: <CheckCircle className="h-5 w-5 text-green-500" />,
        denied: <XCircle className="h-5 w-5 text-red-500" />,
    }

    if (isLoadingClass || isLoadingTeacher) {
        return <Skeleton className="h-24 w-full" />;
    }
    
    if (!classInfo || !teacherInfo) {
        return null; // Or some error state
    }

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>{classInfo.subject} - {classInfo.classLevel}</CardTitle>
                <CardDescription>Tutor: {teacherInfo.name}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                 <div className="flex items-center gap-2">
                    {statusIcons[enrollment.status]}
                    <Badge variant={
                        enrollment.status === 'approved' ? 'default' : 
                        enrollment.status === 'denied' ? 'destructive' : 'secondary'
                    } className="capitalize">{enrollment.status}</Badge>
                </div>
            </CardContent>
             {enrollment.status === 'approved' && (
                <CardFooter>
                    <Button variant="outline" asChild>
                        <Link href={`/dashboard/student/class/${enrollment.classId}`}>
                            View Class <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}


export default function StudentDashboardPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [classCode, setClassCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const enrollmentsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'enrollments'), where('studentId', '==', user.uid));
  }, [firestore, user]);

  const { data: enrollments, isLoading: isLoadingEnrollments } = useCollection<Enrollment>(enrollmentsQuery);

  const handleJoinClass = async () => {
    if (!classCode.trim() || !firestore || !user) {
      toast({ variant: 'destructive', title: 'Invalid Code', description: 'Please enter a valid class code.' });
      return;
    }
    setIsJoining(true);

    try {
        const classesRef = collection(firestore, 'classes');
        const q = query(classesRef, where('classCode', '==', classCode.trim()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            toast({ variant: 'destructive', title: 'Class Not Found', description: 'No class found with that code. Please check and try again.' });
            setIsJoining(false);
            return;
        }

        const classDoc = querySnapshot.docs[0];
        const classData = classDoc.data();

        // Check if already enrolled
        const alreadyEnrolled = enrollments?.some(e => e.classId === classDoc.id);
        if (alreadyEnrolled) {
            toast({ variant: 'default', title: 'Already Enrolled', description: 'You have already sent a request to join this class.' });
            setIsJoining(false);
            return;
        }
        
        const enrollmentData = {
            studentId: user.uid,
            classId: classDoc.id,
            teacherId: classData.teacherId,
            status: 'pending',
            createdAt: serverTimestamp(),
        };

        addDocumentNonBlocking(collection(firestore, 'enrollments'), enrollmentData);
        
        toast({ title: 'Request Sent!', description: `Your request to join ${classData.subject} has been sent to the teacher.` });
        setClassCode('');

    } catch (error) {
        console.error("Error joining class: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not send join request. Please try again.' });
    } finally {
        setIsJoining(false);
    }
  };


  if (isUserLoading) {
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
          Join a class to access materials and connect with your teacher.
        </p>
      </div>

      {user ? (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Join a New Class</CardTitle>
                    <CardDescription>Enter the unique code provided by your teacher to request access to their class.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Enter Class Code" 
                            value={classCode}
                            onChange={(e) => setClassCode(e.target.value)}
                            disabled={isJoining}
                        />
                        <Button onClick={handleJoinClass} disabled={isJoining}>
                            {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Join Class
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div>
                <h2 className="text-2xl font-bold font-headline mb-4">My Classes</h2>
                {isLoadingEnrollments ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                         <Skeleton className="h-40 w-full" />
                         <Skeleton className="h-40 w-full" />
                    </div>
                ) : enrollments && enrollments.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                       {enrollments.map(enrollment => (
                           <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
                       ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">You have not joined any classes yet.</p>
                )}

            </div>
        </>
      ) : (
        <Card className="text-center">
          <CardHeader>
            <UserIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle>Log In to View Your Dashboard</CardTitle>
            <CardDescription>
              To access learning content, please log in or create an account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login-student">Log In / Sign Up</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
