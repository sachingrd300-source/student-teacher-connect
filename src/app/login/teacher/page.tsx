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
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Briefcase } from 'lucide-react';
import { nanoid } from 'nanoid';

export default function TeacherLoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
        router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleSuccessfulLogin = async (userCredential: UserCredential) => {
    if (!firestore || !auth) return;
    const loggedInUser = userCredential.user;
    const userRef = doc(firestore, 'users', loggedInUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().role === 'student') {
        setError('This account is registered as a student. Please use the student login.');
        await auth.signOut();
    } else {
        router.replace('/dashboard');
    }
  };


  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    if (!auth) {
      setError('Firebase services are not available.');
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleSuccessfulLogin(userCredential);
    } catch (error: any) {
       if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Invalid login credentials. Please check your email and password.');
      } else {
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    if (!auth || !firestore) {
      setError('Firebase services are not available.');
      setIsLoading(false);
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userRef = doc(firestore, `users/${user.uid}`);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const userProfileData = {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0],
          email: user.email,
          role: 'teacher', // Default to teacher for Google sign-in on teacher page
          teacherType: 'coaching', // Default management focus
          createdAt: new Date().toISOString(),
          coins: 0,
          streak: 0,
          lastLoginDate: '',
          referralCode: nanoid(8).toUpperCase(),
        };
        await setDoc(userRef, userProfileData);
        router.replace('/dashboard');
      } else {
         const userData = userSnap.data();
        if (userData.role === 'student') {
            setError('This account is registered as a student. Please use the student login.');
            if(auth) {
                await auth.signOut();
            }
        } else {
          router.replace('/dashboard');
        }
      }
    } catch (error: any)
    {
        if (error.code !== 'auth/popup-closed-by-user') {
            setError(error.message);
        }
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading || user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40">
      <div className="w-full max-w-sm p-4 sm:p-0">
        <div className="text-center mb-6">
            <Link href="/" className="inline-block">
              <Briefcase className="w-12 h-12 mx-auto text-primary" />
            </Link>
            <h1 className="text-3xl font-bold font-serif text-foreground mt-2">Teacher Portal</h1>
            <p className="text-muted-foreground">Sign in to your teacher account.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Teacher Login</CardTitle>
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Login'}
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
              Sign in with Google
            </Button>
            
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="underline font-semibold">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
