'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { School } from 'lucide-react';

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
        router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSigningUp(true);

    if (!auth || !firestore) {
      setError('Firebase is not available. Please try again later.');
      setIsSigningUp(false);
      return;
    }

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      const userRef = doc(firestore, `users/${user.uid}`);
      
      const dataToSet = {
          id: user.uid,
          name: name.trim(),
          email: email.trim(), 
          createdAt: serverTimestamp(),
      };
      
      await setDoc(userRef, dataToSet);
      
      // The useEffect will handle the redirect.
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please log in or use a different email.');
      } else if (error.code === 'auth/weak-password') {
        setError('The password is too weak. Please use at least 6 characters.');
      } else {
        setError(error.message);
      }
    } finally {
        setIsSigningUp(false);
    }
  };

  if (isUserLoading || user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 py-12">
      <div className="w-full max-w-sm p-4 sm:p-0">
          <div className="text-center mb-6">
            <Link href="/" className="inline-block">
                <School className="w-12 h-12 mx-auto text-primary" />
            </Link>
            <h1 className="text-3xl font-bold font-serif text-foreground mt-2">Create an Account</h1>
            <p className="text-muted-foreground">Join us to get started.</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-serif">
                User Registration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <p className="text-sm font-medium text-destructive mb-4">{error}</p>
              )}
              <form onSubmit={handleSignUp} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input id="full-name" placeholder="John Doe" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                   <p className="text-xs text-muted-foreground">Password must be at least 6 characters long.</p>
                </div>
                
                <Button type="submit" className="w-full" disabled={isSigningUp}>
                  {isSigningUp ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="underline font-semibold">
                  Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
