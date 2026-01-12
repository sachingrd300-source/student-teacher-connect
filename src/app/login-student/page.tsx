'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { loginWithGoogle, loginWithEmail } from '@/firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';

export default function StudentLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please enter both email and password.',
      });
      return;
    }
    setIsLoading(true);
    try {
      await loginWithEmail(email, password);
      toast({
        title: 'Login Successful',
        description: "Welcome back! You're being redirected to your dashboard.",
      });
      router.push('/dashboard/student');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description:
          error.code === 'auth/invalid-credential'
            ? 'Invalid email or password.'
            : error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { user } = await loginWithGoogle();

      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            await setDoc(userDocRef, {
                id: user.uid,
                name: user.displayName,
                email: user.email,
                role: 'student',
                status: 'approved'
            });
        }
      }

      toast({
        title: 'Login Successful!',
        description: 'Welcome to EduConnect Pro.',
      });
      router.push('/dashboard/student');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem with Google Sign-In.',
      });
    }
  };

  return (
     <div className="relative flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
        <Image
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHx0ZWFjaGVyJTIwc3R1ZGVudHN8ZW58MHx8fHwxNzE4NzUyMzMxfDA&ixlib=rb-4.0.3&q=80&w=1080"
            alt="Students learning in a classroom"
            fill
            className="object-cover"
            data-ai-hint="teacher students"
        />
        <div className="absolute inset-0 bg-black/60 z-10"></div>

        <Card className="w-full max-w-md shadow-2xl z-20">
            <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
                <Icons.logo className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline">
                Student Login
            </CardTitle>
            <CardDescription>
                Access your learning dashboard.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                />
                </div>
            </div>
            <Button onClick={handleEmailLogin} className="mt-6 w-full" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                </span>
                </div>
            </div>
            <div className="grid grid-cols-1">
                <Button variant="outline" onClick={handleGoogleSignIn}>
                Google
                </Button>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                New to EduConnect?{' '}
                <Link
                href="/signup-student"
                className="font-semibold text-primary hover:underline"
                >
                Sign up
                </Link>
            </p>
            </CardContent>
        </Card>
    </div>
  );
}
