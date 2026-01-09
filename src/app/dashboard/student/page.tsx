
'use client';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, User as UserIcon, BookOpenCheck, ClipboardList } from 'lucide-react';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function StudentDashboardPage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          {user ? `Welcome back, ${user.displayName || 'Student'}!` : 'Student Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          Explore free learning resources from all our expert tutors.
        </p>
      </div>

      {user ? (
         <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <BookOpenCheck className="w-6 h-6 text-primary" />
                        Study Materials
                    </CardTitle>
                    <CardDescription>
                        Browse free notes, question banks, and more from all our expert tutors.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/dashboard/student/study-material">
                            View All Materials <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <ClipboardList className="w-6 h-6 text-primary" />
                        Daily Practice
                    </CardTitle>
                    <CardDescription>
                       Access free daily practice papers (DPPs) uploaded by tutors to stay sharp.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/dashboard/student/daily-practice">
                            Go to Practice <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      ) : (
        <Card className="text-center">
          <CardHeader>
            <UserIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle>Log In to View Your Dashboard</CardTitle>
            <CardDescription>
              To access learning content, please log in or create an account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login-student">Log In / Sign Up</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
