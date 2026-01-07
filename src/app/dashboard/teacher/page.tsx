
'use client';

import { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users,
  Check,
  X,
  MoreVertical,
  Calendar,
  UserCheck,
  PlusCircle,
  Users2,
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';


type StudentProfile = {
  id: string; 
  name: string;
  isApproved: boolean;
  teacherId: string | null;
  avatarUrl: string; 
  grade?: string; 
  attendance?: number; 
  batch?: string;
};

type Batch = {
  id: string;
  name: string;
  teacherId: string;
}


export default function TeacherDashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAddStudentOpen, setAddStudentOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentMobile, setNewStudentMobile] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [isCreateBatchOpen, setCreateBatchOpen] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


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

  const batchesQuery = useMemoFirebase(() => {
    if(!teacher) return null;
    return query(collection(firestore, 'batches'), where('teacherId', '==', teacher.id));
  }, [firestore, teacher]);

  const { data: studentRequests, isLoading: isLoadingRequests } = useCollection<StudentProfile>(studentRequestsQuery);
  const { data: enrolledStudents, isLoading: isLoadingEnrolled } = useCollection<StudentProfile>(enrolledStudentsQuery);
  const { data: batches, isLoading: isLoadingBatches } = useCollection<Batch>(batchesQuery);


  const handleApprove = (student: StudentProfile) => {
    if (!firestore || !student.id) return;
    // student.id from the 'users' collection is the userId
    const studentUserDocRef = doc(firestore, 'users', student.id);
    updateDocumentNonBlocking(studentUserDocRef, { isApproved: true });
    toast({ title: "Student Approved", description: `${student.name} has been enrolled.` });
  };
  
  const handleDeny = async (student: StudentProfile) => {
    if (!firestore || !student.id) return;
    const studentUserDocRef = doc(firestore, 'users', student.id);
    updateDocumentNonBlocking(studentUserDocRef, { teacherId: null, isApproved: false });
    toast({ variant: "destructive", title: "Student Denied", description: `${student.name}'s request has been denied.` });
  };
  
  const handleRemove = (student: StudentProfile) => {
    if (!firestore || !student.id) return;
    const studentUserDocRef = doc(firestore, 'users', student.id);
    updateDocumentNonBlocking(studentUserDocRef, { teacherId: null, isApproved: false, batch: null });
    toast({ variant: "destructive", title: "Student Removed", description: `${student.name} has been removed from your roster.` });
  };

  const handleCreateBatch = async () => {
    if (!firestore || !teacher || !newBatchName) return;
    const batchId = uuidv4(); // Generate a single unique ID
    const batchRef = doc(firestore, 'batches', batchId);
    
    // Use the SAME ID for the document path and the 'id' field inside the document
    setDocumentNonBlocking(batchRef, {
      id: batchId,
      name: newBatchName,
      teacherId: teacher.id,
    }, { merge: false });

    toast({ title: "Batch Created!", description: `Batch "${newBatchName}" has been successfully created.` });
    setNewBatchName('');
    setCreateBatchOpen(false);
  }

  const handleAddStudent = async () => {
    if (!firestore || !teacher || !newStudentName || !newStudentMobile) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all student details.' });
      return;
    }
    
    const studentUserId = `manual-${newStudentMobile}`;
    const email = `${newStudentMobile}@edconnect.pro`;

    const userDocRef = doc(firestore, 'users', studentUserId);
    const userData = {
      id: studentUserId,
      name: newStudentName,
      mobileNumber: newStudentMobile,
      email: email,
      role: 'student',
      isApproved: true, 
      teacherId: teacher.id,
      batch: selectedBatch || null,
      avatarUrl: `https://picsum.photos/seed/${studentUserId}/40/40`,
    };
    
    setDocumentNonBlocking(userDocRef, userData, { merge: false });

    toast({ title: 'Student Added', description: `${newStudentName} has been added to your roster.`});
    setNewStudentName('');
    setNewStudentMobile('');
    setSelectedBatch('');
    setAddStudentOpen(false);
  }


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
            <CardTitle className="text-sm font-medium">Your Batches</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoadingBatches ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{batches?.length || 0}</div>}
            <p className="text-xs text-muted-foreground">Total student groups</p>
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

        {/* Batch and Student Management */}
        <Card className="shadow-sm">
          <CardHeader  className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Class Management</CardTitle>
                <CardDescription>Create batches and add new students.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex gap-4">
              {isClient ? (<>
                <Dialog open={isCreateBatchOpen} onOpenChange={setCreateBatchOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full"><Users2 className="mr-2 h-4 w-4" /> Create Batch</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New Batch</DialogTitle>
                      <DialogDescription>
                        Create a new batch to organize your students.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="batch-name" className="text-right">
                          Batch Name
                        </Label>
                        <Input id="batch-name" value={newBatchName} onChange={(e) => setNewBatchName(e.target.value)} className="col-span-3" placeholder="e.g. Morning Physics" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateBatch}>Create Batch</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={isAddStudentOpen} onOpenChange={setAddStudentOpen}>
                  <DialogTrigger asChild>
                      <Button className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Add Student</Button>
                  </DialogTrigger>
                   <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Student</DialogTitle>
                      <DialogDescription>
                        Manually add a new student to your roster and assign them to a batch.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="student-name" className="text-right">Name</Label>
                        <Input id="student-name" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} className="col-span-3" placeholder="Student's full name" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="student-mobile" className="text-right">Mobile</Label>
                        <Input id="student-mobile" value={newStudentMobile} onChange={(e) => setNewStudentMobile(e.target.value)} className="col-span-3" placeholder="Student's mobile number" />
                      </div>
                       <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="batch-select" className="text-right">Batch</Label>
                          <Select onValueChange={setSelectedBatch} value={selectedBatch}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Assign to a batch" />
                            </SelectTrigger>
                            <SelectContent>
                              {isLoadingBatches && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                              {batches?.map(batch => (
                                <SelectItem key={batch.id} value={batch.name}>{batch.name}</SelectItem>
                              ))}
                               {batches?.length === 0 && !isLoadingBatches && <p className="p-2 text-xs text-muted-foreground">No batches created yet.</p>}
                            </SelectContent>
                          </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddStudent}>Add Student</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>) : (
                <>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </>
              )}
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
                    <TableHead>Batch</TableHead>
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
                       <TableCell><Badge variant="outline">{student.batch || 'N/A'}</Badge></TableCell>
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
