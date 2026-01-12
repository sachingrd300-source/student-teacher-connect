
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
import { signupWithEmail } from '@/firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/firebase';

export default function SignUpStudentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !name) {
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
        role: 'student',
        status: 'approved', // Students are auto-approved
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

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwbGVhcm5pbmd8ZW58MHx8fHwxNzE4NzUyMjg2fDA&ixlib=rb-4.0.3&q=80&w=1080"
        alt="Student learning"
        fill
        className="object-cover"
        data-ai-hint="student learning"
      />
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
          <Button onClick={handleSignup} className="mt-6 w-full" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Button>

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
