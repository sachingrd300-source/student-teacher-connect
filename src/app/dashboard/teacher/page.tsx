'use client';

import { useEffect, useState, useMemo } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  Users2,
  PlusCircle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { teacherData } from '@/lib/data';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type StudentProfile = {
  id: string; 
  name: string;
  avatarUrl?: string; 
  grade?: string; 
  attendance?: number; 
  batch?: string;
  email?: string;
  subject?: string;
  address?: string;
  mobileNumber?: string;
  createdAt?: Date;
};

type Enrollment = {
    id: string;
    studentId: string;
    studentName?: string;
    studentAvatar?: string;
    teacherId: string;
    status: 'pending' | 'approved' | 'denied';
}

function StudentRequestRow({ enrollment, onUpdate }: { enrollment: Enrollment, onUpdate: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleApprove = async () => {
        if (!firestore) return;
        const enrollmentRef = doc(firestore, 'enrollments', enrollment.id);
        await updateDoc(enrollmentRef, { status: 'approved' });
        toast({ title: 'Student Approved', description: `${enrollment.studentName} is now enrolled.`});
        onUpdate();
    };

    const handleDeny = async () => {
        if (!firestore) return;
        const enrollmentRef = doc(firestore, 'enrollments', enrollment.id);
        await updateDoc(enrollmentRef, { status: 'denied' });
        toast({ variant: 'destructive', title: 'Request Denied', description: 'The enrollment request has been denied.'});
        onUpdate();
    };

    return (
        <TableRow>
            <TableCell className="font-medium flex items-center gap-3">
            <Avatar>
                <AvatarImage src={enrollment.studentAvatar} />
                <AvatarFallback>{enrollment.studentName?.charAt(0) || 'S'}</AvatarFallback>
            </Avatar>
            {enrollment.studentName}
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

export default function TeacherDashboardPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [isAddStudentOpen, setAddStudentOpen] = useState(false);
  
  const [newStudentData, setNewStudentData] = useState({
    name: '',
    email: '',
    grade: '',
    subject: '',
    address: '',
    mobileNumber: '',
    batch: '',
  });

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'enrollments'), where('teacherId', '==', user.uid));
  }, [firestore, user]);

  const { data: enrollments, isLoading: isLoadingEnrollments } = useCollection<Enrollment>(enrollmentsQuery);

  const studentRequests = useMemo(() => enrollments?.filter(e => e.status === 'pending') || [], [enrollments]);
  const enrolledStudents = useMemo(() => enrollments?.filter(e => e.status === 'approved') || [], [enrollments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewStudentData(prev => ({ ...prev, [id]: value }));
  };

   const handleSelectChange = (id: string, value: string) => {
    setNewStudentData(prev => ({ ...prev, [id]: value }));
  };

  const handleAddStudent = () => {
    if (!newStudentData.name || !newStudentData.email || !firestore || !user) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please enter at least a name and email for the student.' });
        return;
    }
    
    // In a real app you might create a proper user for the student first
    // For now, we just create the enrollment and user profile doc
    const studentId = `manual-${Date.now()}`;
    const studentProfileRef = doc(firestore, 'users', studentId);
    const enrollmentRef = collection(firestore, 'enrollments');
    
    const studentProfileData = {
        name: newStudentData.name,
        email: newStudentData.email,
        role: 'student',
        id: studentId,
        avatarUrl: `https://picsum.photos/seed/${newStudentData.name.replace(/\s/g, '')}/40/40`,
        // other fields...
    };

    const enrollmentData = {
        studentId: studentId,
        studentName: newStudentData.name,
        studentAvatar: studentProfileData.avatarUrl,
        teacherId: user.uid,
        status: 'approved'
    };

    // We don't use the non-blocking here as we want to give feedback
    addDocumentNonBlocking(enrollmentRef, enrollmentData);
    // You would also set the studentProfileData in a 'users' collection

    toast({ title: 'Student Added', description: `${newStudentData.name} has been added to your roster.` });
    
    setNewStudentData({
        name: '', email: '', grade: '', subject: '', address: '', mobileNumber: '', batch: '',
    });
    setAddStudentOpen(false);
  };
  
  const handleRemove = async (enrollmentId: string) => {
    if (!firestore) return;
    const enrollmentRef = doc(firestore, 'enrollments', enrollmentId);
    await updateDoc(enrollmentRef, { status: 'denied' }); // or delete
    toast({ title: 'Student Removed', description: 'The student has been unenrolled.'})
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
            {isLoadingEnrollments ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{enrolledStudents?.length || 0}</div>}
            <p className="text-xs text-muted-foreground">Total active students</p>
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
            <CardTitle className="text-sm font-medium">Your Batches</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoadingEnrollments ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{teacherData.batches.length}</div>}
            <p className="text-xs text-muted-foreground">Total student groups</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Code</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {user ? <div className="text-xl font-bold"><Badge variant="secondary">{user.uid}</Badge></div> : <Skeleton className="h-8 w-24" />}
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
            {isLoadingEnrollments && <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>}
            {studentRequests && studentRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentRequests.map((enrollment) => (
                    <StudentRequestRow key={enrollment.id} enrollment={enrollment} onUpdate={() => {}} />
                  ))}
                </TableBody>
              </Table>
            ) : !isLoadingEnrollments && (
              <p className="text-sm text-center text-muted-foreground py-4">No pending requests.</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump to common tasks.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
              <Button variant="outline" asChild><Link href="/dashboard/teacher/schedule">Manage Schedule</Link></Button>
              <Button variant="outline" asChild><Link href="/dashboard/teacher/materials">Upload Materials</Link></Button>
              <Button variant="outline" asChild><Link href="/dashboard/teacher/attendance">Take Attendance</Link></Button>
              <Button variant="outline" asChild><Link href="/dashboard/teacher/performance">Enter Marks</Link></Button>
          </CardContent>
        </Card>
      </div>

       {/* Enrolled Students Table */}
       <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Students</CardTitle>
              <CardDescription>Manage grades and attendance for enrolled students.</CardDescription>
            </div>
             <Dialog open={isAddStudentOpen} onOpenChange={setAddStudentOpen}>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Student</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                        <DialogDescription>Enter the student's details to add them to your roster.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Student Name*</Label>
                            <Input id="name" value={newStudentData.name} onChange={handleInputChange} placeholder="e.g., John Smith" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Student Email*</Label>
                            <Input id="email" type="email" value={newStudentData.email} onChange={handleInputChange} placeholder="e.g., john.smith@example.com" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="grade">Class/Grade</Label>
                            <Input id="grade" value={newStudentData.grade} onChange={handleInputChange} placeholder="e.g., 10th Grade" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                             <Select onValueChange={(value) => handleSelectChange('subject', value)} value={newStudentData.subject}>
                                <SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger>
                                <SelectContent>
                                    {teacherData.subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="batch">Batch</Label>
                             <Select onValueChange={(value) => handleSelectChange('batch', value)} value={newStudentData.batch}>
                                <SelectTrigger><SelectValue placeholder="Select a batch" /></SelectTrigger>
                                <SelectContent>
                                    {teacherData.batches.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="mobileNumber">Mobile Number</Label>
                            <Input id="mobileNumber" type="tel" value={newStudentData.mobileNumber} onChange={handleInputChange} placeholder="e.g., 123-456-7890" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" value={newStudentData.address} onChange={handleInputChange} placeholder="Student's address" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddStudent}>Add Student</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
           {isLoadingEnrollments && <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>}
           {enrolledStudents && enrolledStudents.length > 0 ? (
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolledStudents.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium flex items-center gap-3">
                         <Avatar>
                          <AvatarImage src={enrollment.studentAvatar} />
                          <AvatarFallback>{enrollment.studentName?.charAt(0) || 'S'}</AvatarFallback>
                        </Avatar>
                        {enrollment.studentName}
                      </TableCell>
                       <TableCell>
                        <Badge variant="default">{enrollment.status}</Badge>
                       </TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/teacher/student/${enrollment.studentId}`}>View Profile</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/teacher/performance?studentId=${enrollment.studentId}`}>Enter Marks</Link>
                              </DropdownMenuItem>
                               <DropdownMenuItem asChild>
                                <Link href={`/dashboard/teacher/attendance`}>Mark Attendance</Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleRemove(enrollment.id)} className="text-red-600 focus:bg-red-50 focus:text-red-700">Remove Student</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : !isLoadingEnrollments && (
              <p className="text-sm text-center text-muted-foreground py-8">No students enrolled yet.</p>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
