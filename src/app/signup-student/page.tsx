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
import { signupWithEmail, loginWithGoogle, getGoogleRedirectResult } from '@/firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function SignUpStudentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setGoogleLoading] = useState(true);
  const isMobile = useIsMobile();
  const studentSignupBg = PlaceHolderImages.find(img => img.id === 'hero-1');
  
  useEffect(() => {
    const handleRedirect = async () => {
        try {
            const result = await getGoogleRedirectResult();
            if (result) {
                const { user } = result;
                 const userDocRef = doc(firestore, 'users', user.uid);
                 const userDoc = await getDoc(userDocRef);
        
                if (!userDoc.exists()) {
                    await setDoc(userDocRef, {
                        id: user.uid,
                        name: user.displayName,
                        email: user.email,
                        role: 'student',
                        status: 'approved',
                        marketplaceStatus: 'unverified',
                        createdAt: serverTimestamp(),
                    });
                }

                toast({
                    title: 'Login Successful!',
                    description: 'Welcome to EduConnect Pro.',
                });
                router.push('/dashboard/student');
            } else {
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

  const handleSignup = async () => {
    if (!email || !password || !name || !mobileNumber) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all fields.',
      });
      return;
    }
    setIsLoading(true);
    try {
      const { user } = await signupWithEmail(email, password);

      await setDoc(doc(firestore, 'users', user.uid), {
        id: user.uid,
        name: name,
        email: email,
        mobileNumber: mobileNumber,
        role: 'student',
        status: 'approved', // Students are auto-approved
        marketplaceStatus: 'unverified',
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Signup Successful!',
        description: 'Welcome to EduConnect Pro. Redirecting to your dashboard...',
      });
      router.push('/dashboard/student');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description:
          error.code === 'auth/email-already-in-use'
            ? 'This email is already registered.'
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
            await setDoc(userDocRef, {
                id: user.uid,
                name: user.displayName,
                email: user.email,
                role: 'student',
                status: 'approved',
                marketplaceStatus: 'unverified',
                createdAt: serverTimestamp(),
            });
        }

        toast({
          title: 'Signup Successful!',
          description: 'Welcome to EduConnect Pro.',
        });
        router.push('/dashboard/student');
      }
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
            {studentSignupBg && (
                <Image
                    src={studentSignupBg.imageUrl}
                    alt={studentSignupBg.description}
                    fill
                    className="object-cover"
                    data-ai-hint={studentSignupBg.imageHint}
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
      {studentSignupBg && (
        <Image
            src={studentSignupBg.imageUrl}
            alt={studentSignupBg.description}
            fill
            className="object-cover"
            data-ai-hint={studentSignupBg.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-black/60 z-10"></div>

      <Card className="w-full max-w-md shadow-2xl z-20">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Icons.logo className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">
            Create Your Student Account
          </CardTitle>
          <CardDescription>
            Join EduConnect Pro to start learning today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                type="tel"
                placeholder="Enter your mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                disabled={isLoading}
              />
            </div>
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
          <Button onClick={handleSignup} className="mt-6 w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
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
                <Button variant="outline" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
                    {isGoogleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Google
                </Button>
            </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login-student"
              className="font-semibold text-primary hover:underline"
            >
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
