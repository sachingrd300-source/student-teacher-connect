'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { studentData } from '@/lib/data';
import { PerformanceChart } from '@/components/performance-chart';
import {
  FileText,
  ClipboardList,
  Pencil,
  CheckCircle,
  XCircle,
  Download,
  BookOpen,
  BarChart3,
  CalendarCheck2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const materialIcons = {
  Notes: <FileText className="h-5 w-5 text-blue-500" />,
  DPP: <ClipboardList className="h-5 w-5 text-orange-500" />,
  Test: <Pencil className="h-5 w-5 text-purple-500" />,
  Solution: <CheckCircle className="h-5 w-5 text-green-500" />,
};

export default function StudentDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [teacherCode, setTeacherCode] = useState('');
  const [isConnected, setIsConnected] = useState(studentData.isConnected);


  const handleEnrollmentRequest = async () => {
    if (!user || !firestore || !teacherCode) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid teacher code.' });
        return;
    }
    
    // In a real app, you might query the 'teachers' collection by 'id'
    const teacherDocRef = doc(firestore, 'teachers', teacherCode);
    const teacherDoc = await getDoc(teacherDocRef);

    if (!teacherDoc.exists()) {
      toast({ variant: 'destructive', title: 'Invalid Code', description: 'No teacher found with that code.' });
      return;
    }
    
    const studentUserDocRef = doc(firestore, 'users', user.uid);
    updateDocumentNonBlocking(studentUserDocRef, {
        teacherId: teacherCode,
        isApproved: false, // Teacher must approve
    });

    toast({ title: 'Request Sent!', description: "Your enrollment request has been sent to the teacher for approval."});
    // You might want to update local state to show "Pending Approval"
  }


  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Enroll with a Teacher</CardTitle>
            <CardDescription>Enter your teacher's verification code to access all features.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                <Input placeholder="Teacher Verification Code" value={teacherCode} onChange={(e) => setTeacherCode(e.target.value)} />
                <Button className="w-full" onClick={handleEnrollmentRequest}>
                    Send Enrollment Request
                </Button>
            </div>
          </CardContent>
           <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">You can still access free study materials while you wait for approval.</p>
           </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Welcome back, {studentData.name}!</h1>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
            <CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentData.stats.attendance}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New DPPs</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{studentData.stats.newDpps}</div>
            <p className="text-xs text-muted-foreground">Ready for practice</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentData.stats.pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">Due this week</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materials"><BookOpen className="w-4 h-4 mr-2" />Study Materials</TabsTrigger>
          <TabsTrigger value="performance"><BarChart3 className="w-4 h-4 mr-2" />Performance</TabsTrigger>
          <TabsTrigger value="attendance"><CalendarCheck2 className="w-4 h-4 mr-2" />Attendance</TabsTrigger>
        </TabsList>
        <TabsContent value="materials">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Study Materials</CardTitle>
              <CardDescription>Browse and download notes, DPPs, tests, and more.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentData.studyMaterials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{materialIcons[material.type]}</TableCell>
                      <TableCell>
                        <div className="font-medium">{material.title}</div>
                        <div className="text-sm text-muted-foreground">{material.date}</div>
                      </TableCell>
                      <TableCell><Badge variant={material.isNew ? "default" : "secondary"} className={material.isNew ? "bg-accent text-accent-foreground" : ""}>{material.subject}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="performance">
          <PerformanceChart data={studentData.performance} />
        </TabsContent>
        <TabsContent value="attendance">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Attendance Record</CardTitle>
              <CardDescription>Your attendance for the last few classes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentData.attendanceRecords.map((record) => (
                    <TableRow key={record.date}>
                      <TableCell className="font-medium">{record.date}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={record.status === 'Present' ? 'default' : 'destructive'}>
                          {record.status === 'Present' ? <CheckCircle className="h-4 w-4 mr-2"/> : <XCircle className="h-4 w-4 mr-2"/>}
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    