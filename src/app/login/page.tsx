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
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { School } from 'lucide-react';

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!auth || !firestore) {
      setError('Firebase services are not available. Please try again later.');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard'); 
    } catch (error: any) {
       if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Invalid login credentials. Please check your email and password.');
      } else {
        setError(error.message);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    if (!auth || !firestore) {
      setError('Firebase services are not available. Please try again later.');
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userRef = doc(firestore, `users/${user.uid}`);
      const userSnap = await getDoc(userRef);

      // If it's a new user, create their profile as an approved student.
      if (!userSnap.exists()) {
        const userProfileData = {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0],
          email: user.email,
          role: 'student', 
          createdAt: serverTimestamp(),
          status: 'approved',
        };
        await setDoc(userRef, userProfileData);
      }
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary">
      <div className="w-full max-w-sm p-4 sm:p-8 space-y-4">
        <div className="text-center">
            <School className="w-12 h-12 mx-auto text-primary" />
            <h1 className="text-3xl font-bold font-serif text-foreground mt-2">EduConnect Pro</h1>
            <p className="text-muted-foreground">Welcome back! Please sign in to continue.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
            <form onSubmit={handleLogin} className="grid gap-4">
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
                Login
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
              Sign in with Google
            </Button>
            
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
