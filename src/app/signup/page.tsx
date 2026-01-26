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
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { School } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  // Common fields
  const [role, setRole] = useState<'teacher' | 'student'>('teacher');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Student-specific fields - Now handled in profile page
  // const [studentFatherName, setStudentFatherName] = useState('');
  // const [studentMobileNumber, setStudentMobileNumber] = useState('');
  // const [studentAddress, setStudentAddress] = useState('');
  // const [studentDateOfBirth, setStudentDateOfBirth] = useState('');
  // const [studentClassLevel, setStudentClassLevel] = useState('');

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSigningUp(true);

    if (!auth || !firestore) {
      setError('Firebase Auth is not available. Please try again later.');
      setIsSigningUp(false);
      return;
    }

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      const userRef = doc(firestore, `users/${user.uid}`);
      
      let dataToSet;
      if (role === 'teacher') {
        dataToSet = {
          id: user.uid,
          name,
          email,
          role: 'tutor',
          createdAt: serverTimestamp(),
          status: 'pending_verification',
        };
      } else { // Simplified Student signup
        dataToSet = {
            id: user.uid,
            name: name.trim(),
            email: email.trim(), 
            role: 'student',
            createdAt: serverTimestamp(),
            status: 'approved', // Students are auto-approved on self-signup
        };
      }
      await setDoc(userRef, dataToSet);
      
      router.push('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please try another email or log in.');
      } else if (error.code === 'auth/weak-password') {
        setError('The password is too weak. Please use at least 6 characters.');
      } else {
        setError(error.message);
      }
    } finally {
        setIsSigningUp(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary py-12">
      <div className="w-full max-w-lg p-4 sm:p-8 space-y-4">
          <div className="text-center">
              <School className="w-12 h-12 mx-auto text-primary" />
              <h1 className="text-3xl font-bold font-serif text-foreground mt-2">EduConnect Pro</h1>
              <p className="text-muted-foreground">Become a part of our learning community.</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-serif">Create an Account</CardTitle>
              <CardDescription>
                Select your role and fill out the form to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <p className="text-sm font-medium text-destructive mb-4">{error}</p>
              )}
              <form onSubmit={handleSignUp} className="grid gap-4">
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
                   <p className="text-xs text-muted-foreground">Your password must be at least 6 characters long.</p>
                </div>
                
                <Button type="submit" className="w-full" disabled={isSigningUp}>
                  {isSigningUp ? 'Creating Account...' : 'Create Account'}
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
