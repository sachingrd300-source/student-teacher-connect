
'use client';

import { useState, useMemo } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Check,
  X,
  UserCheck,
  Users2,
  PlusCircle,
  DoorOpen,
  Info,
  Copy,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  useUser,
  useFirestore,
  useCollection,
  useDoc,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Label } from '@/components/ui/label';

type UserProfile = {
  id: string;
  name: string;
  role: string;
  status: 'pending_verification' | 'approved';
  subjects?: string[];
  classLevels?: string[];
  avatarUrl?: string;
};

type Enrollment = {
    id: string;
    studentId: string;
    classId: string;
    status: 'pending' | 'approved' | 'denied';
};

type Class = {
    id: string;
    subject: string;
    classLevel: string;
    classCode: string;
    teacherId: string;
}

function StudentRequestRow({ enrollment }: { enrollment: Enrollment }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const studentQuery = useMemoFirebase(() => firestore ? doc(firestore, 'users', enrollment.studentId) : null, [firestore, enrollment.studentId]);
    const { data: student, isLoading } = useDoc<UserProfile>(studentQuery);

    const handleApprove = async () => {
        if (!firestore) return;
        const enrollmentRef = doc(firestore, 'enrollments', enrollment.id);
        await updateDoc(enrollmentRef, { status: 'approved' });
        toast({ title: 'Student Approved', description: `${student?.name} is now enrolled in the class.`});
    };

    const handleDeny = async () => {
        if (!firestore) return;
        const enrollmentRef = doc(firestore, 'enrollments', enrollment.id);
        await updateDoc(enrollmentRef, { status: 'denied' });
        toast({ variant: 'destructive', title: 'Request Denied', description: 'The enrollment request has been denied.'});
    };
    
    if(isLoading) {
        return (
            <TableRow>
                <TableCell colSpan={3}><Skeleton className="h-10 w-full" /></TableCell>
            </TableRow>
        );
    }

    return (
        <TableRow>
            <TableCell className="font-medium flex items-center gap-3">
            <Avatar>
                <AvatarImage src={student?.avatarUrl} />
                <AvatarFallback>{student?.name?.charAt(0) || 'S'}</AvatarFallback>
            </Avatar>
            {student?.name || 'Loading...'}
            </TableCell>
             <TableCell>
                <Badge variant="outline">ClassId: ...{enrollment.classId.slice(-6)}</Badge>
            </TableCell>
            <TableCell className="text-right space-x-2">
            <Button onClick={handleApprove} variant="outline" size="icon" className="h-8 w-8 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700">
                <Check className="h-4 w-4" />
            </Button>
            <Button onClick={handleDeny} variant="outline" size="icon" className="h-8 w-8 text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700">
                <X className="h-4 w-4" />
            </Button>
            </TableCell>
        </TableRow>
    )
}

function PendingVerificationCard() {
    return (
        <Card className="bg-amber-50 border-amber-200 shadow-lg">
            <CardHeader className="flex-row items-center gap-4">
                <Info className="h-8 w-8 text-amber-600"/>
                <div>
                    <CardTitle className="text-xl text-amber-800">Profile Under Verification</CardTitle>
                    <CardDescription className="text-amber-700">
                        Your profile has been submitted and is currently being reviewed by the admin. 
                        You will be notified once it is approved.
                    </CardDescription>
                </div>
            </CardHeader>
        </Card>
    )
}


export default function TeacherDashboardPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [isCreateClassOpen, setCreateClassOpen] = useState(false);
  const [newClassData, setNewClassData] = useState({ subject: '', classLevel: '' });

  const userProfileQuery = useMemoFirebase(() => {
    if(!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileQuery);


  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'enrollments'), 
        where('teacherId', '==', user.uid),
        where('status', '==', 'pending')
    );
  }, [firestore, user]);
  const { data: studentRequests, isLoading: isLoadingEnrollments } = useCollection<Enrollment>(enrollmentsQuery);

  const approvedEnrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'enrollments'), 
        where('teacherId', '==', user.uid),
        where('status', '==', 'approved')
    );
  }, [firestore, user]);
  const { data: approvedEnrollments, isLoading: isLoadingApproved } = useCollection<Enrollment>(approvedEnrollmentsQuery);


  const classesQuery = useMemoFirebase(() => {
    if(!firestore || !user) return null;
    return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid));
  }, [firestore, user]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesQuery);


  const enrolledStudentsCount = useMemo(() => {
    if (!approvedEnrollments) return 0;
    const uniqueStudents = new Set(approvedEnrollments.map(e => e.studentId));
    return uniqueStudents.size;
  }, [approvedEnrollments]);

  const handleCreateClass = () => {
    if(!newClassData.subject || !newClassData.classLevel || !firestore || !user) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a subject and class level.' });
        return;
    }
    
    const classCode = `${newClassData.subject.substring(0,4).toUpperCase()}${newClassData.classLevel.replace(/\s/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const classData = {
        ...newClassData,
        teacherId: user.uid,
        classCode,
        createdAt: serverTimestamp(),
    };

    addDocumentNonBlocking(collection(firestore, 'classes'), classData);

    toast({
        title: 'Class Created!',
        description: `Your new class code is ${classCode}. Share it with your students.`
    });
    setCreateClassOpen(false);
    setNewClassData({ subject: '', classLevel: '' });
  };
  
  if (isLoadingProfile) {
    return <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
    </div>
  }

  if (userProfile?.status === 'pending_verification') {
    return (
        <div className="space-y-6">
             <h1 className="text-3xl font-bold font-headline">Teacher Dashboard</h1>
             <PendingVerificationCard />
        </div>
    );
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Teacher Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingApproved ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{enrolledStudentsCount}</div>}
            <p className="text-xs text-muted-foreground">Total unique students</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingEnrollments ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold text-accent">{studentRequests?.length || 0}</div>}
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Classes</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoadingClasses ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{classes?.length || 0}</div>}
            <p className="text-xs text-muted-foreground">Total created classes</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Status</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold"><Badge variant="default">Open</Badge></div>
            <p className="text-xs text-muted-foreground">Your classes are open for enrollment</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Enrollment Requests</CardTitle>
                <CardDescription>Approve or deny new student requests.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingEnrollments && <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>}
            {studentRequests && studentRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentRequests.map((enrollment) => (
                    <StudentRequestRow key={enrollment.id} enrollment={enrollment} />
                  ))}
                </TableBody>
              </Table>
            ) : !isLoadingEnrollments && (
              <p className="text-sm text-center text-muted-foreground py-4">No pending requests.</p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump to common tasks.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
              <Button variant="outline" asChild><Link href="/dashboard/teacher/materials">Upload Materials</Link></Button>
              <Button variant="outline" asChild><Link href="/dashboard/teacher/attendance">Take Attendance</Link></Button>
              <Button variant="outline" asChild><Link href="/dashboard/teacher/performance">Enter Marks</Link></Button>
              <Button variant="outline" asChild><Link href="/dashboard/teacher/schedule">Manage Schedule</Link></Button>
          </CardContent>
        </Card>
      </div>

       <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Classes</CardTitle>
              <CardDescription>Manage your classes and share codes with students.</CardDescription>
            </div>
             <Dialog open={isCreateClassOpen} onOpenChange={setCreateClassOpen}>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Create Class</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Create a New Class</DialogTitle>
                        <DialogDescription>Select a subject and level to generate a unique class code.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                             <Select onValueChange={(value) => setNewClassData(p => ({...p, subject: value}))} value={newClassData.subject}>
                                <SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger>
                                <SelectContent>
                                    {userProfile?.subjects?.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="classLevel">Class/Level</Label>
                            <Select onValueChange={(value) => setNewClassData(p => ({...p, classLevel: value}))} value={newClassData.classLevel}>
                                <SelectTrigger><SelectValue placeholder="Select a class level" /></SelectTrigger>
                                <SelectContent>
                                    {userProfile?.classLevels?.map(cl => <SelectItem key={cl} value={cl}>{cl}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateClass}>Generate Code</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
           {isLoadingClasses && <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>}
           {classes && classes.length > 0 ? (
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Class Code</TableHead>
                    <TableHead className="text-right">Enrolled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.subject} - {cls.classLevel}</TableCell>
                       <TableCell>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">{cls.classCode}</Badge>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                navigator.clipboard.writeText(cls.classCode);
                                toast({title: "Copied!", description: "Class code copied to clipboard."})
                            }}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                       </TableCell>
                      <TableCell className="text-right">
                         {approvedEnrollments?.filter(e => e.classId === cls.id).length}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : !isLoadingClasses && (
              <p className="text-sm text-center text-muted-foreground py-8">You haven't created any classes yet.</p>
            )}
          </CardContent>
        </Card>
    </div>
  );
}



    