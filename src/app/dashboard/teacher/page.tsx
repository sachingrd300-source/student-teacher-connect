
'use client';

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { teacherData } from '@/lib/data';
import {
  Users,
  UploadCloud,
  Check,
  X,
  MoreVertical,
  BookOpen,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '@/components/ui/skeleton';

// Represents the structure of a Student document in Firestore, linked to a User.
type StudentProfile = {
  id: string; // The student document ID (e.g., STU-xxxx)
  userId: string; // The auth user UID
  name: string;
  isApproved: boolean;
  teacherId: string | null;
  avatarUrl: string; // Assuming user profile has this
  grade?: string; // Example field
  attendance?: number; // Example field
};


export default function TeacherDashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const teacherIdQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'teachers'), where('userId', '==', user.uid)) : null
  , [firestore, user]);

  const { data: teacherDocs, isLoading: isLoadingTeacher } = useCollection(teacherIdQuery);
  const teacher = teacherDocs?.[0];

  const studentRequestsQuery = useMemoFirebase(() => {
    if (!teacher) return null;
    return query(
      collection(firestore, 'users'), 
      where('role', '==', 'student'),
      where('teacherId', '==', teacher.id),
      where('isApproved', '==', false)
    );
  }, [firestore, teacher]);

  const enrolledStudentsQuery = useMemoFirebase(() => {
    if (!teacher) return null;
    return query(
      collection(firestore, 'users'),
      where('role', '==', 'student'),
      where('teacherId', '==', teacher.id),
      where('isApproved', '==', true)
    );
  }, [firestore, teacher]);

  const { data: studentRequests, isLoading: isLoadingRequests } = useCollection<StudentProfile>(studentRequestsQuery);
  const { data: enrolledStudents, isLoading: isLoadingEnrolled } = useCollection<StudentProfile>(enrolledStudentsQuery);

  const handleApprove = (student: StudentProfile) => {
    if (!firestore || !student.id) return;
    const studentDocRef = doc(firestore, 'users', student.id);
    updateDocumentNonBlocking(studentDocRef, { isApproved: true });
  };
  
  const handleDeny = async (student: StudentProfile) => {
    if (!firestore || !student.id) return;
    // Denying means they are no longer linked to this teacher.
    const studentDocRef = doc(firestore, 'users', student.id);
    updateDocumentNonBlocking(studentDocRef, { teacherId: null });
  };
  
  const handleRemove = (student: StudentProfile) => {
    if (!firestore || !student.id) return;
    const studentDocRef = doc(firestore, 'users', student.id);
    // Removing sets them back to being un-enrolled from this teacher.
    updateDocumentNonBlocking(studentDocRef, { teacherId: null, isApproved: false });
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Teacher Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingEnrolled ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{enrolledStudents?.length || 0}</div>}
            <p className="text-xs text-muted-foreground">Total active students</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingRequests ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold text-accent">{studentRequests?.length || 0}</div>}
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects Taught</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherData.subjects.length}</div>
            <p className="text-xs text-muted-foreground">Across all classes</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Code</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoadingTeacher ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold"><Badge variant="secondary">{teacher?.id}</Badge></div>}
            <p className="text-xs text-muted-foreground">Share this with your students</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Student Enrollment Requests */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Enrollment Requests</CardTitle>
                <CardDescription>Approve or deny new student requests.</CardDescription>
            </div>
            <Button size="sm" variant="outline">View All</Button>
          </CardHeader>
          <CardContent>
            {isLoadingRequests && <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>}
            {studentRequests && studentRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentRequests.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={student.avatarUrl} />
                          <AvatarFallback>{student.name?.charAt(0) || 'S'}</AvatarFallback>
                        </Avatar>
                        {student.name}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button onClick={() => handleApprove(student)} variant="outline" size="icon" className="h-8 w-8 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleDeny(student)} variant="outline" size="icon" className="h-8 w-8 text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700">
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : !isLoadingRequests && (
              <p className="text-sm text-center text-muted-foreground py-4">No pending requests.</p>
            )}
          </CardContent>
        </Card>

        {/* Content Management */}
        <Card className="shadow-sm">
          <CardHeader  className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Content Management</CardTitle>
                <CardDescription>Upload and manage study materials for your students.</CardDescription>
            </div>
            <Button size="sm"><UploadCloud className="mr-2 h-4 w-4" /> Upload New</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-dashed border-2 rounded-lg p-8 text-center text-muted-foreground">
                <UploadCloud className="mx-auto h-12 w-12" />
                <p className="mt-2">No recent uploads</p>
                <p className="text-xs">Start by uploading notes, DPPs, or tests.</p>
            </div>
          </CardContent>
        </Card>
      </div>

       {/* Enrolled Students Table */}
       <Card>
          <CardHeader>
            <CardTitle>My Students</CardTitle>
            <CardDescription>Manage grades and attendance for enrolled students.</CardDescription>
          </CardHeader>
          <CardContent>
           {isLoadingEnrolled && <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>}
           {enrolledStudents && enrolledStudents.length > 0 ? (
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Overall Grade</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolledStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium flex items-center gap-3">
                         <Avatar>
                          <AvatarImage src={student.avatarUrl} />
                          <AvatarFallback>{student.name?.charAt(0) || 'S'}</AvatarFallback>
                        </Avatar>
                        {student.name}
                      </TableCell>
                      <TableCell><Badge variant="secondary">{student.grade || 'N/A'}</Badge></TableCell>
                      <TableCell>{student.attendance || 100}%</TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Profile</DropdownMenuItem>
                              <DropdownMenuItem>Enter Marks</DropdownMenuItem>
                              <DropdownMenuItem>Mark Attendance</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRemove(student)} className="text-red-600 focus:bg-red-50 focus:text-red-700">Remove Student</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : !isLoadingEnrolled && (
              <p className="text-sm text-center text-muted-foreground py-8">No students enrolled yet.</p>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

    