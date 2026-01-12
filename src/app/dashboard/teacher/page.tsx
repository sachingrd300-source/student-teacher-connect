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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserCheck,
  Users2,
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
} from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { CreateClassDialog } from '@/components/create-class-dialog';
import React from 'react';

type UserProfile = {
  id: string;
  name: string;
  role: string;
  status: 'pending_verification' | 'approved';
  subjects?: string[];
  classLevels?: string[];
  avatarUrl?: string;
};

type Class = {
    id: string;
    subject: string;
    classLevel: string;
    classCode: string;
    teacherId: string;
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

  const userProfileQuery = React.useMemo(() => {
    if(!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileQuery);

  const classesQuery = React.useMemo(() => {
    if(!firestore || !user) return null;
    return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid));
  }, [firestore, user]);
  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesQuery);

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
            <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold"><Badge variant={userProfile?.status === 'approved' ? 'default' : 'secondary'}>{userProfile?.status === 'approved' ? 'Approved' : 'Pending'}</Badge></div>
            <p className="text-xs text-muted-foreground">Your tutor profile status</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Status</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold"><Badge variant="secondary">Public</Badge></div>
            <p className="text-xs text-muted-foreground">Your classes materials can be viewed by all students</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
         <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Classes</CardTitle>
              <CardDescription>Manage your classes and share codes with students.</CardDescription>
            </div>
            <CreateClassDialog userProfile={userProfile} />
          </CardHeader>
          <CardContent>
           {isLoadingClasses && <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>}
           {classes && classes.length > 0 ? (
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Class Code</TableHead>
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
    </div>
  );
}
