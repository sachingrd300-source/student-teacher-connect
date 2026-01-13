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
  BookOpenCheck,
  ClipboardCheck,
  BarChart3,
  CalendarDays,
  ShoppingCart,
  PlusCircle,
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
import {
  collection,
  query,
  where,
  doc,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import React, { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, Star } from 'lucide-react';


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
  createdAt: { toDate: () => Date };
};

type Enrollment = {
  classId: string;
  status: 'approved' | 'pending' | 'denied';
};

const quickActions = [
  { href: '/dashboard/teacher/materials', label: 'Upload Materials', icon: BookOpenCheck },
  { href: '/dashboard/teacher/my-shop', label: 'Manage My Shop', icon: ShoppingCart },
  { href: '/dashboard/teacher/performance', label: 'Enter Marks', icon: BarChart3 },
  { href: '/dashboard/teacher/schedule', label: 'Manage Schedule', icon: CalendarDays },
];

function PendingVerificationCard() {
  return (
    <Card className="bg-amber-50 border-amber-200 shadow-soft-shadow">
      <CardHeader className="flex-row items-center gap-4">
        <Info className="h-8 w-8 text-amber-600" />
        <div>
          <CardTitle className="text-xl text-amber-800">
            Profile Under Verification
          </CardTitle>
          <CardDescription className="text-amber-700">
            Your profile has been submitted and is currently being reviewed by
            the admin. You will be notified once it is approved.
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}

export default function TeacherDashboardPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [isCreateClassOpen, setCreateClassOpen] = useState(false);
  const [newClassData, setNewClassData] = useState({
    subject: '',
    classLevel: '',
    batchTime: '',
  });

  const userProfileQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isLoadingProfile } =
    useDoc<UserProfile>(userProfileQuery);

  const classesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'classes'), where('teacherId', '==', user.uid));
  }, [firestore, user]);
  const { data: classes, isLoading: isLoadingClasses } =
    useCollection<Class>(classesQuery);

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'enrollments'),
      where('teacherId', '==', user.uid),
      where('status', '==', 'approved')
    );
  }, [firestore, user]);
  const { data: enrollments, isLoading: isLoadingEnrollments } =
    useCollection<Enrollment>(enrollmentsQuery);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleCreateClass = async () => {
    if (!newClassData.subject || !newClassData.classLevel || !firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a subject and class level.',
      });
      return;
    }

    const classCode = `${newClassData.subject
      .substring(0, 4)
      .toUpperCase()}${newClassData.classLevel.replace(/\s/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const classData = {
      ...newClassData,
      teacherId: user.uid,
      classCode,
      createdAt: serverTimestamp(),
    };

    const classesCollection = collection(firestore, 'classes');
    await addDocumentNonBlocking(classesCollection, classData);

    toast({
      title: 'Class Created!',
      description: `Your new class code is ${classCode}. Share it with your students.`,
    });
    setCreateClassOpen(false);
    setNewClassData({ subject: '', classLevel: '', batchTime: '' });
  };

  const isLoading = isLoadingProfile || isLoadingClasses || isLoadingEnrollments;

  if (isLoadingProfile || !userProfile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (userProfile?.status === 'pending_verification') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline">{`${getGreeting()}, ${
          userProfile.name
        }! 👋`}</h1>
        <PendingVerificationCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">{`${getGreeting()}, ${
          userProfile.name
        }! 👋`}</h1>
        <p className="text-muted-foreground">
          Here's a quick overview of your teaching dashboard.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-soft-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Classes</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingClasses ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{classes?.length || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total created classes
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-soft-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingEnrollments ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">
                {enrollments?.length || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Across all your classes
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-soft-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              <Badge
                variant={
                  userProfile?.status === 'approved' ? 'default' : 'secondary'
                }
              >
                {userProfile?.status === 'approved' ? 'Approved' : 'Pending'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Your tutor profile status
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-soft-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Status</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              <Badge variant="secondary">Public</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Your classes materials can be viewed by all students
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-soft-shadow">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Jump to your most common tasks with a single click.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.href}
                variant="outline"
                asChild
                className="h-20 flex-col gap-2 text-base shadow-soft-shadow active:scale-95 transition-transform"
              >
                <Link href={action.href}>
                  <action.icon className="h-6 w-6 text-primary" />
                  {action.label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-soft-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Classes</CardTitle>
              <CardDescription>
                Manage your classes and share codes with students.
              </CardDescription>
            </div>
            <Dialog open={isCreateClassOpen} onOpenChange={setCreateClassOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Class
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>Create a New Class</DialogTitle>
                  <DialogDescription>
                    Select a subject and level to generate a unique class code.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select
                      onValueChange={(value) =>
                        setNewClassData((p) => ({ ...p, subject: value }))
                      }
                      value={newClassData.subject}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {userProfile?.subjects?.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classLevel">Class/Level</Label>
                    <Select
                      onValueChange={(value) =>
                        setNewClassData((p) => ({ ...p, classLevel: value }))
                      }
                      value={newClassData.classLevel}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class level" />
                      </SelectTrigger>
                      <SelectContent>
                        {userProfile?.classLevels?.map((cl) => (
                          <SelectItem key={cl} value={cl}>
                            {cl}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batchTime">Batch Time</Label>
                    <Input
                      id="batchTime"
                      type="time"
                      value={newClassData.batchTime}
                      onChange={(e) =>
                        setNewClassData((p) => ({
                          ...p,
                          batchTime: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateClass}>Generate Code</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
            {classes && classes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Created On</TableHead>
                    <TableHead>Class Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((cls) => {
                    const studentCount =
                      enrollments?.filter((e) => e.classId === cls.id).length ||
                      0;
                    return (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">
                          {cls.subject} - {cls.classLevel}
                        </TableCell>
                        <TableCell>{studentCount}</TableCell>
                        <TableCell>
                          {cls.createdAt?.toDate().toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{cls.classCode}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                navigator.clipboard.writeText(cls.classCode);
                                toast({
                                  title: 'Copied! 👍',
                                  description: 'Class code copied to clipboard.',
                                });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : !isLoading && (
              <div className="text-sm text-center text-muted-foreground py-8">
                You haven't created any classes yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
