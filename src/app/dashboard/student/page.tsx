
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
import { ArrowRight, BookOpenCheck, CalendarDays, BarChart3, User } from 'lucide-react';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';

// Mocking connected teachers with detailed updates for a logged-in user
const connectedTeachers = [
    {
        ...tutorsData[0],
        latestMaterial: teacherData.studyMaterials[0],
        upcomingClass: teacherData.schedule[0],
        recentScore: teacherData.performance[teacherData.performance.length - 1],
    },
    {
        ...tutorsData[1],
        latestMaterial: { ...teacherData.studyMaterials[1], title: "Organic Chemistry Intro" },
        upcomingClass: { ...teacherData.schedule[1], subject: 'Chemistry' },
        recentScore: { name: "Quiz 2", score: 88 },
    }
];

export default function StudentDashboardPage() {
  const { user, isUserLoading } = useUser();
  const [hasConnections, setHasConnections] = useState(false);

  useEffect(() => {
    if (user) {
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">My Teachers</h2>
              <Button variant="outline" asChild>
                <Link href="#connect">Connect to New Teacher</Link>
              </Button>
            </div>
            <div className="grid gap-6 lg:grid-cols-1">
                {connectedTeachers.map(teacher => (
                    <Card key={teacher.id} className="hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                                <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-2xl font-headline">{teacher.name}</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary">{teacher.subjects.join(', ')}</Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-3">
                           <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2 text-muted-foreground"><BookOpenCheck className="h-5 w-5" />Latest Material</h4>
                                {teacher.latestMaterial ? (
                                    <div className="p-3 rounded-md bg-muted/50">
                                      <p className="font-medium truncate">{teacher.latestMaterial.title}</p>
                                      <p className="text-sm text-muted-foreground">{teacher.latestMaterial.subject} - {teacher.latestMaterial.type}</p>
                                    </div>
                                ) : <p className="text-sm text-muted-foreground">No new materials.</p>}
                           </div>
                           <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-5 w-5" />Upcoming Class</h4>
                                 {teacher.upcomingClass ? (
                                    <div className="p-3 rounded-md bg-muted/50">
                                      <p className="font-medium truncate">{teacher.upcomingClass.topic}</p>
                                      <p className="text-sm text-muted-foreground">{new Date(teacher.upcomingClass.date).toLocaleDateString()} at {teacher.upcomingClass.time}</p>
                                    </div>
                                ) : <p className="text-sm text-muted-foreground">No classes scheduled.</p>}
                           </div>
                           <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2 text-muted-foreground"><BarChart3 className="h-5 w-5" />Recent Score</h4>
                                 {teacher.recentScore ? (
                                    <div className="p-3 rounded-md bg-muted/50">
                                      <p className="font-medium truncate">{teacher.recentScore.name}</p>
                                      <p className="text-sm text-muted-foreground">Score: <span className="font-bold">{teacher.recentScore.score}/100</span></p>
                                    </div>
                                ) : <p className="text-sm text-muted-foreground">No recent scores.</p>}
                           </div>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full sm:w-auto ml-auto">
                                <Link href={`/dashboard/student/teacher/${teacher.id}`}>View All Updates <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
      )}

      {user && (
         <Card id="connect">
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
