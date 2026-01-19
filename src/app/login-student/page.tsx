'use client';

import { useState, useEffect } from 'react';
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
import { loginWithGoogle, loginWithEmail, getGoogleRedirectResult } from '@/firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


export default function StudentLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setGoogleLoading] = useState(true); // Start true to handle redirect
  const isMobile = useIsMobile();
  const studentLoginBg = PlaceHolderImages.find(img => img.id === 'hero-2');
  
  useEffect(() => {
    const handleRedirect = async () => {
        try {
            const result = await getGoogleRedirectResult();
            if (result) {
                // This means user is coming back from redirect
                const { user } = result;
                 const userDocRef = doc(firestore, 'users', user.uid);
                 const userDoc = await getDoc(userDocRef);
        
                if (!userDoc.exists()) {
                    const newUserData = {
                        id: user.uid,
                        name: user.displayName,
                        email: user.email,
                        role: 'student' as const,
                        status: 'approved' as const,
                        marketplaceStatus: 'unverified' as const,
                        createdAt: serverTimestamp(),
                    };
                    setDoc(userDocRef, newUserData)
                        .catch(error => {
                             errorEmitter.emit('permission-error', new FirestorePermissionError({
                                path: userDocRef.path,
                                operation: 'create',
                                requestResourceData: newUserData
                            }));
                        });
                }

                toast({
                    title: 'Login Successful!',
                    description: 'Welcome to EduConnect Pro.',
                });
                router.push('/dashboard/student');
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
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle(!!isMobile);
      if (result) { // This will only be true for desktop popup
        const { user } = result;

        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            const newUserData = {
                id: user.uid,
                name: user.displayName,
                email: user.email,
                role: 'student' as const,
                status: 'approved' as const,
                marketplaceStatus: 'unverified' as const,
                createdAt: serverTimestamp(),
            };
            setDoc(userDocRef, newUserData)
                .catch(error => {
                        errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: userDocRef.path,
                        operation: 'create',
                        requestResourceData: newUserData
                    }));
                });
        }

        toast({
          title: 'Login Successful!',
          description: 'Welcome to EduConnect Pro.',
        });
        router.push('/dashboard/student');
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
        <div className="relative flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
            {studentLoginBg && (
                <Image
                    src={studentLoginBg.imageUrl}
                    alt={studentLoginBg.description}
                    data-ai-hint={studentLoginBg.imageHint}
                    fill
                    className="object-cover"
                />
            )}
            <div className="absolute inset-0 bg-black/60 z-10"></div>
            <div className="z-20">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        </div>
      )
  }

  return (
     <div className="relative flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
        {studentLoginBg && (
            <Image
                src={studentLoginBg.imageUrl}
                alt={studentLoginBg.description}
                data-ai-hint={studentLoginBg.imageHint}
                fill
                className="object-cover"
            />
        )}
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
                <span className="bg-card px-2 text-muted-foreground">
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
