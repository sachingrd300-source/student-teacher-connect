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
import { doc, setDoc } from 'firebase/firestore';
import { User as UserIcon } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [managementFocus, setManagementFocus] = useState<'coaching' | 'school'>('coaching');
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userRef = doc(firestore, `users/${user.uid}`);
      
      const dataToSet: { [key: string]: any } = {
          id: user.uid,
          name: name.trim(),
          email: email.trim(), 
          role: role,
          createdAt: new Date().toISOString(),
          coins: 0,
          streak: 0,
          lastLoginDate: '',
      };

      if (role === 'teacher') {
        dataToSet.teacherType = managementFocus;
      }
      
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
                <UserIcon className="w-12 h-12 mx-auto text-primary" />
            </Link>
            <h1 className="text-3xl font-bold font-serif text-foreground mt-2">Create an Account</h1>
            <p className="text-muted-foreground">Join our community as a student or a teacher.</p>
          </div>
          <Card>
            <CardHeader>
                <CardTitle className="text-xl font-serif">Sign Up</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <p className="text-sm font-medium text-destructive mb-4">{error}</p>
              )}
              <form onSubmit={handleSignUp} className="grid gap-4">
                <div className="grid gap-2">
                  <Label>I am a...</Label>
                  <RadioGroup defaultValue="student" onValueChange={(value) => setRole(value as 'student' | 'teacher')} className="flex gap-4 pt-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="student" id="role-student" />
                      <Label htmlFor="role-student">Student</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="teacher" id="role-teacher" />
                      <Label htmlFor="role-teacher">Teacher</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <AnimatePresence>
                  {role === 'teacher' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="grid gap-2 overflow-hidden"
                    >
                      <div className="grid gap-2">
                        <Label>I want to manage...</Label>
                        <RadioGroup defaultValue="coaching" onValueChange={(value) => setManagementFocus(value as 'coaching' | 'school')} className="flex gap-4 pt-1">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="coaching" id="focus-coaching" />
                            <Label htmlFor="focus-coaching">My Coaching</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="school" id="focus-school" />
                            <Label htmlFor="focus-school">A School</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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
                
                <Button type="submit" className="w-full mt-2" disabled={isSigningUp}>
                  {isSigningUp ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="underline font-semibold">
                  Student Login
                </Link>
                 {' or '}
                 <Link href="/login/teacher" className="underline font-semibold">
                  Teacher Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
