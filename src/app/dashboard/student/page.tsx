
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { studentData, teacherData, tutorsData } from '@/lib/data';
import { ConnectTeacherForm } from '@/components/connect-teacher-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpenCheck, ClipboardList, ShoppingCart, CalendarDays, User } from 'lucide-react';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Mocking connected teachers for a logged-in user
const connectedTeachers = [
    {
        ...tutorsData[0],
        updates: 3,
    },
    {
        ...tutorsData[1],
        updates: 1,
    }
];

export default function StudentDashboardPage() {
  const [teacherConnected, setTeacherConnected] = useState(false); // This can be deprecated or reworked
  const { user, isUserLoading } = useUser();
  const [hasConnections, setHasConnections] = useState(false);

  useEffect(() => {
    if (user) {
        // In a real app, you'd fetch the student's connections here.
        // We'll simulate this with a timeout.
        const timer = setTimeout(() => setHasConnections(true), 1000);
        return () => clearTimeout(timer);
    }
  }, [user]);


  const handleConnectionSuccess = () => {
    setHasConnections(true);
  };
  
  if (isUserLoading) {
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
          {user ? `Welcome back, ${user.displayName || studentData.name}!` : 'Student Dashboard'}
        </h1>
        <p className="text-muted-foreground">
            {user && hasConnections 
                ? "View updates from your connected teachers or connect with a new one."
                : "Connect with a teacher to get started."}
        </p>
      </div>

      {user && hasConnections && (
        <Card>
            <CardHeader>
                <CardTitle>My Teachers</CardTitle>
                <CardDescription>Select a teacher to view their materials and schedule.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
                {connectedTeachers.map(teacher => (
                    <Card key={teacher.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                                <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-xl">{teacher.name}</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary">{teacher.subjects.join(', ')}</Badge>
                                    {teacher.updates > 0 && <Badge variant="default">{teacher.updates} New Update{teacher.updates > 1 ? 's' : ''}</Badge>}
                                </div>
                            </div>
                        </CardHeader>
                        <CardFooter>
                            <Button asChild className="w-full">
                                <Link href={`/dashboard/student/teacher/${teacher.id}`}>View Updates <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </CardContent>
        </Card>
      )}

      {user && (
         <Card>
            <CardHeader>
                <CardTitle className="text-lg">Connect with a New Teacher</CardTitle>
                <CardDescription className="text-sm">Enter a teacher's unique code to send a connection request.</CardDescription>
            </CardHeader>
            <CardContent>
                <ConnectTeacherForm onConnectionSuccess={handleConnectionSuccess} />
            </CardContent>
        </Card>
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
