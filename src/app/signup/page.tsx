
'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { School, User, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SignupPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40">
        <div className="w-full max-w-md p-4 sm:p-0">
         <div className="text-center mb-6">
             <Link href="/" className="inline-block">
              <School className="w-12 h-12 mx-auto text-primary" />
            </Link>
            <h1 className="text-3xl font-bold font-serif text-foreground mt-2">Join EduConnect Pro</h1>
            <p className="text-muted-foreground">Choose your role to get started.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="flex flex-col text-center items-center justify-between hover:border-primary transition-all">
                 <CardHeader>
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <User className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>I'm a Student</CardTitle>
                    <CardDescription>
                        Find tutors, join classes, and connect with other learners.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/signup/student">
                        <Button className="w-full">Sign Up as a Student</Button>
                    </Link>
                </CardContent>
            </Card>
            <Card className="flex flex-col text-center items-center justify-between hover:border-primary transition-all">
                <CardHeader>
                     <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <UserCheck className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>I'm a Teacher</CardTitle>
                    <CardDescription>
                        Manage your classes, track attendance, and engage with your students.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/signup/teacher">
                        <Button className="w-full">Sign Up as a Teacher</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
         <div className="mt-6 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline font-semibold">
              Login
            </Link>
          </div>
      </div>
    </div>
  );
}
