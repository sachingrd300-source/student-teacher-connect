'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { loginWithEmail, loginWithGoogle, getGoogleRedirectResult } from '@/firebase/auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setGoogleLoading] = useState(true); // Start true to handle redirect
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleRedirect = async () => {
        try {
            const result = await getGoogleRedirectResult();
            if (result) {
                // This means the user is coming back from a redirect
                toast({
                    title: 'Login Successful!',
                    description: 'Welcome to EduConnect Pro.',
                });
                router.push('/dashboard/teacher');
            } else {
                // This means the page loaded without a redirect result
                setGoogleLoading(false);
            }
        } catch(error: any) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: 'There was a problem with Google Sign-In.',
            });
            setGoogleLoading(false);
        }
    }
    handleRedirect();
  }, [router, toast]);


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
      router.push('/dashboard/teacher');
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
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle(!!isMobile);
      // If signInWithPopup returns a result, it means we are on desktop
      if (result) {
        toast({
            title: 'Login Successful!',
            description: 'Welcome to EduConnect Pro.',
        });
        router.push('/dashboard/teacher');
      }
      // If on mobile, signInWithRedirect was called, and the useEffect will handle the result.
      // We don't setGoogleLoading(false) here because the page will redirect.
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem with Google Sign-In.',
      });
      setGoogleLoading(false);
    }
  };

  if (isGoogleLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Icons.logo className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Tutor Login</CardTitle>
          <CardDescription>Access your teacher dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tutor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || isGoogleLoading}
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
                disabled={isLoading || isGoogleLoading}
              />
            </div>
          </div>
          <Button onClick={handleEmailLogin} className="mt-6 w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1">
            <Button variant="outline" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
                {isGoogleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Google
            </Button>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Want to become a tutor?{' '}
            <Link
              href="/signup"
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
