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
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp } from 'firebase/firestore';
import { School } from 'lucide-react';

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createUserProfileDocument = (user: any, additionalData: any) => {
    if (!user || !firestore) return;
    const userRef = doc(firestore, `users/${user.uid}`);
    const { name, email } = additionalData;
    
    const dataToSet = {
      id: user.uid,
      name,
      email,
      role: 'tutor', // Hardcoded to 'tutor' for this page
      createdAt: serverTimestamp(),
      status: 'pending_verification',
    };
    setDocumentNonBlocking(userRef, dataToSet, { merge: true });
  };

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!auth) {
      setError('Firebase Auth is not available. Please try again later.');
      return;
    }

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      createUserProfileDocument(user, { name, email });
      router.push('/dashboard'); // Redirect to dashboard after signup
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary">
      <div className="w-full max-w-sm p-8 space-y-4">
          <div className="text-center">
              <School className="w-12 h-12 mx-auto text-primary" />
              <h1 className="text-3xl font-bold font-serif text-foreground mt-2">EduConnect Pro</h1>
              <p className="text-muted-foreground">Become a part of our learning community.</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-serif">Create a Teacher Account</CardTitle>
              <CardDescription>
                Fill out the form below to get started. Students must be added by a teacher.
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
                  Create Account
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="underline">
                  Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
