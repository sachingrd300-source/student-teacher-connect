'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, School } from 'lucide-react';

export default function SignupSelectionPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 py-12">
        <div className="w-full max-w-2xl p-4 sm:p-0">
            <div className="text-center mb-8">
                <Link href="/" className="inline-block mb-4">
                    <School className="w-12 h-12 mx-auto text-primary" />
                </Link>
                <h1 className="text-3xl font-bold font-serif">Join Our Community</h1>
                <p className="text-muted-foreground">Choose your role to get started.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                    <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col text-center items-center p-4">
                        <CardHeader>
                            <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block">
                                <User className="h-8 w-8 text-primary" />
                            </div>
                            <CardTitle className="font-serif">I am a Student</CardTitle>
                            <CardDescription>Find teachers and enhance your learning.</CardDescription>
                        </CardHeader>
                        <CardContent className="w-full mt-auto">
                            <Link href="/signup/student" className="w-full">
                                <Button className="w-full">Sign up as Student</Button>
                            </Link>
                        </CardContent>
                    </Card>
                
                
                    <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col text-center items-center p-4">
                        <CardHeader>
                            <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block">
                                <School className="h-8 w-8 text-primary" />
                            </div>
                            <CardTitle className="font-serif">I am a Teacher</CardTitle>
                            <CardDescription>Create batches and manage your students.</CardDescription>
                        </CardHeader>
                        <CardContent className="w-full mt-auto">
                           <Link href="/signup/teacher" className="w-full">
                                <Button className="w-full">Sign up as Teacher</Button>
                           </Link>
                        </CardContent>
                    </Card>
                
            </div>
             <div className="mt-8 text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="underline font-semibold">
                    Login
                </Link>
            </div>
        </div>
    </div>
  );
}
