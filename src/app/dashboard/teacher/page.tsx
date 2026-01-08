
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
  ChevronDown,
  PlusCircle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { teacherData } from '@/lib/data';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

type StudentProfile = {
  id: string; 
  name: string;
  avatarUrl: string; 
  grade?: string; 
  attendance?: number; 
  batch?: string;
  email?: string;
};


export default function TeacherDashboardPage() {
  const { toast } = useToast();
  const [studentRequests, setStudentRequests] = useState<StudentProfile[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<StudentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddStudentOpen, setAddStudentOpen] = useState(false);
  
  // Add student form state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');

  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
      setStudentRequests(teacherData.studentRequests);
      setEnrolledStudents(teacherData.enrolledStudents);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleApprove = (studentId: string) => {
    const student = studentRequests.find(s => s.id === studentId);
    if (student) {
        setStudentRequests(prev => prev.filter(s => s.id !== studentId));
        setEnrolledStudents(prev => [...prev, {...student, grade: 'N/A', attendance: 100}]);
    }
  };
  
  const handleDeny = (studentId: string) => {
    setStudentRequests(prev => prev.filter(s => s.id !== studentId));
  };
  
  const handleRemove = (studentId: string) => {
    setEnrolledStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const handleAddStudent = () => {
    if (!newStudentName || !newStudentEmail) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please enter a name and email for the student.' });
        return;
    }

    const newStudent: StudentProfile = {
        id: `S${Date.now()}`,
        name: newStudentName,
        email: newStudentEmail,
        avatarUrl: `https://picsum.photos/seed/${newStudentName}/40/40`,
        grade: 'N/A',
        attendance: 100,
        batch: 'Morning'
    };

    setEnrolledStudents(prev => [newStudent, ...prev]);
    toast({ title: 'Student Added', description: `${newStudentName} has been added to your roster.` });
    
    // Reset form
    setNewStudentName('');
    setNewStudentEmail('');
    setAddStudentOpen(false);
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
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{enrolledStudents?.length || 0}</div>}
            <p className="text-xs text-muted-foreground">Total active students</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold text-accent">{studentRequests?.length || 0}</div>}
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Batches</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">2</div>}
            <p className="text-xs text-muted-foreground">Total student groups</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Code</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold"><Badge variant="secondary">{teacherData.id}</Badge></div>}
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
            {isLoading && <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>}
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
                        <Button onClick={() => handleApprove(student.id)} variant="outline" size="icon" className="h-8 w-8 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleDeny(student.id)} variant="outline" size="icon" className="h-8 w-8 text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700">
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : !isLoading && (
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                        <DialogDescription>Enter the student's details to add them to your roster.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-student-name">Student Name</Label>
                            <Input id="new-student-name" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} placeholder="e.g., John Smith" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-student-email">Student Email</Label>
                            <Input id="new-student-email" type="email" value={newStudentEmail} onChange={(e) => setNewStudentEmail(e.target.value)} placeholder="e.g., john.smith@example.com" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddStudent}>Add Student</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
           {isLoading && <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>}
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
                       <TableCell>
                        <Badge variant="outline">{student.batch || 'Morning'}</Badge>
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
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/teacher/student/${student.id}`}>View Profile</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/teacher/performance?studentId=${student.id}`}>Enter Marks</Link>
                              </DropdownMenuItem>
                               <DropdownMenuItem asChild>
                                <Link href={`/dashboard/teacher/attendance`}>Mark Attendance</Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleRemove(student.id)} className="text-red-600 focus:bg-red-50 focus:text-red-700">Remove Student</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : !isLoading && (
              <p className="text-sm text-center text-muted-foreground py-8">No students enrolled yet.</p>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

    
