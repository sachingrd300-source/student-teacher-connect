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
import { useAuth } from '@/firebase';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { School } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const [credential, setCredential] = useState(''); // Used for both email and student ID
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!auth) {
      setError('Firebase Auth is not available. Please try again later.');
      return;
    }

    let emailToLogin;
    if (role === 'student') {
      // A student might be logging in with their email OR their custom studentLoginId
      const isEmail = credential.includes('@');
      // If it's not an email, we assume it's a studentLoginId and append the domain.
      emailToLogin = isEmail ? credential : `${credential}@educonnect.pro`;
    } else {
      // Teachers always log in with email.
      emailToLogin = credential;
    }

    try {
      await signInWithEmailAndPassword(auth, emailToLogin, password);
      router.push('/dashboard'); 
    } catch (error: any) {
       if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Invalid login credentials. Please check your ID/Email and password.');
      } else {
        setError(error.message);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    if (!auth) {
      setError('Firebase Auth is not available. Please try again later.');
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
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
              Select your role and enter your credentials to access your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
            <form onSubmit={handleLogin} className="grid gap-4">
              <div className="grid gap-2">
                <Label>I am a...</Label>
                <RadioGroup defaultValue="teacher" onValueChange={(value: 'teacher' | 'student') => setRole(value)} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="teacher" id="r1" />
                    <Label htmlFor="r1">Teacher</Label>
                  </div>
                   <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="r2" />
                    <Label htmlFor="r2">Student</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="credential">{role === 'teacher' ? 'Email' : 'Email or Student Login ID'}</Label>
                <Input
                  id="credential"
                  type="text"
                  placeholder={role === 'teacher' ? 'm@example.com' : 'your@email.com or Login ID'}
                  required
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder={role === 'student' ? 'Password is your Date of Birth (YYYY-MM-DD)' : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
            {role === 'teacher' && (
              <>
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
              </>
            )}
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="underline">
                Sign up as a Teacher
              </Link>
            </div>
             <div className="mt-2 text-center text-sm">
              New student?{' '}
              <Link href="/signup/student" className="underline">
                Sign up here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    