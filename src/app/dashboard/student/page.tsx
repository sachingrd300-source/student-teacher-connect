
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { studentData, teacherData } from '@/lib/data';
import { ConnectTeacherForm } from '@/components/connect-teacher-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpenCheck, ClipboardList, ShoppingCart, CalendarDays } from 'lucide-react';
import { useUser } from '@/firebase';

export default function StudentDashboardPage() {
  const [teacherConnected, setTeacherConnected] = useState(false);
  const { user, isUserLoading } = useUser();

  const handleConnectionSuccess = () => {
    setTeacherConnected(true);
  };
  
  const currentData = teacherConnected ? teacherData : studentData;

  const quickAccessItems = [
    { href: '/dashboard/student/schedule', icon: CalendarDays, title: 'Schedule', description: 'View upcoming classes.', requireAuth: true },
    { href: '/dashboard/student/study-material', icon: BookOpenCheck, title: 'Study Material', description: 'Notes, videos, and more.', requireAuth: false },
    { href: '/dashboard/student/daily-practice', icon: ClipboardList, title: 'Daily Practice', description: 'DPPs and assignments.', requireAuth: false },
    { href: '/dashboard/student/shop', icon: ShoppingCart, title: 'Shop', description: 'Books and courses.', requireAuth: false },
  ];

  // If a user is logged in, show all items. Otherwise, only show items that don't require authentication.
  const displayedItems = user ? quickAccessItems : quickAccessItems.filter(item => !item.requireAuth);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-headline">
          {user ? `Welcome back, ${user.displayName || studentData.name}!` : 'Welcome!'}
        </h1>
        {/* Only show the connection form if the user is NOT logged in and we are NOT loading user data */}
        {!isUserLoading && !user && (
            <Card className="w-full max-w-md">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Connect with a Teacher</CardTitle>
                    <CardDescription className="text-sm">Enter a teacher's code to view their materials.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ConnectTeacherForm onConnectionSuccess={handleConnectionSuccess} />
                </CardContent>
            </Card>
        )}
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
          <CardDescription>Jump to your resources.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedItems.map((item) => (
            <Link href={item.href} key={item.href}>
              <Card className="hover:bg-muted/50 transition-colors h-full">
                <CardHeader className="flex-row items-center gap-4">
                  <item.icon className="w-8 h-8 text-primary" />
                  <div>
                    <CardTitle>{item.title}</CardTitle>

                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </CardContent>
       </Card>

      {user && teacherConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Teacher Connected!</CardTitle>
            <CardDescription>You are now viewing materials and updates from {teacherData.name}. Explore your dashboard to see what's new.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/tutor/${teacherData.id}`}>
              <Button>View Teacher's Profile <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
