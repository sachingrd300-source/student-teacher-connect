
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { studentData } from '@/lib/data';
import { ConnectTeacherForm } from '@/components/connect-teacher-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpenCheck, ClipboardList, ShoppingCart } from 'lucide-react';

export default function StudentDashboardPage() {
  const [isConnected, setIsConnected] = useState(false);

  const handleConnectionSuccess = () => {
    setIsConnected(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-headline">Welcome back, {studentData.name}!</h1>
        {!isConnected && (
            <Card className="w-full max-w-md">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Connect with a Teacher</CardTitle>
                    <CardDescription className="text-sm">Enter your teacher's code to view their profile and materials.</CardDescription>
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
          <Link href="/dashboard/student/study-material">
            <Card className="hover:bg-muted/50 transition-colors h-full">
              <CardHeader className="flex-row items-center gap-4">
                <BookOpenCheck className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle>Study Material</CardTitle>
                  <CardDescription>Notes, videos, and more.</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/dashboard/student/daily-practice">
            <Card className="hover:bg-muted/50 transition-colors h-full">
              <CardHeader className="flex-row items-center gap-4">
                <ClipboardList className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle>Daily Practice</CardTitle>
                  <CardDescription>DPPs and assignments.</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/dashboard/student/shop">
            <Card className="hover:bg-muted/50 transition-colors h-full">
              <CardHeader className="flex-row items-center gap-4">
                <ShoppingCart className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle>Shop</CardTitle>
                  <CardDescription>Books and courses.</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </CardContent>
       </Card>

      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Teacher Connected</CardTitle>
            <CardDescription>You can now access materials and updates from {teacherData.name}.</CardDescription>
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
