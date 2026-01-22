
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createUserProfileDocument = async (user: any, additionalData: any) => {
    if (!user) return;
    const userRef = doc(firestore, `users/${user.uid}`);
    const { name, email } = additionalData;
    const createdAt = new Date();
    const dataToSet = {
      id: user.uid,
      name,
      email,
      role: 'tutor', // Hardcoded to 'tutor' for this page
      createdAt,
      status: 'pending_verification',
    };
    setDocumentNonBlocking(userRef, dataToSet, { merge: true });
  };

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfileDocument(user, { name, email });
      router.push('/dashboard'); // Redirect to dashboard after signup
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Teacher Signup</CardTitle>
          <CardDescription>
            Enter your information to create a teacher account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm font-medium text-destructive mb-4">{error}</p>
          )}
          <form onSubmit={handleSignUp} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full-name">Full name</Label>
              <Input
                id="full-name"
                placeholder="John Doe"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <Button type="submit" className="w-full">
              Create a Teacher Account
            </Button>
          </form>
           <div className="mt-4 text-center text-sm">
             Are you a student?{' '}
            <Link href="/signup/student" className="underline">
              Sign up with a Student ID
            </Link>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
